const { spawn } = require('child_process');

// AirPlay se anuncia por mDNS/Bonjour. El receptor puede estar instalado y
// corriendo en la TV y aun así no ser visible desde el iPhone si el router
// aísla clientes (AP isolation), si hay VLANs separadas o si el receptor no
// publica el servicio. Este módulo consulta el anuncio real desde el host.

const SERVICES = [
  { key: 'airplay', type: '_airplay._tcp' },
  { key: 'raop', type: '_raop._tcp' }
];

const RAOP_MAC_PREFIX = /^[0-9A-F]{12}@/i;

function normalizeName(name, serviceKey) {
  let clean = name.trim();
  if (serviceKey === 'raop') clean = clean.replace(RAOP_MAC_PREFIX, '');
  return clean;
}

function browseDarwin(service, timeoutMs) {
  return new Promise((resolve) => {
    const names = new Set();
    let buffer = '';
    let settled = false;

    const child = spawn('dns-sd', ['-B', service.type, 'local'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const finish = () => {
      if (settled) return;
      settled = true;
      try { child.kill('SIGTERM'); } catch { /* ya terminó */ }
      setTimeout(() => {
        try { child.kill('SIGKILL'); } catch { /* ya terminó */ }
      }, 300).unref?.();
      resolve({ ok: true, names: [...names] });
    };

    child.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, names: [], error: 'dns-sd no está disponible en este sistema' });
    });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // 22:32:47.775  Add  2  11 local.  _airplay._tcp.  AS-Chromecast[AirPlay]
        const match = line.match(/\sAdd\s+\d+\s+\d+\s+\S+\s+(_airplay\._tcp|_raop\._tcp)\.?\s+(.+?)\s*$/);
        if (!match || match[1] !== service.type) continue;
        names.add(normalizeName(match[2], service.key));
      }
    });

    const timer = setTimeout(finish, timeoutMs);
    timer.unref?.();
  });
}

function browseLinux(service, timeoutMs) {
  return new Promise((resolve) => {
    const names = new Set();
    let buffer = '';
    let settled = false;

    const child = spawn('avahi-browse', ['-tp', service.type], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const finish = () => {
      if (settled) return;
      settled = true;
      try { child.kill('SIGTERM'); } catch { /* ya terminó */ }
      resolve({ ok: true, names: [...names] });
    };

    child.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, names: [], error: 'avahi-browse no está disponible (instala avahi-utils)' });
    });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // +;wlan0;IPv4;AS-Chromecast[AirPlay];_airplay._tcp;local
        if (!line.startsWith('+;')) continue;
        const parts = line.split(';');
        if (parts.length < 5 || parts[4] !== service.type) continue;
        names.add(normalizeName(parts[3], service.key));
      }
    });

    const timer = setTimeout(finish, timeoutMs);
    timer.unref?.();
  });
}

async function discoverReceivers({ timeoutMs = 3000 } = {}) {
  const startedAt = Date.now();

  if (process.platform !== 'darwin' && process.platform !== 'linux') {
    return {
      success: false,
      supported: false,
      platform: process.platform,
      receivers: [],
      message: 'La detección mDNS desde el host solo está disponible en macOS y Linux.'
    };
  }

  const browse = process.platform === 'darwin' ? browseDarwin : browseLinux;
  const results = await Promise.all(SERVICES.map(service => browse(service, timeoutMs)));

  const available = results.every(result => result.ok);
  const services = {};
  const receivers = new Map();

  SERVICES.forEach((service, index) => {
    services[service.key] = results[index].names;
    for (const name of results[index].names) {
      if (!receivers.has(name)) {
        receivers.set(name, { name, services: [] });
      }
      receivers.get(name).services.push(service.key);
    }
  });

  return {
    success: available,
    supported: true,
    platform: process.platform,
    elapsedMs: Date.now() - startedAt,
    services,
    receivers: [...receivers.values()],
    message: available
      ? null
      : (results.find(result => !result.ok) || {}).error || 'No se pudo consultar mDNS'
  };
}

module.exports = { discoverReceivers };
