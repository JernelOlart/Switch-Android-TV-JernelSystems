const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Host DoT válido: dominios DNS (sin esquema, puerto ni rutas). Se valida en el
// borde porque el host se interpola en comandos de shell del dispositivo.
const DOT_HOST_RE = /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?:\.(?!-)[a-zA-Z0-9-]{1,63})+$/;

// Script de arranque que vuelve a fijar el DNS privado tras cada reinicio.
// Solo se instala cuando el equipo tiene root + Magisk.
const DNS_BOOT_SCRIPT_PATH = '/data/adb/service.d/neoswitch-dns.sh';
const DNS_BOOT_SCRIPT_MARKER = 'NeoSwitch TV - DNS anti-anuncios persistente';

const DNS_PROVIDERS = {
  adguard: 'dns.adguard-dns.com',
  'adguard-family': 'family.adguard-dns.com',
  mullvad: 'base.dns.mullvad.net',
  quad9: 'dns.quad9.net'
};

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
    const dev = target || this.connectedDevice || await this.ensureDevice();
    const args = dev ? ['-s', dev, 'shell', command] : ['shell', command];
    return await this.execute(args, 30000);
  }

  // La CLI se ejecuta en procesos distintos: si no se llamó a connect en este
  // proceso, adopta el único equipo ADB adjunto en lugar de fallar.
  async ensureDevice() {
    if (this.connectedDevice) return this.connectedDevice;

    const devices = await this.getDevices();
    const online = devices.filter(d => d.state === 'device');
    if (online.length === 0) return null;

    const ipTargets = [...new Set(online
      .filter(d => /^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(d.id))
      .map(d => d.id))];

    if (ipTargets.length === 1) {
      this.connectedDevice = ipTargets[0];
      return this.connectedDevice;
    }

    if (online.length === 1) {
      this.connectedDevice = online[0].id;
      return this.connectedDevice;
    }

    return null;
  }

  async getDeviceInfo(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return null;

    try {
      const queries = [
        ['MODEL', 'getprop ro.product.model'],
        ['BRAND', 'getprop ro.product.brand'],
        ['MANUFACTURER', 'getprop ro.product.manufacturer'],
        ['ANDROID_VER', 'getprop ro.build.version.release'],
        ['SDK', 'getprop ro.build.version.sdk'],
        ['CPU_ABI', 'getprop ro.product.cpu.abi'],
        ['BUILD_ID', 'getprop ro.build.id'],
        ['DEVICE', 'getprop ro.product.device'],
        ['WM_SIZE', 'wm size'],
        ['WM_DENSITY', 'wm density'],
        ['ANIM_WIN', 'settings get global window_animation_scale'],
        ['ANIM_TRANS', 'settings get global transition_animation_scale'],
        ['ANIM_DUR', 'settings get global animator_duration_scale'],
        ['STAY_ON', 'settings get global stay_on_while_plugged_in']
      ];

      const props = {};
      for (const [key, command] of queries) {
        const res = await this.shell(command, dev);
        if (res.success) {
          props[key] = (res.stdout || '').toString().trim();
        }
      }

      const resIp = await this.shell('ip addr show wlan0', dev);
      const ipLine = (resIp.stdout || '').toString().split('\n').find(l => l.includes('inet ') && !l.includes('inet6'));
      const ipCandidate = ipLine ? ipLine.trim().substring(ipLine.indexOf('inet ') + 5).split(' ')[0] : '';
      props.IP_ADDR = ipCandidate ? ipCandidate.split('/')[0] : dev.split(':')[0];

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
    const dev = target || this.connectedDevice || await this.ensureDevice();
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

  async resolveDnsProvider(provider, customHost = '') {
    const key = String(provider || 'auto').trim().toLowerCase();

    if (key === 'off' || key === 'auto') {
      return { provider: key, mode: key === 'off' ? 'off' : 'opportunistic', host: '' };
    }

    if (key === 'custom') {
      const host = String(customHost || '').trim();
      if (!DOT_HOST_RE.test(host)) {
        return { error: 'Host DoT inválido. Usa un dominio como xxxxx.dns.nextdns.io (sin https://, sin puerto y sin rutas).' };
      }
      return { provider: key, mode: 'hostname', host };
    }

    const host = DNS_PROVIDERS[key];
    if (!host) return { error: `Proveedor DNS desconocido: ${provider}` };
    return { provider: key, mode: 'hostname', host };
  }

  async getPrivateDns(target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return null;

    const [resMode, resSpec] = await Promise.all([
      this.shell('settings get global private_dns_mode', dev),
      this.shell('settings get global private_dns_specifier', dev)
    ]);

    const rawMode = (resMode.stdout || '').trim();
    const rawSpec = (resSpec.stdout || '').trim();
    const mode = !rawMode || rawMode === 'null' ? 'opportunistic' : rawMode;
    const specifier = rawSpec === 'null' ? '' : rawSpec;

    return {
      mode,
      specifier,
      isAdBlocking: mode === 'hostname' && specifier.length > 0
    };
  }

  async setPrivateDns(provider, customHost = '', target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const resolved = await this.resolveDnsProvider(provider, customHost);
    if (resolved.error) return { success: false, message: resolved.error };

    const { mode, host, provider: providerKey } = resolved;

    // Comandos separados: si el host falla, el modo no queda a medias.
    const modeRes = await this.shell(`settings put global private_dns_mode ${mode}`, dev);
    const specRes = mode === 'hostname'
      ? await this.shell(`settings put global private_dns_specifier ${host}`, dev)
      : await this.shell('settings put global private_dns_specifier ""', dev);

    if (!modeRes.success || !specRes.success) {
      return {
        success: false,
        provider: providerKey,
        mode,
        host,
        message: (modeRes.stderr || specRes.stderr || 'Android rechazó el cambio de DNS').trim()
      };
    }

    // Verificación real: algunos OEM revierten el valor sin devolver error.
    const verified = await this.getPrivateDns(dev);
    const applied = verified
      ? (mode === 'hostname'
        ? verified.mode === 'hostname' && verified.specifier === host
        : verified.mode === mode)
      : false;

    return {
      success: applied,
      provider: providerKey,
      mode,
      host,
      verified,
      message: applied
        ? (mode === 'hostname'
          ? `DNS Privado Anti-Anuncios activado: ${host}`
          : `DNS configurado en modo: ${mode}`)
        : 'Android aceptó el comando pero el valor no quedó aplicado. Revisa la red o los permisos del equipo.'
    };
  }

  // --- Persistencia del DNS tras reinicios ---

  async getRootStatus(target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) {
      return { rooted: false, magisk: false, canPersistBoot: false, reason: 'Dispositivo no conectado' };
    }

    const idRes = await this.shell('su -c id', dev);
    const rooted = idRes.success && /uid=0/.test(idRes.stdout || '');

    let magisk = false;
    if (rooted) {
      const magiskRes = await this.shell("su -c 'ls -d /data/adb/magisk 2>/dev/null'", dev);
      magisk = magiskRes.success && (magiskRes.stdout || '').includes('/data/adb/magisk');
    }

    return {
      rooted,
      magisk,
      canPersistBoot: rooted && magisk,
      reason: rooted
        ? (magisk
          ? null
          : 'Hay root, pero no se detectó Magisk: no existe una carpeta de arranque fiable donde instalar el script.')
        : 'El equipo no tiene root, así que Android no permite crear un script que se ejecute al arrancar.'
    };
  }

  async getDnsPersistenceStatus(target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) {
      return { supported: false, installed: false, host: null, rooted: false, magisk: false, reason: 'Dispositivo no conectado' };
    }

    const root = await this.getRootStatus(dev);
    if (!root.canPersistBoot) {
      return {
        supported: false,
        installed: false,
        host: null,
        rooted: root.rooted,
        magisk: root.magisk,
        reason: root.reason
      };
    }

    const res = await this.shell(`su -c 'cat ${DNS_BOOT_SCRIPT_PATH} 2>/dev/null'`, dev);
    const content = res.stdout || '';
    const installed = res.success && content.includes(DNS_BOOT_SCRIPT_MARKER);
    const hostMatch = content.match(/private_dns_specifier\s+(\S+)/);

    return {
      supported: true,
      installed,
      host: hostMatch ? hostMatch[1] : null,
      rooted: true,
      magisk: true,
      reason: null
    };
  }

  async installDnsBootScript(host, target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return { success: false, supported: false, message: 'Dispositivo no conectado' };

    const normalizedHost = String(host || '').trim();
    if (!DOT_HOST_RE.test(normalizedHost)) {
      return { success: false, supported: false, message: 'Host DoT inválido para el script de arranque.' };
    }

    const root = await this.getRootStatus(dev);
    if (!root.canPersistBoot) {
      return { success: false, supported: false, message: root.reason };
    }

    const script = [
      '#!/system/bin/sh',
      `# ${DNS_BOOT_SCRIPT_MARKER}`,
      '# Generado por NeoSwitch TV. Se ejecuta en cada arranque y reaplica el DNS.',
      '(',
      '  until [ "$(getprop sys.boot_completed)" = "1" ]; do sleep 2; done',
      '  sleep 8',
      '  settings put global private_dns_mode hostname',
      `  settings put global private_dns_specifier ${normalizedHost}`,
      ') &',
      ''
    ].join('\n');

    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const cmd = `su -c 'mkdir -p /data/adb/service.d && echo ${encoded} | base64 -d > ${DNS_BOOT_SCRIPT_PATH} && chmod 755 ${DNS_BOOT_SCRIPT_PATH}'`;
    const res = await this.shell(cmd, dev);

    const status = await this.getDnsPersistenceStatus(dev);
    const applied = res.success && status.installed && status.host === normalizedHost;

    return {
      success: applied,
      supported: true,
      host: normalizedHost,
      status,
      message: applied
        ? `Script de arranque instalado: el DNS ${normalizedHost} se reaplica en cada reinicio.`
        : (res.stderr || 'No se pudo instalar el script de arranque.')
    };
  }

  async removeDnsBootScript(target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const root = await this.getRootStatus(dev);
    if (!root.canPersistBoot) {
      return { success: true, supported: false, message: root.reason };
    }

    const res = await this.shell(`su -c 'rm -f ${DNS_BOOT_SCRIPT_PATH}'`, dev);
    const status = await this.getDnsPersistenceStatus(dev);

    return {
      success: res.success && !status.installed,
      supported: true,
      status,
      message: !status.installed
        ? 'Script de arranque eliminado'
        : (res.stderr || 'No se pudo eliminar el script de arranque')
    };
  }

  async getLauncherAdsInfo(target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return null;

    const pkg = 'com.google.android.tvrecommendations';
    const [listRes, installedRes, dumpRes, googleTvRes] = await Promise.all([
      this.shell('pm list packages -d', dev),
      this.shell(`pm list packages --user 0 ${pkg}`, dev),
      this.shell(`dumpsys package ${pkg}`, dev),
      this.shell('pm list packages com.google.android.apps.tv.launcherx', dev)
    ]);

    const disabled = (listRes.stdout || '')
      .split('\n')
      .some(line => line.trim().replace(/^package:/, '').trim() === pkg);

    const installed = (installedRes.stdout || '')
      .split('\n')
      .some(line => line.trim().replace(/^package:/, '').trim() === pkg);

    const dump = dumpRes.stdout || '';
    // En Google TV el paquete real es un stub deshabilitado por el sistema;
    // los anuncios y trailers del Home los dibuja el launcher (launcherx).
    const isStub = /codePath=[^\n]*Stub/i.test(dump);
    const isGoogleTv = (googleTvRes.stdout || '').includes('com.google.android.apps.tv.launcherx');
    const canToggle = installed && !isStub;

    return {
      package: pkg,
      disabled,
      installed,
      isStub,
      isGoogleTv,
      canToggle,
      reason: canToggle
        ? null
        : (isStub
          ? 'En Google TV este paquete es un stub deshabilitado por el sistema: los anuncios y trailers del Home los dibuja el launcher. Android no permite cambiar su estado desde ADB.'
          : 'El sistema controla este paquete y Android no permite cambiarlo desde ADB.')
    };
  }

  async getLauncherAdsStatus(target = null) {
    const info = await this.getLauncherAdsInfo(target);
    return info ? info.disabled : false;
  }

  async toggleLauncherAds(disableAds = true, target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const info = await this.getLauncherAdsInfo(dev);

    // Paquete controlado por el sistema: no se intenta un cambio que Android rechazará
    if (info && !info.canToggle) {
      return {
        success: false,
        blocked: true,
        adsDisabled: info.disabled,
        canToggle: false,
        isGoogleTv: info.isGoogleTv,
        message: `${info.reason} Usa "Modo solo apps" en Ajustes de la TV o instala Projectivy Launcher para un Home sin anuncios.`
      };
    }

    const cmd = disableAds
      ? 'pm disable-user --user 0 com.google.android.tvrecommendations'
      : 'pm enable --user 0 com.google.android.tvrecommendations';

    const res = await this.shell(cmd, dev);
    const output = `${res.stderr || ''}\n${res.stdout || ''}`.trim();

    // Android 14+ puede bloquear al shell para cambiar el estado de este paquete
    if (!res.success && /Shell cannot change component state/i.test(output)) {
      const currentInfo = await this.getLauncherAdsInfo(dev);
      return {
        success: false,
        blocked: true,
        adsDisabled: currentInfo ? currentInfo.disabled : disableAds,
        canToggle: false,
        isGoogleTv: currentInfo ? currentInfo.isGoogleTv : false,
        message: 'Android bloquea al shell cambiar este paquete. Usa "Modo solo apps" en Ajustes de la TV o instala Projectivy Launcher para un Home sin anuncios.'
      };
    }

    const success = res.success;
    const currentDisabled = success ? disableAds : await this.getLauncherAdsStatus(dev);
    return {
      success,
      adsDisabled: currentDisabled,
      canToggle: true,
      isGoogleTv: info ? info.isGoogleTv : false,
      message: success
        ? (disableAds
          ? 'Canal de recomendaciones y anuncios del Home desactivado'
          : 'Canal de recomendaciones restaurado')
        : (output || `No se pudo ${disableAds ? 'desactivar' : 'restaurar'} las recomendaciones del Home`)
    };
  }

  async openTvSettings(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const res = await this.shell('am start -a android.settings.SETTINGS', dev);
    return {
      success: res.success,
      message: res.success
        ? 'Ajustes abiertos en la pantalla de la TV'
        : (res.stderr || res.stdout || 'No se pudieron abrir los Ajustes de la TV')
    };
  }

  async setBackgroundProcessLimit(limit, target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };
    // -1 = estándar, 0 = sin procesos, 1, 2, 3, 4
    const res = await this.shell(`settings put global background_process_limit ${limit}`, dev);
    return { success: res.success, limit, message: `Límite de procesos en 2º plano establecido a: ${limit}` };
  }

  async reboot(rebootMode = 'reboot', target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const cmd = rebootMode === 'recovery' ? 'reboot recovery' : 'reboot';
    const res = await this.shell(cmd, dev);

    return {
      success: res.success,
      mode: rebootMode,
      message: res.success ? `Reinicio ${rebootMode} solicitado en ${dev}` : (res.stderr || 'Error al reiniciar el dispositivo')
    };
  }

  async downloadAndInstallCuratedApp(appKey, target = null) {
    const dev = target || this.connectedDevice || await this.ensureDevice();
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    const apps = {
      smarttube: {
        name: 'SmartTube (YouTube Sin Anuncios)',
        repo: 'yuliskov/SmartTube',
        assetPattern: /SmartTube_stable_.*_arm64-v8a\.apk/,
        filename: 'smarttube_stable.apk'
      },
      projectivy: {
        name: 'Projectivy Launcher (Launcher Limpio)',
        repo: 'spocky/miproja1',
        assetPattern: /release.*\.apk/i,
        filename: 'projectivy.apk'
      },
      'adguard-tv': {
        name: 'AdGuard para Android TV',
        repo: 'AdguardTeam/AdguardForAndroid',
        assetPattern: /^adguard-tv-.*\.apk$/i,
        filename: 'adguard_tv.apk',
        launchPackage: 'com.adguard.android',
        postInstall: 'En la TV: concede el permiso de VPN y activa "Iniciar al arrancar". La app incluye 14 días de prueba; después requiere licencia.'
      }
    };

    const targetApp = apps[appKey];
    if (!targetApp) return { success: false, message: 'App no encontrada en el catálogo curado' };

    const tempPath = path.join(os.tmpdir(), targetApp.filename);

    // Un APK real es un ZIP: evita instalar una página de error o un HTML.
    const isValidApk = (filePath) => {
      try {
        const fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(4);
        fs.readSync(fd, header, 0, 4, 0);
        fs.closeSync(fd);
        return header.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
      } catch (err) {
        return false;
      }
    };

    const resolveDownload = async () => {
      const res = await fetch(`https://api.github.com/repos/${targetApp.repo}/releases/latest`, {
        headers: { 'User-Agent': 'NeoSwitchTV' }
      });
      if (!res.ok) throw new Error(`Error HTTP al consultar la última release de ${targetApp.repo}: ${res.status}`);
      const data = await res.json();
      const assets = data.assets || [];
      const asset = targetApp.assetPattern
        ? assets.find(a => targetApp.assetPattern.test(a.name))
        : assets[0];
      if (!asset) {
        throw new Error(`No se encontró un APK compatible en la release ${data.tag_name} de ${targetApp.repo}`);
      }
      return asset.browser_download_url;
    };

    return new Promise((resolve) => {
      const https = require('https');
      const http = require('http');

      const downloadFile = (fileUrl, destPath, redirects = 5) => {
        if (redirects === 0) return resolve({ success: false, message: 'Demasiadas redirecciones al descargar la APK' });

        const client = fileUrl.startsWith('https') ? https : http;
        client.get(fileUrl, { headers: { 'User-Agent': 'Mozilla/5.0 AndroidTV' } }, (res) => {
          res.on('error', (err) => resolve({ success: false, message: `Error en la descarga: ${err.message}` }));
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadFile(res.headers.location, destPath, redirects - 1);
          }

          if (res.statusCode !== 200) {
            return resolve({ success: false, message: `Error HTTP al descargar (${res.statusCode}): ${fileUrl.split('?')[0]}` });
          }

          const fileStream = fs.createWriteStream(destPath);
          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            resolve({ success: false, message: `Error al guardar el APK: ${err.message}` });
          });
          res.pipe(fileStream);

          fileStream.on('finish', async () => {
            fileStream.close();

            if (!isValidApk(destPath)) {
              fs.unlink(destPath, () => {});
              resolve({ success: false, message: 'La descarga no es un APK válido. Revisa la conexión e inténtalo de nuevo.' });
              return;
            }

            // Instalar en la TV
            const installRes = await this.installApk(destPath, dev);
            fs.unlink(destPath, () => {}); // limpiar temp

            if (installRes.success) {
              if (targetApp.launchPackage) {
                await this.launchApp(targetApp.launchPackage, dev);
              }
              resolve({
                success: true,
                message: `¡${targetApp.name} instalado con éxito en tu Android TV! ${targetApp.postInstall || ''}`.trim()
              });
            } else {
              resolve({ success: false, message: installRes.stderr || 'Error al ejecutar instalación ADB' });
            }
          });
        }).on('error', (err) => {
          resolve({ success: false, message: `Error en la descarga: ${err.message}` });
        });
      };

      resolveDownload()
        .then(url => downloadFile(url, tempPath))
        .catch(err => resolve({ success: false, message: `Error al resolver la descarga: ${err.message}` }));
    });
  }

  // --- AirPlay / AirScreen Soporte ---
  // AirPlay depende de dos cosas distintas: que el receptor esté instalado
  // en el perfil ACTIVO y que además esté anunciándose en la red local.
  // `pm list packages` sin --user devuelve paquetes de otros perfiles, así
  // que aquí siempre se consulta el usuario en curso.
  async getAirPlayInfo(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return null;

    const pkg = 'com.ionitech.airscreen';

    const userRes = await this.shell('am get-current-user', dev);
    const parsedUser = parseInt((userRes.stdout || '').trim(), 10);
    const currentUser = Number.isInteger(parsedUser) ? parsedUser : 0;

    const [anyRes, userPkgRes, pidRes, activityRes, ipRes, audioRes, dumpRes] = await Promise.all([
      this.shell(`pm list packages ${pkg}`, dev),
      this.shell(`pm list packages --user ${currentUser} ${pkg}`, dev),
      this.shell(`pidof ${pkg}`, dev),
      this.shell('dumpsys activity activities', dev),
      this.shell('ip route', dev),
      this.shell('dumpsys audio', dev),
      this.shell(`dumpsys package ${pkg}`, dev)
    ]);

    const hasPackage = (stdout) => (stdout || '')
      .split('\n')
      .some(line => line.trim().replace(/^package:/, '').trim() === pkg);

    const installedAnywhere = hasPackage(anyRes.stdout);
    const installedForUser = hasPackage(userPkgRes.stdout);

    const pidMatch = (pidRes.stdout || '').trim().match(/^\d+/);
    const pid = pidMatch ? Number(pidMatch[0]) : null;

    const activityMatch = (activityRes.stdout || '').match(/topResumedActivity=.*?\su(\d+)\s+([\w.]+)\/([\w.$]+)/);
    const foregroundPackage = activityMatch ? activityMatch[2] : null;
    const foregroundActivity = activityMatch ? `${activityMatch[2]}/${activityMatch[3]}` : null;

    const ipMatch = (ipRes.stdout || '').match(/\bsrc (\d{1,3}(?:\.\d{1,3}){3})/);
    const tvIp = ipMatch ? ipMatch[1] : null;

    // Audio real del receptor: distingue "app abierta" de "está sonando".
    const musicPlaying = pid
      ? new RegExp(`AudioTrack[^\\n]*pid:${pid}\\b[^\\n]*state:started`).test(audioRes.stdout || '')
      : false;

    const dump = dumpRes.stdout || '';
    const version = (dump.match(/versionName=([^\s]+)/) || [])[1] || null;
    const versionCodeMatch = dump.match(/versionCode=(\d+)/);
    const versionCode = versionCodeMatch ? Number(versionCodeMatch[1]) : null;
    const installerMatch = dump.match(/installerPackageName=([^\s]+)/);
    const installer = installerMatch && installerMatch[1] !== 'null' ? installerMatch[1] : null;

    return {
      package: pkg,
      currentUser,
      installedAnywhere,
      installedForUser,
      installed: installedForUser,
      running: !!pid,
      pid,
      foreground: foregroundPackage === pkg,
      foregroundActivity,
      musicPlaying,
      tvIp,
      version,
      versionCode,
      installer,
      sideloaded: installedAnywhere && !installer,
      ready: installedForUser && !!pid,
      message: installedForUser
        ? (pid
          ? 'AirScreen está activo en tu Android TV'
          : 'AirScreen está instalado pero no está en ejecución')
        : (installedAnywhere
          ? `AirScreen está instalado solo en otro perfil (usuario ${currentUser} es el activo)`
          : 'AirScreen no está instalado en la TV')
    };
  }

  async checkAirPlayStatus(target = null) {
    const info = await this.getAirPlayInfo(target);
    if (!info) return { success: false, installed: false, message: 'Dispositivo no conectado' };
    return { success: true, ...info };
  }

  async launchOrInstallAirScreen(target = null) {
    const dev = target || this.connectedDevice;
    if (!dev) return { success: false, message: 'Dispositivo no conectado' };

    let info = await this.getAirPlayInfo(dev);

    // Instalado en otro perfil: habilitarlo en el perfil activo antes de lanzar.
    if (info && info.installedAnywhere && !info.installedForUser) {
      const enable = await this.shell(`pm install-existing --user ${info.currentUser} com.ionitech.airscreen`, dev);
      const output = `${enable.stderr || ''}\n${enable.stdout || ''}`.trim();
      if (!enable.success) {
        return {
          success: false,
          action: 'enable_failed',
          info,
          message: output || `No se pudo habilitar AirScreen en el perfil ${info.currentUser}`
        };
      }
      info = await this.getAirPlayInfo(dev);
    }

    if (!info || !info.installedAnywhere) {
      const openStore = await this.shell(
        'am start -a android.intent.action.VIEW -d "market://details?id=com.ionitech.airscreen"',
        dev
      );
      return {
        success: false,
        action: 'store_opened',
        needsInstall: true,
        info,
        message: openStore.success
          ? 'AirScreen no está instalado. Se abrió su página en Play Store en la TV: pulsa "Instalar" con el mando.'
          : 'AirScreen no está instalado y no se pudo abrir Play Store en la TV.'
      };
    }

    const launch = await this.shell('monkey -p com.ionitech.airscreen -c android.intent.category.LAUNCHER 1', dev);
    // El receptor tarda en levantar el proceso: esperar antes de verificar.
    await new Promise(resolve => setTimeout(resolve, 2500));

    const after = await this.getAirPlayInfo(dev);
    if (after && after.running) {
      return {
        success: true,
        action: 'launched',
        info: after,
        message: after.foreground
          ? 'AirPlay activo en la TV. Abre Apple Music en tu iPhone y toca el icono AirPlay.'
          : 'AirPlay activo en la TV (en segundo plano). Abre el Centro de Control del iPhone y elige la TV.'
      };
    }

    return {
      success: false,
      action: 'launch_failed',
      info: after || info,
      message: (launch.stderr || launch.stdout || '').trim()
        || 'AirScreen no arrancó. Si muestra "Upgrade required", actualízalo desde Play Store en la TV.'
    };
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

