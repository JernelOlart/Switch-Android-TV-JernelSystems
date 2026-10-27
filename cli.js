#!/usr/bin/env node
const adb = require('./adbManager');
const scanner = require('./networkScanner');

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  console.log(`\x1b[36m=======================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[35m  NEOSWITCH TV — ANDROID TV STUDIO CLI v1.2\x1b[0m`);
  console.log(`  Colaboración: Jernel Systems & NeoTech Solutions`);
  console.log(`  GitHub: https://github.com/JernelOlart`);
  console.log(`\x1b[36m=======================================================\x1b[0m`);
  console.log(`ADB Binary: ${adb.adbPath}\n`);

  switch (command.toLowerCase()) {
    case 'scan': {
      console.log('[*] Iniciando escaneo de red local Wi-Fi...');
      const nets = scanner.getLocalNetworks();
      if (nets.length > 0) {
        console.log(`Subred detectada: ${nets[0].baseSubnet}.0/24 (IP: ${nets[0].ip})`);
      }

      scanner.on('device_found', (dev) => {
        const adbTag = dev.isAdbReady ? '\x1b[32m[ADB ABIERTO: 5555]\x1b[0m' : '';
        const castTag = dev.isCastDevice ? '\x1b[35m[CAST DETECTADO]\x1b[0m' : '';
        console.log(`  -> \x1b[1m${dev.ip}\x1b[0m [${dev.vendor}] ${adbTag} ${castTag}`);
      });

      const res = await scanner.scanSubnet();
      console.log(`\n\x1b[32m[OK] Escaneo finalizado. ${res.totalDiscovered} dispositivo(s) detectados.\x1b[0m`);
      break;
    }

    case 'devices': {
      const devs = await adb.getDevices();
      console.log('Dispositivos ADB actualmente conectados:');
      if (devs.length === 0) {
        console.log('  (Ningún dispositivo conectado)');
      } else {
        devs.forEach(d => console.log(`  - ${d.id} [${d.state}] ${d.model}`));
      }
      break;
    }

    case 'connect': {
      const ip = args[1];
      const port = args[2] || 5555;
      if (!ip) {
        console.error('[ERROR] Especifica la IP. Ejemplo: node cli.js connect 192.168.6.25');
        process.exit(1);
      }
      console.log(`Conectando a ${ip}:${port}...`);
      const res = await adb.connect(ip, port);
      if (res.success) {
        console.log(`\x1b[32m[OK] ${res.message}\x1b[0m`);
        const info = await adb.getDeviceInfo();
        if (info) {
          console.log(`  Modelo: ${info.model} (${info.brand})`);
          console.log(`  Android: ${info.androidVersion} | CPU: ${info.cpuAbi}`);
          console.log(`  Resolución: ${info.resolution} | DPI: ${info.density}`);
        }
      } else {
        console.log(`\x1b[31m[ERROR] ${res.message}\x1b[0m`);
      }
      break;
    }

    case 'tweaks': {
      const devs = await adb.getDevices();
      if (devs.length === 0) {
        console.error('[ERROR] No hay dispositivos ADB conectados. Conéctate primero con "node cli.js connect <ip>"');
        process.exit(1);
      }
      console.log(`[*] Aplicando optimizaciones y tweaks al dispositivo...`);
      await adb.setAnimationsSpeed(0.5);
      console.log('  [OK] Animaciones reducidas a 0.5x (Aceleración de UI)');
      await adb.trimCaches();
      console.log('  [OK] Cachés de aplicaciones liberadas (pm trim-caches)');
      console.log('\x1b[32m[OK] ¡Modificaciones aplicadas con éxito!\x1b[0m');
      break;
    }

    case 'debloat': {
      console.log('Buscando paquetes y bloatware en la TV...');
      const pkgs = await adb.getPackages();
      const bloat = pkgs.filter(p => p.isBloat);
      console.log(`Total apps detectadas: ${pkgs.length} | Bloatware potencial: ${bloat.length}`);
      bloat.forEach(p => {
        console.log(`  - ${p.name} [${p.bloatCategory}] ${p.isDisabled ? '(Deshabilitada)' : ''}`);
      });
      break;
    }

    case 'shell': {
      const cmd = args.slice(1).join(' ');
      if (!cmd) {
        console.error('Especifica el comando. Ejemplo: node cli.js shell "getprop ro.product.model"');
        process.exit(1);
      }
      const res = await adb.shell(cmd);
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(`\x1b[31m${res.stderr}\x1b[0m`);
      break;
    }

    case 'adblock': {
      const action = (args[1] || 'on').toLowerCase();
      const provider = args[2] || 'adguard';

      if (action === 'off') {
        const res = await adb.setPrivateDns('auto');
        console.log(`\x1b[33m[OK] DNS restaurado a modo automático (Sin filtro)\x1b[0m`);
      } else {
        const res = await adb.setPrivateDns(provider);
        if (res.success) {
          console.log(`\x1b[32m[OK] ${res.message}\x1b[0m`);
        } else {
          console.error(`\x1b[31m[ERROR] Error al configurar DNS: ${res.message}\x1b[0m`);
        }
      }
      break;
    }

    case 'smarttube': {
      console.log('[*] Descargando e instalando la última versión de SmartTube oficial...');
      const res = await adb.downloadAndInstallCuratedApp('smarttube');
      if (res.success) {
        console.log(`\x1b[32m[OK] ${res.message}\x1b[0m`);
      } else {
        console.error(`\x1b[31m[ERROR] ${res.message}\x1b[0m`);
      }
      break;
    }

    case 'airplay': {
      console.log('[*] Configurando receptor AirPlay en la TV...');
      const res = await adb.launchOrInstallAirScreen();
      if (res.success) {
        console.log(`\x1b[32m[OK] ${res.message}\x1b[0m`);
      } else {
        console.error(`\x1b[31m[ERROR] ${res.message}\x1b[0m`);
      }
      break;
    }

    case 'web':
    case 'start': {
      require('./server');
      break;
    }

    default:
      console.log(`Uso:
  ./start.sh                       -> Abre el panel web interactivo
  node cli.js scan                 -> Escanear la subred Wi-Fi
  node cli.js connect <ip>         -> Conectar con la Android TV por ADB (puerto 5555)
  node cli.js adblock [on|off]     -> Activar/Desactivar AdGuard DNS en todo el sistema
  node cli.js airplay              -> Iniciar o instalar receptor AirPlay para iPhone
  node cli.js smarttube            -> Descargar e instalar YouTube Sin Anuncios (SmartTube)
  node cli.js tweaks               -> Aplicar tweaks de rendimiento (0.5x animaciones, etc.)
  node cli.js debloat              -> Auditar bloatware del sistema
  node cli.js shell "<cmd>"        -> Ejecutar comando adb shell
  node cli.js web                  -> Iniciar servidor web`);
      break;
  }
}

main().catch(console.error);
