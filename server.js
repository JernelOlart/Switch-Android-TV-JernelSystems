const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');

const adbManager = require('./adbManager');
const networkScanner = require('./networkScanner');
const deviceHistory = require('./deviceHistory');
const airplayDiscovery = require('./airplayDiscovery');
const AdblockGuard = require('./adblockGuard');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ws re-emite los errores del servidor HTTP; sin este listener Node aborta
// con "Unhandled 'error' event" durante los reintentos de escucha.
wss.on('error', err => {
  if (err && err.code !== 'EADDRINUSE') {
    console.error('Error del canal WebSocket:', err.message);
  }
});

const PORT = process.env.PORT || 4200;

// Identidad del proceso actual: permite al panel distinguir un reinicio real
// de una respuesta del servidor anterior que aún no ha terminado de cerrar.
const BOOT_ID = crypto.randomUUID();

// Configuración de subida para APKs
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // hasta 500MB
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Broadcast a clientes WebSocket
function broadcast(type, payload) {
  const msg = JSON.stringify({ type, data: payload, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

// Vincular eventos del escáner de red al WebSocket
networkScanner.on('scan_started', data => broadcast('scan_started', data));
networkScanner.on('scan_progress', data => broadcast('scan_progress', data));
networkScanner.on('device_found', data => broadcast('device_found', data));
networkScanner.on('scan_completed', data => broadcast('scan_completed', data));
networkScanner.on('scan_aborted', () => broadcast('scan_aborted', {}));

// Vigilante de DNS: reaplica el anti-anuncios si el equipo lo revierte tras un
// reinicio o cambio de red. Persiste su estado en data/adblock-config.json.
const adblockGuard = new AdblockGuard(adbManager, deviceHistory, {
  onEvent: (type, payload) => {
    if (type === 'adblock_guard_reapplied') {
      console.log(`[AdBlock] DNS reaplicado automáticamente: ${payload.host}`);
    } else if (type === 'adblock_guard_reconnected') {
      console.log(`[AdBlock] TV reconectada para mantener el DNS: ${payload.target}`);
    }
    broadcast(type, payload);
  }
});

// --- Rutas de la API ---

// 1. Estado General
app.get('/api/status', async (req, res) => {
  const devices = await adbManager.getDevices();
  const networks = networkScanner.getLocalNetworks();
  res.json({
    adbPath: adbManager.adbPath,
    connectedDevice: adbManager.connectedDevice,
    deviceInfo: adbManager.deviceInfo,
    attachedAdbDevices: devices,
    networks,
    isScanning: networkScanner.isScanning,
    bootId: BOOT_ID
  });
});

// 2. Redes locales
app.get('/api/networks', (req, res) => {
  const networks = networkScanner.getLocalNetworks();
  res.json({ networks });
});

// 3. Iniciar Escaneo de Red
app.post('/api/scan', async (req, res) => {
  const { baseSubnet, start = 1, end = 254 } = req.body || {};
  const startInt = Number(start);
  const endInt = Number(end);

  if (!Number.isInteger(startInt) || !Number.isInteger(endInt) || startInt < 1 || endInt > 254 || startInt > endInt) {
    return res.status(400).json({ error: 'Rango de escaneo inválido. Debe cumplir 1 <= start <= end <= 254' });
  }

  if (networkScanner.isScanning) {
    return res.status(400).json({ error: 'Ya hay un escaneo en curso' });
  }

  // Responder inmediatamente y ejecutar en segundo plano
  res.json({ message: 'Escaneo iniciado' });
  networkScanner.scanSubnet(baseSubnet, startInt, endInt);
});

// 4. Detener Escaneo
app.post('/api/scan/stop', (req, res) => {
  const stopped = networkScanner.stopScan();
  res.json({ success: stopped });
});

// 5. Conectar Dispositivo ADB
app.post('/api/connect', async (req, res) => {
  const { ip, port = 5555 } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'Dirección IP requerida' });
  }

  const result = await adbManager.connect(ip.trim(), port);
  if (result.success) {
    const info = await adbManager.getDeviceInfo();
    deviceHistory.add({ ip: ip.trim(), port, target: result.target, info });
    broadcast('device_connected', { target: result.target, info });
  }
  res.json(result);
});

// 6. Desconectar Dispositivo ADB
app.post('/api/disconnect', async (req, res) => {
  const { target } = req.body;
  const result = await adbManager.disconnect(target);
  broadcast('device_disconnected', { target });
  res.json(result);
});

// 7. Emparejamiento Inalámbrico (Android 11+)
app.post('/api/pair', async (req, res) => {
  const { ip, port, code } = req.body;
  if (!ip || !port || !code) {
    return res.status(400).json({ error: 'IP, puerto y código de 6 dígitos son obligatorios' });
  }
  const result = await adbManager.pair(ip.trim(), port, code.trim());
  res.json(result);
});

// 8. Información del Dispositivo
app.get('/api/device/info', async (req, res) => {
  const info = await adbManager.getDeviceInfo();
  if (!info) {
    return res.status(404).json({ error: 'No hay dispositivo conectado o no responde' });
  }
  res.json({ info });
});

// 9. Paquetes / Aplicaciones
app.get('/api/device/packages', async (req, res) => {
  try {
    const packages = await adbManager.getPackages();
    res.json({ total: packages.length, packages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Acción sobre Paquete (disable, enable, uninstall, reinstall, force-stop, clear-data, launch)
app.post('/api/device/package/action', async (req, res) => {
  const { action, pkg } = req.body;
  if (!action || !pkg) {
    return res.status(400).json({ error: 'Acción y paquete requeridos' });
  }

  let result;
  switch (action) {
    case 'disable':
      result = await adbManager.disablePackage(pkg);
      break;
    case 'enable':
      result = await adbManager.enablePackage(pkg);
      break;
    case 'uninstall':
      result = await adbManager.uninstallPackage(pkg);
      break;
    case 'reinstall':
      result = await adbManager.reinstallPackage(pkg);
      break;
    case 'force-stop':
      result = await adbManager.forceStop(pkg);
      break;
    case 'clear-data':
      result = await adbManager.clearData(pkg);
      break;
    case 'launch':
      result = await adbManager.launchApp(pkg);
      break;
    default:
      return res.status(400).json({ error: 'Acción no reconocida' });
  }

  res.json({ action, pkg, result });
});

// 11. Tweaks: Velocidad de Animaciones
app.post('/api/device/tweaks/animations', async (req, res) => {
  const { speed = 0.5 } = req.body;
  const result = await adbManager.setAnimationsSpeed(speed);
  res.json(result);
});

// 12. Tweaks: Densidad DPI
app.post('/api/device/tweaks/density', async (req, res) => {
  const { density } = req.body;
  if (!density) return res.status(400).json({ error: 'Valor de densidad requerido' });
  const result = await adbManager.setDensity(density);
  res.json(result);
});

// 13. Tweaks: Resolución de Pantalla
app.post('/api/device/tweaks/resolution', async (req, res) => {
  const { resolution } = req.body;
  if (!resolution) return res.status(400).json({ error: 'Resolución requerida (e.g. 1920x1080 o reset)' });
  const result = await adbManager.setResolution(resolution);
  res.json(result);
});

// 14. Tweaks: Pantalla siempre encendida
app.post('/api/device/tweaks/stay-awake', async (req, res) => {
  const { enabled } = req.body;
  const result = await adbManager.setStayAwake(!!enabled);
  res.json(result);
});

// 15. Tweaks: Limpiar Cachés
app.post('/api/device/tweaks/trim-caches', async (req, res) => {
  const result = await adbManager.trimCaches();
  res.json(result);
});

// 16. Control Remoto: Teclas
app.post('/api/device/remote/key', async (req, res) => {
  const { keycode } = req.body;
  if (keycode === undefined) return res.status(400).json({ error: 'Keycode requerido' });
  const result = await adbManager.sendKeyEvent(keycode);
  res.json(result);
});

// 17. Control Remoto: Enviar Texto
app.post('/api/device/remote/text', async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string') return res.status(400).json({ error: 'Texto requerido' });
  const result = await adbManager.sendText(text);
  res.json(result);
});

// 18. Captura de Pantalla en Vivo
app.get('/api/device/screenshot', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const stream = adbManager.captureScreenshotStream();
  stream.stdout.pipe(res);
  stream.stderr.on('data', (d) => {
    // Si hay error en screencap
    console.error('Screencap stderr:', d.toString());
  });
  stream.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  });
});

// 19. Subir e Instalar APK
app.post('/api/device/install-apk', upload.single('apk'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Archivo APK no proporcionado' });
  }

  const apkPath = req.file.path;
  try {
    const result = await adbManager.installApk(apkPath);
    // Eliminar archivo temporal tras instalación
    fs.unlink(apkPath, () => {});
    res.json(result);
  } catch (err) {
    fs.unlink(apkPath, () => {});
    res.status(500).json({ error: err.message });
  }
});

// 20. Shell ADB Interactivo
app.post('/api/device/shell', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Comando requerido' });
  const result = await adbManager.shell(command);
  res.json(result);
});

// 21. Ad-Block: Estado General de Bloqueo
app.get('/api/device/adblock/status', async (req, res) => {
  try {
    const dns = await adbManager.getPrivateDns();
    const launcherAds = await adbManager.getLauncherAdsInfo();
    const persistence = await adbManager.getDnsPersistenceStatus();
    res.json({
      dns,
      launcherAdsDisabled: launcherAds ? launcherAds.disabled : false,
      launcherAds,
      persistence,
      guard: adblockGuard.status()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 22. Ad-Block: Configurar DNS Privado Anti-Anuncios
app.post('/api/device/adblock/dns', async (req, res) => {
  const { provider, customHost } = req.body;
  if (!provider) return res.status(400).json({ error: 'Proveedor de DNS requerido' });
  const result = await adbManager.setPrivateDns(provider, customHost);

  // Todo DNS con filtro queda vigilado: si el equipo lo revierte al reiniciar,
  // el servidor lo vuelve a aplicar al reconectar.
  if (result.success) {
    const watch = await adblockGuard.setDesired(provider, customHost);
    result.guard = watch.success ? adblockGuard.status() : { enabled: false, error: watch.message };

    // Con root/Magisk, el script de arranque se actualiza al nuevo host.
    if (watch.success && watch.host) {
      const root = await adbManager.getRootStatus();
      if (root.canPersistBoot) {
        result.bootScript = await adbManager.installDnsBootScript(watch.host);
      }
    }
  }

  res.json(result);
});

// 22b. Ad-Block: Persistencia tras reinicios (script de arranque + vigilancia)
app.post('/api/device/adblock/persist', async (req, res) => {
  const { enabled = true, installBootScript = true, provider, customHost } = req.body || {};

  try {
    if (provider) {
      const dnsResult = await adbManager.setPrivateDns(provider, customHost);
      if (!dnsResult.success) return res.json({ success: false, message: dnsResult.message, dns: dnsResult });
    }

    if (!enabled) {
      const watch = adblockGuard.disable('Vigilancia de DNS desactivada');
      const boot = installBootScript ? await adbManager.removeDnsBootScript() : null;
      const bootFailed = !!(boot && boot.supported && !boot.success);
      return res.json({
        success: true,
        enabled: false,
        message: bootFailed
          ? `Vigilancia desactivada, pero ${boot.message}`
          : (boot && boot.supported && boot.success
            ? 'Vigilancia y script de arranque desactivados'
            : watch.message),
        guard: adblockGuard.status(),
        bootScript: boot
      });
    }

    const watch = provider
      ? await adblockGuard.setDesired(provider, customHost)
      : await adblockGuard.setEnabled(true);

    if (!watch.success) {
      return res.json({
        success: false,
        message: watch.message,
        guard: adblockGuard.status()
      });
    }

    let bootScript = null;
    if (installBootScript) {
      const host = watch.host || adblockGuard.getState().host;
      bootScript = await adbManager.installDnsBootScript(host);
    }

    const persistence = await adbManager.getDnsPersistenceStatus();

    res.json({
      success: true,
      enabled: true,
      message: bootScript && bootScript.success
        ? bootScript.message
        : `Vigilancia activada: el servidor reaplicará el DNS ${watch.host || ''} si la TV lo pierde.`,
      bootScript,
      persistence,
      guard: adblockGuard.status()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 23. Ad-Block: Bloquear Recomendaciones y Anuncios del Home
app.post('/api/device/adblock/launcher-ads', async (req, res) => {
  const { disable } = req.body;
  const result = await adbManager.toggleLauncherAds(disable !== false);
  res.json(result);
});

// 23b. Abrir los Ajustes del sistema en la pantalla de la TV
app.post('/api/device/settings/open', async (req, res) => {
  const result = await adbManager.openTvSettings();
  res.json(result);
});

// 24. Tweaks: Límite de Procesos en Segundo Plano (Optimización RAM)
app.post('/api/device/tweaks/background-limit', async (req, res) => {
  const { limit } = req.body;
  if (limit === undefined) return res.status(400).json({ error: 'Límite requerido' });
  const result = await adbManager.setBackgroundProcessLimit(limit);
  res.json(result);
});

// 25. Instalación Asistida de Apps Curadas (SmartTube, Projectivy)
app.post('/api/device/apps/install-curated', async (req, res) => {
  const { appKey } = req.body;
  if (!appKey) return res.status(400).json({ error: 'appKey requerida' });
  const result = await adbManager.downloadAndInstallCuratedApp(appKey);
  res.json(result);
});

// 26. AirPlay / AirScreen: Comprobar Estado
app.get('/api/device/airplay/status', async (req, res) => {
  try {
    const result = await adbManager.checkAirPlayStatus();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, installed: false, message: err.message });
  }
});

// 27. AirPlay / AirScreen: Iniciar o Abrir Tienda
app.post('/api/device/airplay/setup', async (req, res) => {
  try {
    const result = await adbManager.launchOrInstallAirScreen();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 27b. AirPlay: ¿La TV se anuncia de verdad en la red local?
app.get('/api/network/airplay/scan', async (req, res) => {
  try {
    const discovery = await airplayDiscovery.discoverReceivers({ timeoutMs: 3000 });
    const info = await adbManager.getAirPlayInfo().catch(() => null);
    const model = adbManager.deviceInfo && adbManager.deviceInfo.model;
    const marker = (model || '').toLowerCase();

    const tvReceiver = discovery.receivers.find(receiver => {
      const name = receiver.name.toLowerCase();
      return name.includes('airscreen') || name.startsWith('as-') || (marker && name.includes(marker));
    }) || null;

    res.json({
      ...discovery,
      tvIp: info ? info.tvIp : null,
      deviceModel: model || null,
      tvVisible: !!tvReceiver,
      tvReceiver
    });
  } catch (err) {
    res.status(500).json({ success: false, receivers: [], message: err.message });
  }
});

// 28. Enviar y Abrir Enlace / URL en la TV
app.post('/api/device/open-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requerida' });
  const result = await adbManager.openUrlOnTv(url);
  res.json(result);
});

// 29. Reinicio Remoto (normal o Recovery)
app.post('/api/device/tweaks/reboot', async (req, res) => {
  const { mode = 'reboot' } = req.body || {};
  const result = await adbManager.reboot(mode);
  res.json(result);
});

// 30. Historial de Dispositivos Conectados
app.get('/api/devices/history', (req, res) => {
  res.json({ devices: deviceHistory.list() });
});

app.post('/api/devices/history/remove', (req, res) => {
  const { ip, port, key } = req.body || {};
  const removed = deviceHistory.remove({ ip, port, key });
  res.json({ success: removed, devices: deviceHistory.list() });
});

// 31. Reinicio del Servidor (auto-relanzamiento en segundo plano)
let isRestarting = false;

app.post('/api/server/restart', (req, res) => {
  if (isRestarting) {
    return res.status(409).json({ error: 'Ya hay un reinicio en curso' });
  }
  isRestarting = true;

  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // El proceso hijo no comparte consola con el actual: su salida va al log
    const logPath = path.join(dataDir, 'server.log');
    const logFd = fs.openSync(logPath, 'a');
    let child;
    try {
      child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
        cwd: __dirname,
        detached: true,
        stdio: ['ignore', logFd, logFd],
        env: { ...process.env, NEOSWITCH_RESTART: '1', PORT: String(PORT) }
      });
      child.unref();
    } finally {
      fs.closeSync(logFd);
    }

    res.json({
      success: true,
      pid: child.pid,
      message: 'Reiniciando el servidor...'
    });

    // Evita que dos procesos reapliquen el DNS al mismo tiempo
    adblockGuard.stop();

    // Dar tiempo a que la respuesta HTTP salga antes de cerrar el proceso actual
    setTimeout(() => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 1500).unref();
    }, 300);
  } catch (err) {
    isRestarting = false;
    res.status(500).json({ error: `No se pudo reiniciar el servidor: ${err.message}` });
  }
});

// Middleware de manejo de errores (debe registrarse tras las rutas)
app.use((err, req, res, next) => {
  console.error('Error no manejado en servidor:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar Servidor
function printBanner() {
  console.log(`=======================================================`);
  console.log(`  NEOSWITCH TV — ANDROID TV STUDIO v1.2`);
  console.log(`=======================================================`);
  console.log(`  Colaboración:`);
  console.log(`  • Jernel Systems:    https://www.jernelsystems.com`);
  console.log(`  • NeoTech Solutions: https://neotechsolutions.mx/`);
  console.log(`  • GitHub:            https://github.com/JernelOlart`);
  console.log(`-------------------------------------------------------`);
  console.log(`  Servidor activo en:  http://localhost:${PORT}`);
  console.log(`  ADB Path detectado:  ${adbManager.adbPath}`);
  console.log(`=======================================================`);
}

const MAX_LISTEN_RETRIES = 20;

function startServer(attempt = 0) {
  const onError = (err) => {
    server.removeListener('error', onError);

    // Tras un reinicio, el proceso anterior puede tardar en liberar el puerto
    if (err.code === 'EADDRINUSE' && process.env.NEOSWITCH_RESTART === '1' && attempt < MAX_LISTEN_RETRIES) {
      setTimeout(() => startServer(attempt + 1), 400);
      return;
    }

    console.error(`No se pudo iniciar el servidor en el puerto ${PORT}: ${err.message}`);
    process.exit(1);
  };

  server.once('error', onError);
  server.listen(PORT, () => {
    server.removeListener('error', onError);
    printBanner();
    adblockGuard.start();
  });
}

startServer();
