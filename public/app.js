// JERNEL SYSTEMS // ANDROID TV SPLOIT - CLIENT JS
document.addEventListener('DOMContentLoaded', () => {
  // Estado Global
  const state = {
    connectedDevice: null,
    deviceInfo: null,
    isScanning: false,
    discoveredDevices: new Map(),
    packages: [],
    packageFilter: 'all',
    packageSearch: '',
    screenshotInterval: null,
    shellHistory: [],
    shellHistoryIndex: -1
  };

  // --- Elementos del DOM ---
  const el = {
    // Header & Hero
    globalStatusPill: document.getElementById('globalStatusPill'),
    globalStatusDot: document.getElementById('globalStatusDot'),
    globalStatusText: document.getElementById('globalStatusText'),
    btnGlobalDisconnect: document.getElementById('btnGlobalDisconnect'),
    heroInactiveView: document.getElementById('heroInactiveView'),
    heroActiveView: document.getElementById('heroActiveView'),
    heroModelName: document.getElementById('heroModelName'),
    heroBrand: document.getElementById('heroBrand'),
    heroIpTarget: document.getElementById('heroIpTarget'),
    heroAndroidVer: document.getElementById('heroAndroidVer'),
    heroResolution: document.getElementById('heroResolution'),
    heroDensity: document.getElementById('heroDensity'),
    heroCpu: document.getElementById('heroCpu'),
    heroAnimVal: document.getElementById('heroAnimVal'),
    heroStayOnVal: document.getElementById('heroStayOnVal'),
    btnHeroDisconnect: document.getElementById('btnHeroDisconnect'),
    btnRefreshDeviceInfo: document.getElementById('btnRefreshDeviceInfo'),
    btnFocusScanner: document.getElementById('btnFocusScanner'),
    
    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Scanner
    netSubnetLabel: document.getElementById('netSubnetLabel'),
    btnStartScan: document.getElementById('btnStartScan'),
    btnStopScan: document.getElementById('btnStopScan'),
    scanSpinner: document.getElementById('scanSpinner'),
    scanBtnText: document.getElementById('scanBtnText'),
    scanProgressBox: document.getElementById('scanProgressBox'),
    scanCurrentTarget: document.getElementById('scanCurrentTarget'),
    scanPercentLabel: document.getElementById('scanPercentLabel'),
    scanProgressFill: document.getElementById('scanProgressFill'),
    inputManualIp: document.getElementById('inputManualIp'),
    inputManualPort: document.getElementById('inputManualPort'),
    btnConnectManual: document.getElementById('btnConnectManual'),
    radarSweep: document.getElementById('radarSweep'),
    radarCenterText: document.getElementById('radarCenterText'),
    devicesCountBadge: document.getElementById('devicesCountBadge'),
    discoveredDevicesList: document.getElementById('discoveredDevicesList'),

    // Pairing
    togglePairingSection: document.getElementById('togglePairingSection'),
    pairingBody: document.getElementById('pairingBody'),
    inputPairIp: document.getElementById('inputPairIp'),
    inputPairPort: document.getElementById('inputPairPort'),
    inputPairCode: document.getElementById('inputPairCode'),
    btnExecutePair: document.getElementById('btnExecutePair'),

    // Tweaks
    animButtons: document.querySelectorAll('[data-anim]'),
    inputCustomDpi: document.getElementById('inputCustomDpi'),
    btnApplyDpi: document.getElementById('btnApplyDpi'),
    btnResetDpi: document.getElementById('btnResetDpi'),
    dpiPresets: document.querySelectorAll('[data-dpi]'),
    inputCustomRes: document.getElementById('inputCustomRes'),
    btnApplyRes: document.getElementById('btnApplyRes'),
    btnResetRes: document.getElementById('btnResetRes'),
    resPresets: document.querySelectorAll('[data-res]'),
    switchStayAwake: document.getElementById('switchStayAwake'),
    labelStayAwake: document.getElementById('labelStayAwake'),
    btnTrimCaches: document.getElementById('btnTrimCaches'),
    btnRebootNormal: document.getElementById('btnRebootNormal'),
    btnRebootRecovery: document.getElementById('btnRebootRecovery'),

    // Debloat
    inputSearchPackage: document.getElementById('inputSearchPackage'),
    filterPills: document.querySelectorAll('.filter-pill'),
    packagesList: document.getElementById('packagesList'),
    packagesLoading: document.getElementById('packagesLoading'),
    btnAutoDebloat: document.getElementById('btnAutoDebloat'),
    countAll: document.getElementById('countAll'),
    countBloat: document.getElementById('countBloat'),
    countDisabled: document.getElementById('countDisabled'),
    countThird: document.getElementById('countThird'),
    countSystem: document.getElementById('countSystem'),

    // APK Drop
    apkDropZone: document.getElementById('apkDropZone'),
    apkFileInput: document.getElementById('apkFileInput'),
    btnSelectApk: document.getElementById('btnSelectApk'),
    uploadProgressBox: document.getElementById('uploadProgressBox'),
    uploadStatusText: document.getElementById('uploadStatusText'),
    uploadPercent: document.getElementById('uploadPercent'),
    uploadProgressFill: document.getElementById('uploadProgressFill'),

    // Remote
    remoteKeys: document.querySelectorAll('[data-key]'),
    inputTvText: document.getElementById('inputTvText'),
    btnSendTvText: document.getElementById('btnSendTvText'),
    btnTakeScreenshot: document.getElementById('btnTakeScreenshot'),
    checkAutoScreenshot: document.getElementById('checkAutoScreenshot'),
    tvScreenImg: document.getElementById('tvScreenImg'),
    tvScreenPlaceholder: document.getElementById('tvScreenPlaceholder'),

    // Ad-Block & Privacidad
    btnApplyDnsList: document.querySelectorAll('.btn-apply-dns'),
    dnsProviderCards: document.querySelectorAll('.dns-provider-card'),
    dnsStatusBadge: document.getElementById('dnsStatusBadge'),
    inputCustomDnsHost: document.getElementById('inputCustomDnsHost'),
    btnApplyCustomDns: document.getElementById('btnApplyCustomDns'),
    switchDisableLauncherAds: document.getElementById('switchDisableLauncherAds'),
    labelLauncherAds: document.getElementById('labelLauncherAds'),
    btnInstallSmartTube: document.getElementById('btnInstallSmartTube'),
    spinnerSmartTube: document.getElementById('spinnerSmartTube'),
    textSmartTube: document.getElementById('textSmartTube'),
    btnInstallProjectivy: document.getElementById('btnInstallProjectivy'),
    spinnerProjectivy: document.getElementById('spinnerProjectivy'),
    textProjectivy: document.getElementById('textProjectivy'),
    btnRamLimitList: document.querySelectorAll('.btn-ram-limit'),

    // Terminal Shell
    terminalScreen: document.getElementById('terminalScreen'),
    terminalInput: document.getElementById('terminalInput'),
    btnSendShell: document.getElementById('btnSendShell'),
    cmdPresets: document.querySelectorAll('[data-cmd]'),
    btnClearTerminal: document.getElementById('btnClearTerminal'),

    // Guide Modal
    btnOpenGuide: document.getElementById('btnOpenGuide'),
    guideModal: document.getElementById('guideModal'),
    btnCloseGuide: document.getElementById('btnCloseGuide'),
    btnGuideGotIt: document.getElementById('btnGuideGotIt'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- Sistema de Notificaciones Toast ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- WebSocket Setup ---
  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] Conectado al backend');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsEvent(msg.type, msg.data);
      } catch (e) {
        console.error('Error parseando mensaje WS:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Conexión cerrada. Reconectando en 3s...');
      setTimeout(initWebSocket, 3000);
    };
  }

  function handleWsEvent(type, data) {
    switch (type) {
      case 'scan_started':
        setScanningState(true);
        el.radarCenterText.innerText = 'Escaneando subred Wi-Fi...';
        showToast(`Escaneo iniciado en ${data.baseSubnet}.${data.start}-${data.end}`, 'info');
        break;

      case 'scan_progress':
        el.scanCurrentTarget.innerText = `Sondeando: ${data.checkedIp}`;
        el.scanPercentLabel.innerText = `${data.percent}%`;
        el.scanProgressFill.style.width = `${data.percent}%`;
        break;

      case 'device_found':
        addDiscoveredDevice(data);
        break;

      case 'scan_completed':
        setScanningState(false);
        el.radarCenterText.innerText = `Completado: ${data.totalFound} dispositivo(s)`;
        showToast(`Escaneo finalizado. Se detectaron ${data.totalFound} dispositivos.`, 'success');
        break;

      case 'scan_aborted':
        setScanningState(false);
        el.radarCenterText.innerText = 'Escaneo cancelado';
        showToast('Escaneo cancelado', 'info');
        break;

      case 'device_connected':
        state.connectedDevice = data.target;
        state.deviceInfo = data.info;
        updateDeviceUI();
        showToast(`Dispositivo vinculado: ${data.target}`, 'success');
        break;

      case 'device_disconnected':
        state.connectedDevice = null;
        state.deviceInfo = null;
        updateDeviceUI();
        showToast('Dispositivo desconectado', 'info');
        break;
    }
  }

  // --- Sincronización Inicial con la API ---
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();

      if (data.networks && data.networks.length > 0) {
        const net = data.networks[0];
        el.netSubnetLabel.innerText = `Subred: ${net.baseSubnet}.0/24 (${net.ip})`;
      }

      state.connectedDevice = data.connectedDevice;
      state.deviceInfo = data.deviceInfo;
      updateDeviceUI();

      if (data.isScanning) {
        setScanningState(true);
      }
    } catch (e) {
      console.error('Error al obtener estado inicial:', e);
    }
  }

  // --- Actualizar Interfaz según estado del Dispositivo ---
  function updateDeviceUI() {
    const isConnected = !!state.connectedDevice;

    if (isConnected) {
      el.globalStatusDot.className = 'status-dot connected';
      el.globalStatusText.innerText = `Conectado a ${state.connectedDevice}`;
      el.btnGlobalDisconnect.classList.remove('hidden');

      el.heroInactiveView.classList.add('hidden');
      el.heroActiveView.classList.remove('hidden');

      const info = state.deviceInfo || {};
      el.heroModelName.innerText = info.model || state.connectedDevice;
      el.heroBrand.innerText = (info.brand || info.manufacturer || 'ANDROID TV').toUpperCase();
      el.heroIpTarget.innerText = state.connectedDevice;
      el.heroAndroidVer.innerText = info.androidVersion || '-';
      el.heroResolution.innerText = info.resolution || '-';
      el.heroDensity.innerText = info.density ? `${info.density} dpi` : '-';
      el.heroCpu.innerText = info.cpuAbi || '-';

      const animVal = info.animations ? `${info.animations.window}x` : '1.0x';
      el.heroAnimVal.innerText = animVal;
      el.heroStayOnVal.innerText = info.stayOn ? 'ON' : 'OFF';

      if (el.switchStayAwake) {
        el.switchStayAwake.checked = !!info.stayOn;
        el.labelStayAwake.innerText = info.stayOn ? 'Activo (Siempre encendida)' : 'Inactivo (Normal)';
      }

      // Si la pestaña actual es debloat, cargar paquetes
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab && activeTab.dataset.tab === 'tab-debloat' && state.packages.length === 0) {
        loadPackages();
      }
    } else {
      el.globalStatusDot.className = 'status-dot disconnected';
      el.globalStatusText.innerText = 'Sin dispositivo conectado';
      el.btnGlobalDisconnect.classList.add('hidden');

      el.heroInactiveView.classList.remove('hidden');
      el.heroActiveView.classList.add('hidden');
    }
  }

  // --- Navegación por Pestañas ---
  el.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      el.tabButtons.forEach(b => b.classList.remove('active'));
      el.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');

      // Acciones automáticas por tab
      if (targetId === 'tab-debloat' && state.connectedDevice && state.packages.length === 0) {
        loadPackages();
      }
      if (targetId === 'tab-adblock' && state.connectedDevice) {
        fetchAdblockStatus();
      }
      if (targetId === 'tab-remote' && state.connectedDevice && !el.tvScreenImg.src) {
        takeScreenshot();
      }
    });
  });

  el.btnFocusScanner.addEventListener('click', () => {
    const scannerTabBtn = document.querySelector('[data-tab="tab-scanner"]');
    if (scannerTabBtn) scannerTabBtn.click();
  });

  // --- Radar & Scanner ---
  function setScanningState(scanning) {
    state.isScanning = scanning;
    if (scanning) {
      el.btnStartScan.classList.add('hidden');
      el.btnStopScan.classList.remove('hidden');
      el.scanProgressBox.classList.remove('hidden');
      el.radarSweep.classList.add('active');
    } else {
      el.btnStartScan.classList.remove('hidden');
      el.btnStopScan.classList.add('hidden');
      el.scanProgressBox.classList.add('hidden');
      el.radarSweep.classList.remove('active');
    }
  }

  el.btnStartScan.addEventListener('click', async () => {
    try {
      el.discoveredDevicesList.innerHTML = '';
      state.discoveredDevices.clear();
      el.devicesCountBadge.innerText = '0 Encontrados';

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al iniciar escaneo', 'error');
      }
    } catch (e) {
      showToast('Error conectando con el servidor', 'error');
    }
  });

  el.btnStopScan.addEventListener('click', async () => {
    await fetch('/api/scan/stop', { method: 'POST' });
  });

  function addDiscoveredDevice(dev) {
    if (state.discoveredDevices.has(dev.ip)) return;
    state.discoveredDevices.set(dev.ip, dev);
    el.devicesCountBadge.innerText = `${state.discoveredDevices.size} Encontrados`;

    const item = document.createElement('div');
    item.className = `device-card-item ${dev.isAdbReady ? 'is-adb' : ''}`;
    
    const tvName = dev.vendor && dev.vendor !== 'Desconocido' ? dev.vendor : 'Dispositivo Wi-Fi';
    const isCast = dev.isCastDevice;
    const isAdb = dev.isAdbReady;

    item.innerHTML = `
      <div class="dev-left-info">
        <div class="dev-icon-badge">${isAdb ? '⚡' : isCast ? '📺' : '📡'}</div>
        <div class="dev-details-text">
          <h4>
            <span>${tvName}</span>
            ${isAdb ? '<span class="badge badge-cyan">ADB ABIERTO</span>' : ''}
            ${isCast ? '<span class="badge badge-purple">GOOGLE CAST</span>' : ''}
          </h4>
          <div class="dev-meta-chips">
            <span>IP: <strong>${dev.ip}</strong></span>
            ${dev.mac ? `<span>MAC: ${dev.mac}</span>` : ''}
            <span class="port-tag ${dev.ports[5555] ? 'port-open' : ''}">ADB:5555</span>
            <span class="port-tag ${dev.ports[8008] || dev.ports[8009] ? 'port-open' : ''}">Cast:8008</span>
          </div>
        </div>
      </div>
      <div class="dev-right-actions">
        <button class="btn btn-sm ${isAdb ? 'btn-primary' : 'btn-cyan'} btn-connect-dev" data-ip="${dev.ip}">
          ${isAdb ? '⚡ Conectar 1-Clic' : 'Probar Conexión (5555)'}
        </button>
      </div>
    `;

    item.querySelector('.btn-connect-dev').addEventListener('click', () => {
      connectToDevice(dev.ip, 5555);
    });

    el.discoveredDevicesList.appendChild(item);
  }

  // --- Conexión Manual ---
  async function connectToDevice(ip, port = 5555) {
    if (!ip) {
      showToast('Ingresa una dirección IP válida', 'error');
      return;
    }

    showToast(`Conectando a ${ip}:${port}...`, 'info');
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: Number(port) })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        await fetchStatus();
      } else {
        showToast(data.message || 'Error al conectar', 'error');
        // Abrir guía si falló
        el.guideModal.classList.remove('hidden');
      }
    } catch (e) {
      showToast('Error al comunicar con backend', 'error');
    }
  }

  el.btnConnectManual.addEventListener('click', () => {
    const ip = el.inputManualIp.value.trim();
    const port = el.inputManualPort.value.trim() || 5555;
    connectToDevice(ip, port);
  });

  // Desconexión
  async function disconnectDevice() {
    try {
      await fetch('/api/disconnect', { method: 'POST' });
      state.connectedDevice = null;
      state.deviceInfo = null;
      updateDeviceUI();
    } catch (e) {
      console.error(e);
    }
  }
  el.btnHeroDisconnect.addEventListener('click', disconnectDevice);
  el.btnGlobalDisconnect.addEventListener('click', disconnectDevice);

  el.btnRefreshDeviceInfo.addEventListener('click', async () => {
    showToast('Actualizando datos de la TV...', 'info');
    const res = await fetch('/api/device/info');
    const data = await res.json();
    if (data.info) {
      state.deviceInfo = data.info;
      updateDeviceUI();
      showToast('Datos actualizados', 'success');
    }
  });

  // --- Emparejamiento Inalámbrico Android 11+ ---
  el.togglePairingSection.addEventListener('click', () => {
    el.pairingBody.classList.toggle('collapsed');
  });

  el.btnExecutePair.addEventListener('click', async () => {
    const ip = el.inputPairIp.value.trim();
    const port = el.inputPairPort.value.trim();
    const code = el.inputPairCode.value.trim();

    if (!ip || !port || !code) {
      showToast('Debes ingresar IP, puerto y código de 6 dígitos', 'error');
      return;
    }

    showToast(`Emparejando con ${ip}:${port}...`, 'info');
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: Number(port), code })
      });
      const data = await res.json();
      if (data.success) {
        showToast('¡Emparejamiento exitoso! Ahora puedes conectarte.', 'success');
        el.inputManualIp.value = ip;
      } else {
        showToast(data.message || 'Error en emparejamiento', 'error');
      }
    } catch (e) {
      showToast('Error al emparejar', 'error');
    }
  });

  // --- Modificaciones & Tweaks ---
  // 1. Animaciones
  el.animButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.connectedDevice) {
        showToast('Conecta tu Android TV primero', 'error');
        return;
      }
      const speed = parseFloat(btn.dataset.anim);
      el.animButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const res = await fetch('/api/device/tweaks/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Velocidad de animaciones ajustada a ${speed}x`, 'success');
        el.heroAnimVal.innerText = `${speed}x`;
      } else {
        showToast('Error al modificar animaciones', 'error');
      }
    });
  });

  // 2. Densidad DPI
  el.dpiPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      el.inputCustomDpi.value = btn.dataset.dpi;
      applyDpi(btn.dataset.dpi);
    });
  });
  el.btnApplyDpi.addEventListener('click', () => applyDpi(el.inputCustomDpi.value.trim()));
  el.btnResetDpi.addEventListener('click', () => applyDpi('reset'));

  async function applyDpi(density) {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    if (!density) return showToast('Ingresa un valor de DPI', 'error');

    const res = await fetch('/api/device/tweaks/density', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ density })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Densidad de pantalla configurada: ${density}`, 'success');
      el.heroDensity.innerText = `${density} dpi`;
    } else {
      showToast('Error al configurar DPI', 'error');
    }
  }

  // 3. Resolución
  el.resPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      el.inputCustomRes.value = btn.dataset.res;
      applyRes(btn.dataset.res);
    });
  });
  el.btnApplyRes.addEventListener('click', () => applyRes(el.inputCustomRes.value.trim()));
  el.btnResetRes.addEventListener('click', () => applyRes('reset'));

  async function applyRes(resolution) {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    if (!resolution) return showToast('Ingresa una resolución (ej. 1920x1080)', 'error');

    const res = await fetch('/api/device/tweaks/resolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Resolución configurada: ${resolution}`, 'success');
      el.heroResolution.innerText = resolution;
    } else {
      showToast('Error al configurar resolución', 'error');
    }
  }

  // 4. Stay Awake
  el.switchStayAwake.addEventListener('change', async (e) => {
    if (!state.connectedDevice) {
      e.target.checked = !e.target.checked;
      return showToast('Conecta tu Android TV primero', 'error');
    }
    const enabled = e.target.checked;
    const res = await fetch('/api/device/tweaks/stay-awake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await res.json();
    if (data.success) {
      el.labelStayAwake.innerText = enabled ? 'Activo (Siempre encendida)' : 'Inactivo (Normal)';
      el.heroStayOnVal.innerText = enabled ? 'ON' : 'OFF';
      showToast(`Pantalla activa: ${enabled ? 'Habilitada' : 'Deshabilitada'}`, 'success');
    }
  });

  // 5. Trim Caches
  el.btnTrimCaches.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    showToast('Liberando caché del sistema en la TV...', 'info');
    const res = await fetch('/api/device/tweaks/trim-caches', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('¡Cachés limpiadas exitosamente!', 'success');
    } else {
      showToast('Error al limpiar cachés', 'error');
    }
  });

  // 6. Reinicios
  el.btnRebootNormal.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    if (confirm('¿Seguro que deseas reiniciar tu Android TV ahora?')) {
      await fetch('/api/device/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'reboot' })
      });
      showToast('Reiniciando TV...', 'info');
      disconnectDevice();
    }
  });

  el.btnRebootRecovery.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    if (confirm('¿Reiniciar Android TV en modo Recovery?')) {
      await fetch('/api/device/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'reboot recovery' })
      });
      showToast('Reiniciando a Recovery...', 'info');
      disconnectDevice();
    }
  });

  // --- Debloater & Gestor de Paquetes ---
  async function loadPackages() {
    if (!state.connectedDevice) return;
    el.packagesLoading.classList.remove('hidden');
    el.packagesList.innerHTML = '';

    try {
      const res = await fetch('/api/device/packages');
      const data = await res.json();
      state.packages = data.packages || [];
      renderPackages();
    } catch (e) {
      showToast('Error cargando paquetes de la TV', 'error');
    } finally {
      el.packagesLoading.classList.add('hidden');
    }
  }

  function renderPackages() {
    el.packagesList.innerHTML = '';

    let filtered = state.packages;

    // Filtro por categoría
    if (state.packageFilter === 'bloat') {
      filtered = filtered.filter(p => p.isBloat);
    } else if (state.packageFilter === 'disabled') {
      filtered = filtered.filter(p => p.isDisabled);
    } else if (state.packageFilter === 'thirdparty') {
      filtered = filtered.filter(p => !p.isSystem);
    } else if (state.packageFilter === 'system') {
      filtered = filtered.filter(p => p.isSystem);
    }

    // Filtro de texto
    if (state.packageSearch) {
      const query = state.packageSearch.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    // Actualizar contadores
    el.countAll.innerText = state.packages.length;
    el.countBloat.innerText = state.packages.filter(p => p.isBloat).length;
    el.countDisabled.innerText = state.packages.filter(p => p.isDisabled).length;
    el.countThird.innerText = state.packages.filter(p => !p.isSystem).length;
    el.countSystem.innerText = state.packages.filter(p => p.isSystem).length;

    if (filtered.length === 0) {
      el.packagesList.innerHTML = `
        <div class="packages-loading">
          <span>No se encontraron paquetes con los filtros seleccionados</span>
        </div>
      `;
      return;
    }

    filtered.forEach(pkg => {
      const item = document.createElement('div');
      item.className = `package-item ${pkg.isBloat ? 'is-bloat' : ''} ${pkg.isDisabled ? 'is-disabled' : ''}`;

      item.innerHTML = `
        <div class="pkg-name-col">
          <span class="pkg-id">${pkg.name}</span>
          <div class="pkg-submeta">
            <span>${pkg.isSystem ? 'Sistema' : 'Usuario/Tercero'}</span>
            ${pkg.isBloat ? `<span class="badge badge-glow">${pkg.bloatCategory || 'Bloatware'}</span>` : ''}
            ${pkg.isDisabled ? '<span class="badge badge-purple">DESHABILITADA</span>' : ''}
          </div>
        </div>
        <div class="pkg-actions-col">
          ${pkg.isDisabled ? 
            `<button class="btn btn-xs btn-cyan btn-act" data-action="enable" data-pkg="${pkg.name}" title="Habilitar">Activar</button>` :
            `<button class="btn btn-xs btn-danger-ghost btn-act" data-action="disable" data-pkg="${pkg.name}" title="Congelar/Deshabilitar">Deshabilitar</button>`
          }
          <button class="btn btn-xs btn-ghost btn-act" data-action="force-stop" data-pkg="${pkg.name}" title="Forzar Detención">Detener</button>
          <button class="btn btn-xs btn-ghost btn-act" data-action="clear-data" data-pkg="${pkg.name}" title="Borrar Datos">Limpiar</button>
          <button class="btn btn-xs btn-ghost btn-act" data-action="launch" data-pkg="${pkg.name}" title="Abrir en TV">▶ Abrir</button>
        </div>
      `;

      item.querySelectorAll('.btn-act').forEach(btn => {
        btn.addEventListener('click', () => {
          handlePackageAction(btn.dataset.action, btn.dataset.pkg);
        });
      });

      el.packagesList.appendChild(item);
    });
  }

  async function handlePackageAction(action, pkg) {
    showToast(`Ejecutando ${action} en ${pkg}...`, 'info');
    try {
      const res = await fetch('/api/device/package/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, pkg })
      });
      const data = await res.json();
      if (data.result && data.result.success) {
        showToast(`Acción completada: ${action}`, 'success');
        // Actualizar estado local
        const p = state.packages.find(x => x.name === pkg);
        if (p) {
          if (action === 'disable') p.isDisabled = true;
          if (action === 'enable') p.isDisabled = false;
        }
        renderPackages();
      } else {
        showToast(data.result?.stderr || 'Error al ejecutar acción', 'error');
      }
    } catch (e) {
      showToast('Error en petición al servidor', 'error');
    }
  }

  // Filtros de Paquetes
  el.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      el.filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.packageFilter = pill.dataset.filter;
      renderPackages();
    });
  });

  el.inputSearchPackage.addEventListener('input', (e) => {
    state.packageSearch = e.target.value.trim();
    renderPackages();
  });

  // Auto Debloat Seguro
  el.btnAutoDebloat.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    const bloatList = state.packages.filter(p => p.isBloat && !p.isDisabled);
    if (bloatList.length === 0) {
      return showToast('No hay bloatware pendiente por deshabilitar', 'info');
    }

    if (confirm(`¿Deshabilitar ${bloatList.length} aplicaciones marcadas como bloatware de forma segura? Podrás reactivarlas en cualquier momento.`)) {
      showToast(`Deshabilitando ${bloatList.length} paquetes...`, 'info');
      for (const p of bloatList) {
        await handlePackageAction('disable', p.name);
      }
      showToast('Debloat completado', 'success');
    }
  });

  // --- Subida e Instalación de APK (Drag & Drop) ---
  el.btnSelectApk.addEventListener('click', () => el.apkFileInput.click());

  el.apkFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      uploadAndInstallApk(e.target.files[0]);
    }
  });

  el.apkDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.apkDropZone.classList.add('dragover');
  });

  el.apkDropZone.addEventListener('dragleave', () => {
    el.apkDropZone.classList.remove('dragover');
  });

  el.apkDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.apkDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      uploadAndInstallApk(e.dataTransfer.files[0]);
    }
  });

  function uploadAndInstallApk(file) {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    if (!file.name.endsWith('.apk')) return showToast('El archivo debe tener extensión .apk', 'error');

    el.uploadProgressBox.classList.remove('hidden');
    el.uploadStatusText.innerText = `Instalando ${file.name} en la TV...`;
    el.uploadPercent.innerText = '0%';
    el.uploadProgressFill.style.width = '0%';

    const formData = new FormData();
    formData.append('apk', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/device/install-apk', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        el.uploadPercent.innerText = `${percent}%`;
        el.uploadProgressFill.style.width = `${percent}%`;
        if (percent >= 100) {
          el.uploadStatusText.innerText = 'Transfiriendo APK y ejecutando instalador ADB...';
        }
      }
    };

    xhr.onload = () => {
      el.uploadProgressBox.classList.add('hidden');
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        if (res.success) {
          showToast(`¡APK instalada con éxito!: ${file.name}`, 'success');
          loadPackages();
        } else {
          showToast(`Error al instalar APK: ${res.stderr || res.error}`, 'error');
        }
      } else {
        showToast('Error en la subida del archivo', 'error');
      }
    };

    xhr.onerror = () => {
      el.uploadProgressBox.classList.add('hidden');
      showToast('Error de conexión al subir APK', 'error');
    };

    xhr.send(formData);
  }

  // --- Control Remoto Virtual ---
  el.remoteKeys.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
      const keycode = Number(btn.dataset.key);
      try {
        await fetch('/api/device/remote/key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keycode })
        });
      } catch (e) {
        console.error(e);
      }
    });
  });

  el.btnSendTvText.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    const text = el.inputTvText.value;
    if (!text) return;

    await fetch('/api/device/remote/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    showToast('Texto enviado a la pantalla', 'success');
    el.inputTvText.value = '';
  });

  el.inputTvText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.btnSendTvText.click();
  });

  // --- Captura de Pantalla ---
  async function takeScreenshot() {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

    const timestamp = Date.now();
    const url = `/api/device/screenshot?t=${timestamp}`;

    el.tvScreenPlaceholder.innerText = 'Capturando pantalla en vivo...';
    
    const img = new Image();
    img.onload = () => {
      el.tvScreenImg.src = url;
      el.tvScreenImg.classList.remove('hidden');
      el.tvScreenPlaceholder.classList.add('hidden');
    };
    img.onerror = () => {
      el.tvScreenPlaceholder.innerText = 'No se pudo obtener captura. Asegúrate de autorizar la TV.';
      el.tvScreenPlaceholder.classList.remove('hidden');
      el.tvScreenImg.classList.add('hidden');
    };
    img.src = url;
  }

  el.btnTakeScreenshot.addEventListener('click', takeScreenshot);

  el.checkAutoScreenshot.addEventListener('change', (e) => {
    if (e.target.checked) {
      takeScreenshot();
      state.screenshotInterval = setInterval(takeScreenshot, 3000);
    } else {
      if (state.screenshotInterval) clearInterval(state.screenshotInterval);
    }
  });

  // --- Terminal Shell ADB ---
  function appendTerminalLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerText = text;
    el.terminalScreen.appendChild(line);
    el.terminalScreen.scrollTop = el.terminalScreen.scrollHeight;
  }

  async function executeShell(command) {
    if (!state.connectedDevice) {
      appendTerminalLine('[ERROR] No hay dispositivo conectado', 'error');
      return;
    }
    if (!command.trim()) return;

    appendTerminalLine(`$ ${command}`, 'cmd-prompt');
    state.shellHistory.push(command);
    state.shellHistoryIndex = state.shellHistory.length;

    try {
      const res = await fetch('/api/device/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();

      if (data.stdout) {
        appendTerminalLine(data.stdout);
      }
      if (data.stderr) {
        appendTerminalLine(data.stderr, 'error');
      }
      if (!data.stdout && !data.stderr) {
        appendTerminalLine('[Comando ejecutado sin salida]');
      }
    } catch (e) {
      appendTerminalLine(`[ERROR de conexión]: ${e.message}`, 'error');
    }
  }

  el.btnSendShell.addEventListener('click', () => {
    const cmd = el.terminalInput.value;
    el.terminalInput.value = '';
    executeShell(cmd);
  });

  el.terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      el.btnSendShell.click();
    } else if (e.key === 'ArrowUp') {
      if (state.shellHistoryIndex > 0) {
        state.shellHistoryIndex--;
        el.terminalInput.value = state.shellHistory[state.shellHistoryIndex];
      }
    } else if (e.key === 'ArrowDown') {
      if (state.shellHistoryIndex < state.shellHistory.length - 1) {
        state.shellHistoryIndex++;
        el.terminalInput.value = state.shellHistory[state.shellHistoryIndex];
      } else {
        state.shellHistoryIndex = state.shellHistory.length;
        el.terminalInput.value = '';
      }
    }
  });

  el.cmdPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      executeShell(btn.dataset.cmd);
    });
  });

  el.btnClearTerminal.addEventListener('click', () => {
    el.terminalScreen.innerHTML = '';
  });

  // ==========================================================
  // --- MÓDULO AD-BLOCK & PRIVACIDAD                          ---
  // ==========================================================

  async function fetchAdblockStatus() {
    if (!state.connectedDevice) return;
    try {
      const res = await fetch('/api/device/adblock/status');
      const data = await res.json();

      // Estado de DNS
      const dns = data.dns || {};
      el.dnsProviderCards.forEach(c => c.classList.remove('active-dns'));

      if (dns.mode === 'hostname' && dns.specifier) {
        el.dnsStatusBadge.className = 'badge badge-cyan';
        el.dnsStatusBadge.innerText = `ACTIVO: ${dns.specifier}`;
        
        // Marcar tarjeta correspondiente si coincide
        el.dnsProviderCards.forEach(card => {
          const p = card.dataset.provider;
          if (
            (p === 'adguard' && dns.specifier.includes('dns.adguard')) ||
            (p === 'adguard-family' && dns.specifier.includes('family.adguard')) ||
            (p === 'mullvad' && dns.specifier.includes('mullvad'))
          ) {
            card.classList.add('active-dns');
          }
        });
      } else {
        el.dnsStatusBadge.className = 'badge badge-counter';
        el.dnsStatusBadge.innerText = `MODO: ${dns.mode || 'Automático'} (Sin Filtro)`;
        const autoCard = document.querySelector('.dns-provider-card[data-provider="auto"]');
        if (autoCard) autoCard.classList.add('active-dns');
      }

      // Estado de Launcher Ads
      const adsDisabled = !!data.launcherAdsDisabled;
      el.switchDisableLauncherAds.checked = adsDisabled;
      el.labelLauncherAds.innerText = adsDisabled ? 'Bloqueados (Recomendaciones Desactivadas)' : 'Permitidos (Recomendaciones Activas)';
    } catch (e) {
      console.error('Error al obtener estado de Ad-Block:', e);
    }
  }

  // Aplicar Proveedor de DNS
  async function applyDnsProvider(provider, customHost = '') {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

    showToast(`Configurando DNS Privado en la TV (${provider})...`, 'info');
    try {
      const res = await fetch('/api/device/adblock/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, customHost })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        await fetchAdblockStatus();
      } else {
        showToast(data.message || 'Error al aplicar DNS', 'error');
      }
    } catch (e) {
      showToast('Error de conexión al aplicar DNS', 'error');
    }
  }

  el.btnApplyDnsList.forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      applyDnsProvider(provider);
    });
  });

  el.btnApplyCustomDns.addEventListener('click', () => {
    const host = el.inputCustomDnsHost.value.trim();
    if (!host) return showToast('Ingresa el host DoT (ej: dns.adguard-dns.com)', 'error');
    applyDnsProvider('custom', host);
  });

  // Switch de Recomendaciones y Anuncios del Home
  el.switchDisableLauncherAds.addEventListener('change', async (e) => {
    if (!state.connectedDevice) {
      e.target.checked = !e.target.checked;
      return showToast('Conecta tu Android TV primero', 'error');
    }

    const disable = e.target.checked;
    showToast(disable ? 'Bloqueando recomendaciones del Home...' : 'Restaurando recomendaciones...', 'info');

    try {
      const res = await fetch('/api/device/adblock/launcher-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disable })
      });
      const data = await res.json();
      if (data.success) {
        el.labelLauncherAds.innerText = disable ? 'Bloqueados (Recomendaciones Desactivadas)' : 'Permitidos (Recomendaciones Activas)';
        showToast(data.message, 'success');
      } else {
        showToast('Error al modificar anuncios del Launcher', 'error');
        e.target.checked = !disable;
      }
    } catch (e) {
      showToast('Error en la petición', 'error');
    }
  });

  // Instalación de SmartTube en 1-Clic
  el.btnInstallSmartTube.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

    el.btnInstallSmartTube.disabled = true;
    el.spinnerSmartTube.classList.remove('hidden');
    el.textSmartTube.innerText = 'Descargando e instalando SmartTube oficial en la TV...';

    showToast('Descargando la última versión oficial de SmartTube...', 'info');

    try {
      const res = await fetch('/api/device/apps/install-curated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appKey: 'smarttube' })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        el.textSmartTube.innerText = '✔ ¡SmartTube Instalado con Éxito!';
      } else {
        showToast(data.message || 'Error al instalar SmartTube', 'error');
        el.textSmartTube.innerText = '⚡ Instalar SmartTube en 1-Clic';
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      el.textSmartTube.innerText = '⚡ Instalar SmartTube en 1-Clic';
    } finally {
      el.btnInstallSmartTube.disabled = false;
      el.spinnerSmartTube.classList.add('hidden');
    }
  });

  // Instalación de Projectivy Launcher
  el.btnInstallProjectivy.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

    el.btnInstallProjectivy.disabled = true;
    el.spinnerProjectivy.classList.remove('hidden');
    el.textProjectivy.innerText = 'Descargando e instalando Projectivy Launcher...';

    showToast('Descargando Projectivy Launcher...', 'info');

    try {
      const res = await fetch('/api/device/apps/install-curated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appKey: 'projectivy' })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        el.textProjectivy.innerText = '✔ ¡Projectivy Launcher Instalado!';
      } else {
        showToast(data.message || 'Error al instalar Projectivy', 'error');
        el.textProjectivy.innerText = '📦 Instalar Projectivy Launcher';
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      el.textProjectivy.innerText = '📦 Instalar Projectivy Launcher';
    } finally {
      el.btnInstallProjectivy.disabled = false;
      el.spinnerProjectivy.classList.add('hidden');
    }
  });

  // Límite de RAM / Procesos de Background
  el.btnRamLimitList.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

      const limit = Number(btn.dataset.limit);
      el.btnRamLimitList.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const res = await fetch('/api/device/tweaks/background-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast('Error al configurar límite de procesos', 'error');
      }
    });
  });

  // --- Modal de Guía ---
  el.btnOpenGuide.addEventListener('click', () => el.guideModal.classList.remove('hidden'));
  el.btnCloseGuide.addEventListener('click', () => el.guideModal.classList.add('hidden'));
  el.btnGuideGotIt.addEventListener('click', () => el.guideModal.classList.add('hidden'));

  // --- Inicialización ---
  initWebSocket();
  fetchStatus();
});
