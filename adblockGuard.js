// JERNEL SYSTEMS // VIGILANTE DE DNS ANTI-ANUNCIOS
// Mantiene el DNS privado aplicado aunque el equipo lo revierta al reiniciar
// (OEM, cambio de red, etc.). Guarda el estado en data/adblock-config.json para
// sobrevivir también a reinicios de este servidor.
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'adblock-config.json');

const RECONCILE_INTERVAL_MS = 30 * 1000;
// No golpear ADB cada ciclo si la TV está apagada: reintento de conexión cada 2 min.
const RECONNECT_INTERVAL_MS = 2 * 60 * 1000;

const DEFAULT_STATE = {
  enabled: false,
  provider: null,
  host: '',
  autoReconnect: true,
  updatedAt: null
};

class AdblockGuard {
  constructor(adbManager, deviceHistory, { intervalMs = RECONCILE_INTERVAL_MS, onEvent = null } = {}) {
    this.adb = adbManager;
    this.history = deviceHistory;
    this.intervalMs = intervalMs;
    this.onEvent = onEvent;

    this.state = this.readState();
    this.configMtime = this.statMtime();
    this.timer = null;
    this.running = false;

    this.lastCheck = null;
    this.lastAppliedAt = null;
    this.lastError = null;
    this.lastReconnectAt = 0;
    this.synced = false;
  }

  readState() {
    try {
      if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE };

      return {
        enabled: parsed.enabled === true,
        provider: typeof parsed.provider === 'string' ? parsed.provider : null,
        host: typeof parsed.host === 'string' ? parsed.host : '',
        autoReconnect: parsed.autoReconnect !== false,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null
      };
    } catch (err) {
      console.error('Configuración de Ad-Block ilegible, se reinicia:', err.message);
      return { ...DEFAULT_STATE };
    }
  }

  statMtime() {
    try {
      return fs.statSync(CONFIG_FILE).mtimeMs;
    } catch (err) {
      return 0;
    }
  }

  // La CLI escribe el mismo archivo en otro proceso: si cambió, se recarga.
  reloadIfChanged() {
    const mtime = this.statMtime();
    if (mtime && mtime !== this.configMtime) {
      this.configMtime = mtime;
      this.state = this.readState();
      this.notify('adblock_guard_changed', this.status());
    }
  }

  writeState() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${CONFIG_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(tmpFile, CONFIG_FILE);
    this.configMtime = this.statMtime();
  }

  notify(type, payload) {
    if (typeof this.onEvent === 'function') {
      try {
        this.onEvent(type, payload);
      } catch (err) {
        console.error('Evento de Ad-Block falló:', err.message);
      }
    }
  }

  getState() {
    return { ...this.state };
  }

  status() {
    return {
      ...this.state,
      intervalMs: this.intervalMs,
      connected: !!this.adb.connectedDevice,
      synced: this.state.enabled && this.synced,
      lastCheck: this.lastCheck,
      lastAppliedAt: this.lastAppliedAt,
      lastError: this.lastError
    };
  }

  // Guarda el DNS elegido por el usuario y activa la vigilancia.
  async setDesired(provider, customHost = '') {
    const resolved = await this.adb.resolveDnsProvider(provider, customHost);
    if (resolved.error) return { success: false, message: resolved.error };

    if (resolved.mode !== 'hostname') {
      this.state = {
        ...this.state,
        enabled: false,
        provider: resolved.provider,
        host: '',
        updatedAt: new Date().toISOString()
      };
      this.writeState();
      this.synced = false;
      this.lastError = null;
      this.notify('adblock_guard_changed', this.status());
      return { success: true, enabled: false, message: `El DNS quedó en modo ${resolved.mode}: no hay filtro que mantener.` };
    }

    this.state = {
      ...this.state,
      enabled: true,
      provider: resolved.provider,
      host: resolved.host,
      updatedAt: new Date().toISOString()
    };
    this.writeState();

    this.synced = false;
    this.lastError = null;
    this.notify('adblock_guard_changed', this.status());

    return {
      success: true,
      enabled: true,
      provider: resolved.provider,
      host: resolved.host,
      message: `Vigilancia activada para ${resolved.host}`
    };
  }

  // Activa/desactiva la vigilancia sin tocar el DNS actual del equipo.
  async setEnabled(enabled) {
    if (!enabled) return this.disable('Vigilancia de DNS desactivada');

    let host = this.state.host;

    // Si nunca se guardó un host, adopta el que esté activo en la TV.
    if (!host && this.adb.connectedDevice) {
      const current = await this.adb.getPrivateDns();
      if (current && current.mode === 'hostname' && current.specifier) {
        host = current.specifier;
      }
    }

    if (!host) {
      return {
        success: false,
        message: 'Primero aplica un proveedor de DNS anti-anuncios; aún no hay un host que mantener.'
      };
    }

    this.state = { ...this.state, enabled: true, host, updatedAt: new Date().toISOString() };
    this.writeState();
    this.lastError = null;
    this.notify('adblock_guard_changed', this.status());

    const result = await this.reconcile({ force: true });

    return {
      success: true,
      enabled: true,
      host,
      reconcile: result,
      message: result.applied
        ? `Vigilancia activada y DNS reaplicado (${host})`
        : `Vigilancia activada para ${host}`
    };
  }

  disable(message = 'Vigilancia de DNS desactivada') {
    this.state = {
      ...this.state,
      enabled: false,
      updatedAt: new Date().toISOString()
    };
    this.writeState();
    this.synced = false;
    this.notify('adblock_guard_changed', this.status());
    return { success: true, enabled: false, message };
  }

  start() {
    if (this.timer) return;
    this.reconcile();
    this.timer = setInterval(() => this.reconcile(), this.intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // Reaplica el DNS solo cuando el equipo se desvía del host deseado.
  async reconcile({ force = false } = {}) {
    this.lastCheck = new Date().toISOString();
    this.reloadIfChanged();

    if (!this.state.enabled || !this.state.host) {
      return { checked: false, applied: false, reason: 'Vigilancia desactivada' };
    }
    if (this.running) {
      return { checked: false, applied: false, reason: 'Comprobación en curso' };
    }

    this.running = true;
    try {
      if (!this.adb.connectedDevice) {
        if (!this.state.autoReconnect) {
          return { checked: false, applied: false, reason: 'TV desconectada y reconexión automática desactivada' };
        }

        const now = Date.now();
        if (!force && now - this.lastReconnectAt < RECONNECT_INTERVAL_MS) {
          return { checked: false, applied: false, reason: 'Esperando para reconectar con la TV' };
        }
        this.lastReconnectAt = now;

        // 1) Equipo ya adjunto (ADB por mDNS sobrevive a reinicios y cambios de
        //    puerto). 2) Si no, se reintenta la última IP/puerto del historial.
        let connectedTarget = await this.adb.ensureDevice();

        if (!connectedTarget) {
          const last = this.history.list()[0];
          if (!last) {
            this.lastError = 'No hay una TV en el historial para reconectar.';
            return { checked: false, applied: false, reason: this.lastError };
          }

          const connection = await this.adb.connect(last.ip, last.port);
          if (!connection.success) {
            this.lastError = `TV no disponible en ${last.ip}:${last.port}`;
            return { checked: false, applied: false, reason: this.lastError };
          }
          connectedTarget = connection.target;
        } else {
          // Refresca los datos del equipo adoptado para la UI.
          await this.adb.getDeviceInfo();
        }

        this.synced = false;
        this.notify('adblock_guard_reconnected', { target: connectedTarget, info: this.adb.deviceInfo });
      }

      const current = await this.adb.getPrivateDns();
      if (!current) {
        this.lastError = 'No se pudo leer el DNS del equipo.';
        return { checked: true, applied: false, reason: this.lastError };
      }

      if (current.mode === 'hostname' && current.specifier === this.state.host) {
        this.synced = true;
        this.lastError = null;
        return { checked: true, applied: false, dns: current };
      }

      const result = await this.adb.setPrivateDns('custom', this.state.host);
      if (result.success) {
        this.lastAppliedAt = new Date().toISOString();
        this.synced = true;
        this.lastError = null;
        this.notify('adblock_guard_reapplied', {
          host: this.state.host,
          previous: { mode: current.mode, specifier: current.specifier }
        });
        return { checked: true, applied: true, dns: result.verified };
      }

      this.synced = false;
      this.lastError = result.message;
      return { checked: true, applied: false, reason: result.message };
    } catch (err) {
      this.synced = false;
      this.lastError = err.message;
      return { checked: true, applied: false, reason: err.message };
    } finally {
      this.running = false;
    }
  }
}

module.exports = AdblockGuard;
module.exports.CONFIG_FILE = CONFIG_FILE;
module.exports.RECONCILE_INTERVAL_MS = RECONCILE_INTERVAL_MS;
