const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AdbManager {
  constructor() {
    this.adbPath = this.detectAdbPath();
    this.connectedDevice = null; // "IP:PORT"
    this.deviceInfo = null;
  }

  detectAdbPath() {
    const candidates = [
      path.join(os.homedir(), 'Library/Android/sdk/platform-tools/adb'),
      '/opt/homebrew/bin/adb',
      '/usr/local/bin/adb',
      '/usr/bin/adb',
      'adb'
    ];

    for (const p of candidates) {
      if (p === 'adb') return 'adb';
      try {
        if (fs.existsSync(p)) {
          return p;
        }
      } catch (e) {
        // ignore
      }
    }
    return 'adb';
  }

  setAdbPath(customPath) {
    if (customPath && fs.existsSync(customPath)) {
      this.adbPath = customPath;
      return true;
    }
    return false;
  }

  execute(args, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      execFile(this.adbPath, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          return resolve({
            success: false,
            error: error.message,
            stderr: (stderr || '').toString().trim(),
            stdout: (stdout || '').toString().trim()
          });
        }
        resolve({
          success: true,
          stdout: (stdout || '').toString().trim(),
          stderr: (stderr || '').toString().trim()
        });
      });
    });
  }

  async getDevices() {
    const res = await this.execute(['devices', '-l']);
    if (!res.success) return [];
    
    const lines = res.stdout.split('\n').slice(1);
    const devices = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const id = parts[0];
        const state = parts[1]; // device, unauthorized, offline
        const modelMatch = line.match(/model:([^\s]+)/);
        const productMatch = line.match(/product:([^\s]+)/);
        const deviceMatch = line.match(/device:([^\s]+)/);

        devices.push({
          id,
          state,
          model: modelMatch ? modelMatch[1].replace(/_/g, ' ') : 'Desconocido',
          product: productMatch ? productMatch[1] : '',
          raw: line
        });
      }
    }
    return devices;
  }

  async connect(ip, port = 5555) {
    const target = `${ip}:${port}`;
    const res = await this.execute(['connect', target]);
    const output = (res.stdout + ' ' + res.stderr).toLowerCase();

    if (output.includes('connected to') || output.includes('already connected')) {
      this.connectedDevice = target;
      // Intenta refrescar info
      await this.getDeviceInfo(target);
      return { success: true, message: `Conectado exitosamente a ${target}`, target };
    }

    return {
      success: false,
      message: res.stdout || res.stderr || 'No se pudo conectar al dispositivo.',
      target
    };
  }

  async disconnect(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: true, message: 'Ningún dispositivo conectado' };
    
    const res = await this.execute(['disconnect', dev]);
    if (this.connectedDevice === dev) {
      this.connectedDevice = null;
      this.deviceInfo = null;
    }
    return { success: true, message: res.stdout || 'Desconectado' };
  }

  async pair(ip, port, code) {
    const target = `${ip}:${port}`;
    const res = await this.execute(['pair', target, code]);
    if (res.stdout.toLowerCase().includes('successfully paired')) {
      return { success: true, message: res.stdout };
    }
    return { success: false, message: res.stdout || res.stderr || 'Fallo de emparejamiento' };
  }

  async shell(command, target = null) {
    const dev = target || this.connectedDevice;
    const args = dev ? ['-s', dev, 'shell', command] : ['shell', command];
    return await this.execute(args, 30000);
  }

  async getDeviceInfo(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return null;

    try {
      const cmd = `
        echo "MODEL=$(getprop ro.product.model)"
        echo "BRAND=$(getprop ro.product.brand)"
        echo "MANUFACTURER=$(getprop ro.product.manufacturer)"
        echo "ANDROID_VER=$(getprop ro.build.version.release)"
        echo "SDK=$(getprop ro.build.version.sdk)"
        echo "CPU_ABI=$(getprop ro.product.cpu.abi)"
        echo "BUILD_ID=$(getprop ro.build.id)"
        echo "DEVICE=$(getprop ro.product.device)"
        echo "WM_SIZE=$(wm size 2>/dev/null)"
        echo "WM_DENSITY=$(wm density 2>/dev/null)"
        echo "ANIM_WIN=$(settings get global window_animation_scale 2>/dev/null)"
        echo "ANIM_TRANS=$(settings get global transition_animation_scale 2>/dev/null)"
        echo "ANIM_DUR=$(settings get global animator_duration_scale 2>/dev/null)"
        echo "STAY_ON=$(settings get global stay_on_while_plugged_in 2>/dev/null)"
        echo "IP_ADDR=$(ip -f inet addr show wlan0 2>/dev/null | grep -Po 'inet \K[\d.]+' || echo '${dev.split(':')[0]}')"
      `;

      const res = await this.shell(cmd, dev);
      if (!res.success) return null;

      const props = {};
      res.stdout.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > -1) {
          const k = line.substring(0, idx).trim();
          const v = line.substring(idx + 1).trim();
          props[k] = v;
        }
      });

      // Parse wm size & density
      const sizeMatch = (props.WM_SIZE || '').match(/Physical size:\s*(\d+x\d+)/i) || (props.WM_SIZE || '').match(/size:\s*(\d+x\d+)/i);
      const densityMatch = (props.WM_DENSITY || '').match(/Physical density:\s*(\d+)/i) || (props.WM_DENSITY || '').match(/density:\s*(\d+)/i);

      this.deviceInfo = {
        target: dev,
        model: props.MODEL || 'Android TV',
        brand: props.BRAND || 'Genérico',
        manufacturer: props.MANUFACTURER || '',
        androidVersion: props.ANDROID_VER || 'Desconocido',
        sdkVersion: props.SDK || '',
        cpuAbi: props.CPU_ABI || 'arm64-v8a',
        buildId: props.BUILD_ID || '',
        device: props.DEVICE || '',
        resolution: sizeMatch ? sizeMatch[1] : (props.WM_SIZE || '1920x1080'),
        density: densityMatch ? densityMatch[1] : '320',
        animations: {
          window: props.ANIM_WIN || '1.0',
          transition: props.ANIM_TRANS || '1.0',
          duration: props.ANIM_DUR || '1.0'
        },
        stayOn: props.STAY_ON === '3' || props.STAY_ON === '7',
        ip: props.IP_ADDR || dev.split(':')[0]
      };

      return this.deviceInfo;
    } catch (e) {
      console.error('Error al obtener info de dispositivo:', e);
      return null;
    }
  }

  // --- Tweaks de Rendimiento y Modificaciones de Sistema ---
  async setAnimationsSpeed(scale = 0.5, target = null) {
    const val = String(scale);
    const cmd = `settings put global window_animation_scale ${val} && settings put global transition_animation_scale ${val} && settings put global animator_duration_scale ${val}`;
    return await this.shell(cmd, target);
  }

  async setDensity(density, target = null) {
    const cmd = density === 'reset' ? 'wm density reset' : `wm density ${parseInt(density, 10)}`;
    return await this.shell(cmd, target);
  }

  async setResolution(resolution, target = null) {
    const cmd = resolution === 'reset' ? 'wm size reset' : `wm size ${resolution}`;
    return await this.shell(cmd, target);
  }

  async setStayAwake(enable, target = null) {
    const val = enable ? '7' : '0'; // 7 = AC + USB + Wireless
    return await this.shell(`settings put global stay_on_while_plugged_in ${val}`, target);
  }

  async trimCaches(target = null) {
    return await this.shell('pm trim-caches 4096M', target);
  }

  // --- Debloater & Packages ---
  async getPackages(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return [];

    const resAll = await this.shell('pm list packages -f -u', dev);
    const resDisabled = await this.shell('pm list packages -d', dev);
    const resThirdParty = await this.shell('pm list packages -3', dev);

    const disabledSet = new Set(
      (resDisabled.stdout || '').split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)
    );
    const thirdPartySet = new Set(
      (resThirdParty.stdout || '').split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)
    );

    const packages = [];
    if (resAll.stdout) {
      const lines = resAll.stdout.split('\n');
      for (const line of lines) {
        // package:/data/app/.../base.apk=com.example.app
        const clean = line.replace('package:', '').trim();
        if (!clean) continue;
        const lastEq = clean.lastIndexOf('=');
        if (lastEq > -1) {
          const apkPath = clean.substring(0, lastEq);
          const pkgName = clean.substring(lastEq + 1);
          
          const isThirdParty = thirdPartySet.has(pkgName);
          const isDisabled = disabledSet.has(pkgName);
          const isBloat = this.isKnownBloatware(pkgName);

          packages.push({
            name: pkgName,
            apkPath,
            isSystem: !isThirdParty,
            isDisabled,
            isBloat,
            bloatCategory: isBloat ? this.getBloatCategory(pkgName) : null
          });
        }
      }
    }
    return packages;
  }

  isKnownBloatware(pkg) {
    const p = pkg.toLowerCase();
    const bloatList = [
      'com.google.android.videos',
      'com.google.android.play.games',
      'com.google.android.youtube.tvunplugged',
      'com.netflix.ninja',
      'com.amazon.amazonvideo.livingroom',
      'com.disney.disneyplus',
      'com.hbo.hbonow',
      'com.spotify.tv.android',
      'com.xiaomi.mitv',
      'com.tcl.',
      'com.sony.dtv.',
      'com.hisense.tv',
      'com.google.android.feedback',
      'com.android.providers.partnerbookmarks',
      'com.android.printspooler'
    ];
    return bloatList.some(b => p.includes(b));
  }

  getBloatCategory(pkg) {
    const p = pkg.toLowerCase();
    if (p.includes('xiaomi') || p.includes('tcl') || p.includes('sony') || p.includes('hisense')) return 'OEM Bloatware';
    if (p.includes('google') || p.includes('feedback')) return 'Google Telemetría / Apps';
    if (p.includes('netflix') || p.includes('amazon') || p.includes('disney') || p.includes('spotify')) return 'Streaming Promocional';
    return 'Recomendado para optimizar';
  }

  async disablePackage(pkg, target = null) {
    return await this.shell(`pm disable-user --user 0 ${pkg}`, target);
  }

  async enablePackage(pkg, target = null) {
    return await this.shell(`pm enable ${pkg}`, target);
  }

  async uninstallPackage(pkg, target = null) {
    return await this.shell(`pm uninstall -k --user 0 ${pkg}`, target);
  }

  async reinstallPackage(pkg, target = null) {
    return await this.shell(`cmd package install-existing ${pkg}`, target);
  }

  async forceStop(pkg, target = null) {
    return await this.shell(`am force-stop ${pkg}`, target);
  }

  async clearData(pkg, target = null) {
    return await this.shell(`pm clear ${pkg}`, target);
  }

  async launchApp(pkg, target = null) {
    return await this.shell(`monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`, target);
  }

  async installApk(apkFilePath, target = null) {
    const dev = target || this.connectedDevice;
    const args = dev ? ['-s', dev, 'install', '-r', '-g', apkFilePath] : ['install', '-r', '-g', apkFilePath];
    return await this.execute(args, 120000); // 2 min para APKs grandes
  }

  // --- Control Remoto ---
  async sendKeyEvent(keyCode, target = null) {
    return await this.shell(`input keyevent ${keyCode}`, target);
  }

  async sendText(text, target = null) {
    // Escapar caracteres para input text de Android
    const sanitized = text.replace(/([ "'\\$&|;()<>`~*?!=])/g, '\\$1');
    return await this.shell(`input text ${sanitized}`, target);
  }

  // --- Captura de Pantalla ---
  captureScreenshotStream(target = null) {
    const dev = target || this.connectedDevice;
    const args = dev ? ['-s', dev, 'exec-out', 'screencap', '-p'] : ['exec-out', 'screencap', '-p'];
    return spawn(this.adbPath, args);
  }

  // ==========================================================
  // --- MÓDULO DE AD-BLOCKING & PRIVACIDAD (SISTEMA COMPLETO) ---
  // ==========================================================

  async getPrivateDns(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return null;
    const resMode = await this.shell('settings get global private_dns_mode', dev);
    const resSpec = await this.shell('settings get global private_dns_specifier', dev);

    const mode = (resMode.stdout || '').trim();
    const specifier = (resSpec.stdout || '').trim();

    return {
      mode: mode === 'null' ? 'opportunistic' : mode,
      specifier: specifier === 'null' ? '' : specifier,
      isAdBlocking: specifier.includes('adguard') || specifier.includes('mullvad') || specifier.includes('nextdns')
    };
  }

  async setPrivateDns(provider, customHost = '', target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    let mode = 'hostname';
    let host = '';

    switch (provider) {
      case 'adguard':
        host = 'dns.adguard-dns.com';
        break;
      case 'adguard-family':
        host = 'family.adguard-dns.com';
        break;
      case 'mullvad':
        host = 'base.dns.mullvad.net';
        break;
      case 'quad9':
        host = 'dns.quad9.net';
        break;
      case 'custom':
        host = customHost.trim();
        break;
      case 'off':
        mode = 'off';
        host = '';
        break;
      case 'auto':
      default:
        mode = 'opportunistic';
        host = '';
        break;
    }

    const cmd = mode === 'hostname' 
      ? `settings put global private_dns_mode hostname && settings put global private_dns_specifier ${host}`
      : `settings put global private_dns_mode ${mode} && settings put global private_dns_specifier ""`;

    const res = await this.shell(cmd, dev);
    return {
      success: res.success,
      mode,
      host,
      message: mode === 'hostname' ? `DNS Privado Anti-Anuncios activado: ${host}` : `DNS configurado en modo: ${mode}`
    };
  }

  async getLauncherAdsStatus(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return false;
    const res = await this.shell('pm list packages -d com.google.android.tvrecommendations', dev);
    return (res.stdout || '').includes('com.google.android.tvrecommendations');
  }

  async toggleLauncherAds(disableAds = true, target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const cmd = disableAds
      ? 'pm disable-user --user 0 com.google.android.tvrecommendations'
      : 'pm enable com.google.android.tvrecommendations';

    const res = await this.shell(cmd, dev);
    return {
      success: res.success,
      adsDisabled: disableAds,
      message: disableAds 
        ? 'Canal de recomendaciones y anuncios del Home desactivado' 
        : 'Canal de recomendaciones restaurado'
    };
  }

  async setBackgroundProcessLimit(limit, target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };
    // -1 = estándar, 0 = sin procesos, 1, 2, 3, 4
    const res = await this.shell(`settings put global background_process_limit ${limit}`, dev);
    return { success: res.success, limit, message: `Límite de procesos en 2º plano establecido a: ${limit}` };
  }

  async downloadAndInstallCuratedApp(appKey, target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const apps = {
      smarttube: {
        name: 'SmartTube (YouTube Sin Anuncios)',
        // Enlace oficial de release estable de SmartTube
        url: 'https://github.com/yuliskov/SmartTube/releases/download/latest/smarttube_stable.apk',
        filename: 'smarttube_stable.apk'
      },
      projectivy: {
        name: 'Projectivy Launcher (Launcher Limpio)',
        url: 'https://github.com/spocky/marmitek-remote/raw/master/projectivy.apk', // referencia alternativa o descarga directa
        filename: 'projectivy.apk'
      }
    };

    const targetApp = apps[appKey];
    if (!targetApp) return { success: false, message: 'App no encontrada en el catálogo curado' };

    const tempPath = path.join(os.tmpdir(), targetApp.filename);

    return new Promise((resolve) => {
      const https = require('https');
      const http = require('http');

      const downloadFile = (fileUrl, destPath, redirects = 5) => {
        if (redirects === 0) return resolve({ success: false, message: 'Demasiadas redirecciones al descargar la APK' });

        const client = fileUrl.startsWith('https') ? https : http;
        client.get(fileUrl, { headers: { 'User-Agent': 'Mozilla/5.0 AndroidTV' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadFile(res.headers.location, destPath, redirects - 1);
          }

          if (res.statusCode !== 200) {
            return resolve({ success: false, message: `Error HTTP al descargar: ${res.statusCode}` });
          }

          const fileStream = fs.createWriteStream(destPath);
          res.pipe(fileStream);

          fileStream.on('finish', async () => {
            fileStream.close();
            // Instalar en la TV
            const installRes = await this.installApk(destPath, dev);
            fs.unlink(destPath, () => {}); // limpiar temp
            if (installRes.success) {
              resolve({ success: true, message: `¡${targetApp.name} instalado con éxito en tu Android TV!` });
            } else {
              resolve({ success: false, message: installRes.stderr || 'Error al ejecutar instalación ADB' });
            }
          });
        }).on('error', (err) => {
          resolve({ success: false, message: `Error en la descarga: ${err.message}` });
        });
      };

      downloadFile(targetApp.url, tempPath);
    });
  }

  // --- AirPlay / AirScreen Soporte ---
  async checkAirPlayStatus(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, installed: false, message: 'Dispositivo no conectado' };

    const res = await this.shell('pm list packages com.ionitech.airscreen', dev);
    const installed = (res.stdout || '').includes('package:com.ionitech.airscreen');
    return {
      success: true,
      installed,
      packageName: 'com.ionitech.airscreen',
      message: installed ? 'AirScreen está instalado en la TV' : 'AirScreen no está instalado aún'
    };
  }

  async launchOrInstallAirScreen(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const status = await this.checkAirPlayStatus(dev);
    if (status.installed) {
      // Iniciar AirScreen en la TV
      const launch = await this.shell('monkey -p com.ionitech.airscreen -c android.intent.category.LAUNCHER 1', dev);
      return {
        success: launch.success,
        action: 'launched',
        message: '¡AirScreen iniciado en tu Android TV! Ya puedes conectar desde tu iPhone.'
      };
    } else {
      // Abrir Google Play Store directamente en la página de AirScreen en la TV
      const openStore = await this.shell('am start -a android.intent.action.VIEW -d "market://details?id=com.ionitech.airscreen"', dev);
      return {
        success: openStore.success,
        action: 'store_opened',
        message: 'Se ha abierto la descarga de AirScreen en la pantalla de tu TV. Pulsa "Instalar" con tu mando.'
      };
    }
  }

  async openUrlOnTv(url, target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };
    if (!url) return { success: false, message: 'URL no válida' };

    // Escapar comillas dobles si las hay
    const cleanUrl = url.replace(/"/g, '\\"');
    const res = await this.shell(`am start -a android.intent.action.VIEW -d "${cleanUrl}"`, dev);
    return {
      success: res.success,
      message: res.success ? `Enlace abierto en la TV: ${url}` : 'No se pudo abrir el enlace en la TV'
    };
  }
}

module.exports = new AdbManager();

