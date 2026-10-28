const net = require('net');
const os = require('os');
const { exec } = require('child_process');
const EventEmitter = require('events');

class NetworkScanner extends EventEmitter {
  constructor() {
    super();
    this.isScanning = false;
    this.abortScan = false;
    this.knownOuis = {
      'f4:f5:e8': 'Google',
      'd8:6c:63': 'Google',
      '54:60:09': 'Google',
      '60:3e:5f': 'Chromecast / Google',
      '00:09:df': 'Sony TV',
      'fc:f1:36': 'Sony TV',
      'ac:9b:0a': 'Sony TV',
      '20:34:fb': 'TCL Smart TV',
      '00:e0:4c': 'Realtek / Smart TV',
      'd4:61:9d': 'Xiaomi',
      '64:cc:2e': 'Xiaomi Mi TV',
      '74:51:ba': 'Amazon Fire TV',
      'fc:a1:83': 'Amazon Fire TV',
      'b8:27:eb': 'Raspberry Pi / Box',
      'dc:a6:32': 'Raspberry Pi / Box'
    };
  }

  getLocalNetworks() {
    const interfaces = os.networkInterfaces();
    const networks = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          const ipParts = addr.address.split('.').map(Number);
          const maskParts = (addr.netmask || '255.255.255.0').split('.').map(Number);
          const baseIp = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;

          networks.push({
            name,
            ip: addr.address,
            netmask: addr.netmask,
            baseSubnet: baseIp,
            range: `${baseIp}.1 - ${baseIp}.254`
          });
        }
      }
    }
    return networks;
  }

  async getArpTable() {
    return new Promise((resolve) => {
      exec('arp -a', (err, stdout) => {
        if (err || !stdout) return resolve(new Map());
        const map = new Map();
        const lines = stdout.split('\n');
        for (const line of lines) {
          // ? (192.168.6.27) at 60:3e:5f:1d:c:8a on en0
          const match = line.match(/\((192\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-fA-F:]+)/i);
          if (match) {
            const ip = match[1];
            let mac = match[2].toLowerCase();
            // Normalizar MAC de formato corto (ej 60:3e:5f:1d:c:8a -> 60:3e:5f:1d:0c:8a)
            mac = mac.split(':').map(b => b.padStart(2, '0')).join(':');
            map.set(ip, mac);
          }
        }
        resolve(map);
      });
    });
  }

  lookupVendor(mac) {
    if (!mac) return 'Desconocido';
    const prefix = mac.substring(0, 8).toLowerCase();
    return this.knownOuis[prefix] || 'Dispositivo de Red';
  }

  checkPort(ip, port, timeout = 700) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = false;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        status = true;
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, ip);
    });
  }

  async scanDevice(ip, arpMap) {
    // Puertos relevantes para Android TV:
    // 5555: ADB estándar
    // 8008, 8009: Google Cast / DIAL (común en Chromecast y Android TV)
    // 6466, 6467: Android TV Remote Control Protocol v2
    const ports = [5555, 8008, 8009, 6466];
    const results = {};
    let hasOpenPort = false;

    for (const port of ports) {
      if (this.abortScan) break;
      const isOpen = await this.checkPort(ip, port, 600);
      results[port] = isOpen;
      if (isOpen) hasOpenPort = true;
    }

    const mac = arpMap.get(ip) || null;
    const vendor = this.lookupVendor(mac);

    const isAdbReady = !!results[5555];
    const isCastDevice = !!(results[8008] || results[8009] || results[6466]);
    const isLikelyAndroidTv = isAdbReady || isCastDevice || vendor.includes('Google') || vendor.includes('TV');

    return {
      ip,
      mac,
      vendor,
      ports: results,
      hasOpenPort,
      isAdbReady,
      isCastDevice,
      isLikelyAndroidTv
    };
  }

  async scanSubnet(baseSubnet = null, start = 1, end = 254) {
    if (this.isScanning) {
      return { success: false, message: 'Un escaneo ya está en progreso.' };
    }

    const startInt = Number(start);
    const endInt = Number(end);
    if (!Number.isInteger(startInt) || !Number.isInteger(endInt) || startInt < 1 || endInt > 254 || startInt > endInt) {
      return { success: false, message: 'Rango de escaneo inválido. Debe cumplir 1 <= start <= end <= 254' };
    }

    this.isScanning = true;
    this.abortScan = false;

    // Detectar subred si no se provee
    if (!baseSubnet) {
      const nets = this.getLocalNetworks();
      baseSubnet = nets.length > 0 ? nets[0].baseSubnet : '192.168.1';
    }

    this.emit('scan_started', { baseSubnet, start: startInt, end: endInt });

    const arpMap = await this.getArpTable();
    const discovered = [];
    const targets = [];

    for (let i = startInt; i <= endInt; i++) {
      targets.push(`${baseSubnet}.${i}`);
    }

    const concurrency = 25;
    let completed = 0;

    const worker = async (targetIp) => {
      if (this.abortScan) return;
      const dev = await this.scanDevice(targetIp, arpMap);
      completed++;

      this.emit('scan_progress', {
        current: completed,
        total: targets.length,
        percent: Math.round((completed / targets.length) * 100),
        checkedIp: targetIp
      });

      if (dev.isAdbReady || dev.isLikelyAndroidTv || dev.hasOpenPort) {
        discovered.push(dev);
        this.emit('device_found', dev);
      }
    };

    // Procesar en chunks concurrentes
    for (let i = 0; i < targets.length; i += concurrency) {
      if (this.abortScan) break;
      const chunk = targets.slice(i, i + concurrency);
      await Promise.all(chunk.map(worker));
    }

    this.isScanning = false;

    if (this.abortScan) {
      // El escáner fue cancelado por el usuario: notificar cancelación sin falso "completado"
      this.emit('scan_aborted', {});
      return { success: true, aborted: true, totalDiscovered: 0, devices: [] };
    }

    this.emit('scan_completed', { totalFound: discovered.length, devices: discovered });

    return {
      success: true,
      totalDiscovered: discovered.length,
      devices: discovered
    };
  }

  stopScan() {
    if (this.isScanning) {
      this.abortScan = true;
      this.isScanning = false;
      return true;
    }
    return false;
  }
}

module.exports = new NetworkScanner();
