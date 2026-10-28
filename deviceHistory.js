// JERNEL SYSTEMS // HISTORIAL DE DISPOSITIVOS
// Persistencia local (data/device-history.json) de las TVs conectadas.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'device-history.json');
const MAX_ENTRIES = 20;

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizePort(port) {
  const value = Number(port);
  return Number.isInteger(value) && value > 0 && value <= 65535 ? value : 5555;
}

function normalizeIp(ip) {
  if (typeof ip !== 'string') return null;
  const trimmed = ip.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function deviceKey(ip, port) {
  return `${ip}:${port}`;
}

// Lee el historial tolerando archivos ausentes o corruptos.
function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(entry => entry && typeof entry.ip === 'string');
  } catch (err) {
    console.error('Historial de dispositivos ilegible, se reinicia:', err.message);
    return [];
  }
}

function writeHistory(entries) {
  ensureStorage();
  const tmpFile = `${HISTORY_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(entries, null, 2), 'utf8');
  fs.renameSync(tmpFile, HISTORY_FILE);
}

function sortByRecent(entries) {
  return entries.sort((a, b) => new Date(b.lastConnected || 0) - new Date(a.lastConnected || 0));
}

function list() {
  return sortByRecent(readHistory());
}

// Registra o actualiza un dispositivo. Devuelve la entrada guardada.
function add({ ip, port = 5555, target = null, info = null } = {}) {
  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return null;

  const cleanPort = normalizePort(port);
  const entry = {
    ip: cleanIp,
    port: cleanPort,
    target: target || deviceKey(cleanIp, cleanPort),
    model: info && info.model ? info.model : null,
    brand: info && info.brand ? info.brand : null,
    androidVersion: info && info.androidVersion ? info.androidVersion : null,
    resolution: info && info.resolution ? info.resolution : null,
    lastConnected: new Date().toISOString()
  };

  const entries = readHistory().filter(item => deviceKey(item.ip, normalizePort(item.port)) !== deviceKey(cleanIp, cleanPort));
  entries.push(entry);
  const trimmed = sortByRecent(entries).slice(0, MAX_ENTRIES);
  writeHistory(trimmed);
  return entry;
}

// Elimina por clave (ip:port), ip sola o target ADB.
function remove({ ip, port, key } = {}) {
  const entries = readHistory();
  const cleanIp = normalizeIp(ip);
  const cleanPort = port === undefined || port === null || port === '' ? null : normalizePort(port);

  const remaining = entries.filter(entry => {
    const entryKey = deviceKey(entry.ip, normalizePort(entry.port));
    if (key) return entryKey !== key && entry.target !== key;
    if (!cleanIp) return true;
    if (cleanPort === null) return entry.ip !== cleanIp;
    return entryKey !== deviceKey(cleanIp, cleanPort);
  });

  if (remaining.length === entries.length) return false;
  writeHistory(sortByRecent(remaining));
  return true;
}

module.exports = {
  list,
  add,
  remove,
  deviceKey,
  HISTORY_FILE
};
