const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { WebSocketServer } = require('ws');

const adbManager = require('./adbManager');
const networkScanner = require('./networkScanner');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4200;

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
    isScanning: networkScanner.isScanning
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
  if (networkScanner.isScanning) {
    return res.status(400).json({ error: 'Ya hay un escaneo en curso' });
  }

  // Responder inmediatamente y ejecutar en segundo plano
  res.json({ message: 'Escaneo iniciado' });
  networkScanner.scanSubnet(baseSubnet, Number(start), Number(end));
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
    const launcherAdsDisabled = await adbManager.getLauncherAdsStatus();
    res.json({ dns, launcherAdsDisabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 22. Ad-Block: Configurar DNS Privado Anti-Anuncios
app.post('/api/device/adblock/dns', async (req, res) => {
  const { provider, customHost } = req.body;
  if (!provider) return res.status(400).json({ error: 'Proveedor de DNS requerido' });
  const result = await adbManager.setPrivateDns(provider, customHost);
  res.json(result);
});

// 23. Ad-Block: Bloquear Recomendaciones y Anuncios del Home
app.post('/api/device/adblock/launcher-ads', async (req, res) => {
  const { disable } = req.body;
  const result = await adbManager.toggleLauncherAds(disable !== false);
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

// Iniciar Servidor
server.listen(PORT, () => {
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
});
