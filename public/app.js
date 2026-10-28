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
    btnRestartServer: document.getElementById('btnRestartServer'),
    
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
    deviceHistoryList: document.getElementById('deviceHistoryList'),
    historyEmptyText: document.getElementById('historyEmptyText'),
    historyCountBadge: document.getElementById('historyCountBadge'),

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
    launcherAdsNote: document.getElementById('launcherAdsNote'),
    btnOpenTvSettings: document.getElementById('btnOpenTvSettings'),
    switchPersistDns: document.getElementById('switchPersistDns'),
    labelPersistDns: document.getElementById('labelPersistDns'),
    persistDnsNote: document.getElementById('persistDnsNote'),
    btnInstallSmartTube: document.getElementById('btnInstallSmartTube'),
    spinnerSmartTube: document.getElementById('spinnerSmartTube'),
    textSmartTube: document.getElementById('textSmartTube'),
    btnInstallAdguardTv: document.getElementById('btnInstallAdguardTv'),
    spinnerAdguardTv: document.getElementById('spinnerAdguardTv'),
    textAdguardTv: document.getElementById('textAdguardTv'),
    inputNextDnsId: document.getElementById('inputNextDnsId'),
    btnApplyNextDns: document.getElementById('btnApplyNextDns'),
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

    // AirPlay iPhone
    airPlayStatusBadge: document.getElementById('airPlayStatusBadge'),
    airPlayStatusTitle: document.getElementById('airPlayStatusTitle'),
    airPlayStatusDesc: document.getElementById('airPlayStatusDesc'),
    btnLaunchAirScreen: document.getElementById('btnLaunchAirScreen'),
    textAirScreenAction: document.getElementById('textAirScreenAction'),
    metricAirPlayProfile: document.getElementById('metricAirPlayProfile'),
    airPlayProfileValue: document.getElementById('airPlayProfileValue'),
    airPlayProfileDetail: document.getElementById('airPlayProfileDetail'),
    metricAirPlayRunning: document.getElementById('metricAirPlayRunning'),
    airPlayRunningValue: document.getElementById('airPlayRunningValue'),
    airPlayRunningDetail: document.getElementById('airPlayRunningDetail'),
    metricAirPlayNetwork: document.getElementById('metricAirPlayNetwork'),
    airPlayNetworkValue: document.getElementById('airPlayNetworkValue'),
    airPlayNetworkDetail: document.getElementById('airPlayNetworkDetail'),
    metricAirPlayIp: document.getElementById('metricAirPlayIp'),
    airPlayIpValue: document.getElementById('airPlayIpValue'),
    airPlayIpDetail: document.getElementById('airPlayIpDetail'),
    btnScanAirPlayNetwork: document.getElementById('btnScanAirPlayNetwork'),
    airPlayScanNote: document.getElementById('airPlayScanNote'),
    airPlayHint: document.getElementById('airPlayHint'),
    inputDirectUrl: document.getElementById('inputDirectUrl'),
    btnSendDirectUrl: document.getElementById('btnSendDirectUrl'),

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
    const iconSvg = type === 'success' 
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : type === 'error'
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span class="toast-msg">${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Utilidades de presentación ---
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatRelativeTime(isoDate) {
    const time = new Date(isoDate).getTime();
    if (!Number.isFinite(time)) return 'fecha desconocida';

    const diffMinutes = Math.floor((Date.now() - time) / 60000);
    if (diffMinutes < 1) return 'hace unos segundos';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ayer';
    if (diffDays < 30) return `hace ${diffDays} días`;

    return new Date(time).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
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
      if (targetId === 'tab-airplay' && state.connectedDevice) {
        checkAirPlayStatus();
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

    const devIconSvg = isAdb
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
      : isCast
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';

    item.innerHTML = `
      <div class="dev-left-info">
        <div class="dev-icon-badge">${devIconSvg}</div>
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
          ${isAdb ? 'Conectar' : 'Probar Conexión'}
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
        loadDeviceHistory();
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

  // --- Historial de Dispositivos ---
  function renderDeviceHistory(devices) {
    const entries = Array.isArray(devices) ? devices : [];

    el.historyCountBadge.innerText = String(entries.length);
    el.historyEmptyText.classList.toggle('hidden', entries.length > 0);
    el.deviceHistoryList.innerHTML = '';

    entries.forEach(device => {
      const item = document.createElement('div');
      item.className = 'history-item';

      const model = device.model || device.target || device.ip;
      const brand = device.brand || '';
      const androidVersion = device.androidVersion || '';
      const detail = [brand, androidVersion ? `Android ${androidVersion}` : ''].filter(Boolean).join(' · ');
      const lastConnected = device.lastConnected || '';

      item.innerHTML = `
        <div class="history-item-main">
          <div class="history-item-title">
            <span>${escapeHtml(model)}</span>
            ${lastConnected ? `<span class="history-time">${escapeHtml(formatRelativeTime(lastConnected))}</span>` : ''}
          </div>
          <div class="history-item-sub">
            <span class="mono">${escapeHtml(device.ip)}:${escapeHtml(device.port)}</span>
            ${detail ? ` · ${escapeHtml(detail)}` : ''}
          </div>
        </div>
        <div class="history-actions">
          <button class="btn btn-cyan" data-history-connect title="Conectar a este dispositivo">Conectar</button>
          <button class="btn-history-remove" data-history-remove title="Quitar del historial" aria-label="Quitar del historial">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;

      item.querySelector('[data-history-connect]').addEventListener('click', async () => {
        el.inputManualIp.value = device.ip;
        el.inputManualPort.value = device.port;
        await connectToDevice(device.ip, device.port);
      });

      item.querySelector('[data-history-remove]').addEventListener('click', async () => {
        try {
          const res = await fetch('/api/devices/history/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: `${device.ip}:${device.port}` })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Dispositivo eliminado del historial', 'success');
            renderDeviceHistory(data.devices);
          } else {
            showToast('No se encontró el dispositivo en el historial', 'error');
          }
        } catch (e) {
          showToast('Error al actualizar el historial', 'error');
        }
      });

      el.deviceHistoryList.appendChild(item);
    });
  }

  async function loadDeviceHistory() {
    try {
      const res = await fetch('/api/devices/history');
      const data = await res.json();
      renderDeviceHistory(data.devices);
    } catch (e) {
      console.error('No se pudo cargar el historial de dispositivos:', e);
    }
  }

  // --- Reinicio del Servidor ---
  async function getServerBootId() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.bootId || null;
    } catch (e) {
      return null;
    }
  }

  async function waitForServerRestart(previousBootId, maxWaitMs = 20000) {
    const startedAt = Date.now();
    let sawFailure = false;

    while (Date.now() - startedAt < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 700));

      const bootId = await getServerBootId();
      if (!bootId) {
        sawFailure = true; // El servidor anterior ya se cerró
        continue;
      }

      if (previousBootId) {
        if (bootId !== previousBootId) return true;
      } else if (sawFailure) {
        // Servidor previo sin bootId (versión anterior): exigir un corte real
        return true;
      }
    }
    return false;
  }

  el.btnRestartServer.addEventListener('click', async () => {
    const confirmed = window.confirm('¿Reiniciar el servidor de NeoSwitch TV? Las operaciones en curso se interrumpirán.');
    if (!confirmed) return;

    el.btnRestartServer.disabled = true;
    showToast('Reiniciando el servidor...', 'info');

    const previousBootId = await getServerBootId();

    try {
      const res = await fetch('/api/server/restart', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'No se pudo reiniciar el servidor', 'error');
        el.btnRestartServer.disabled = false;
        return;
      }
    } catch (e) {
      // La conexión puede cortarse antes de recibir la respuesta; se valida con el sondeo
    }

    const recovered = await waitForServerRestart(previousBootId);
    if (recovered) {
      showToast('Servidor reiniciado. Recargando panel...', 'success');
      setTimeout(() => window.location.reload(), 600);
    } else {
      showToast('El servidor no respondió a tiempo. Recarga la página manualmente.', 'error');
      el.btnRestartServer.disabled = false;
    }
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
          <button class="btn btn-xs btn-ghost btn-act" data-action="launch" data-pkg="${pkg.name}" title="Abrir en TV" style="display:inline-flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Abrir</button>
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

  function applyLauncherAdsUi(info, disabled) {
    const canToggle = !info || info.canToggle !== false;
    const adsDisabled = !!disabled;

    el.switchDisableLauncherAds.checked = adsDisabled;
    el.switchDisableLauncherAds.disabled = !canToggle;

    if (!canToggle) {
      el.labelLauncherAds.innerText = info && info.isGoogleTv
        ? 'Controlado por Google TV'
        : 'Controlado por el sistema';
      el.launcherAdsNote.innerText = info && info.isGoogleTv
        ? 'En Google TV las recomendaciones y anuncios los dibuja el launcher del sistema, así que este ajuste no se puede cambiar por ADB. Alternativas: activa "Modo solo apps" en Ajustes o usa Projectivy Launcher.'
        : `${(info && info.reason) || 'El sistema controla este ajuste y Android no permite cambiarlo desde ADB.'} Alternativas: "Modo solo apps" en Ajustes o Projectivy Launcher.`;
      el.launcherAdsNote.classList.remove('hidden');
      el.btnOpenTvSettings.classList.remove('hidden');
    } else {
      el.labelLauncherAds.innerText = adsDisabled
        ? 'Bloqueados (Recomendaciones Desactivadas)'
        : 'Permitidos (Recomendaciones Activas)';
      el.launcherAdsNote.classList.add('hidden');
      el.btnOpenTvSettings.classList.add('hidden');
    }
  }

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
            (p === 'mullvad' && dns.specifier.includes('mullvad')) ||
            (p === 'nextdns' && dns.specifier.includes('dns.nextdns.io'))
          ) {
            card.classList.add('active-dns');
          }
        });

        if (dns.specifier.includes('dns.nextdns.io')) {
          const id = dns.specifier.replace(/\.dns\.nextdns\.io$/i, '');
          if (id && document.activeElement !== el.inputNextDnsId) {
            el.inputNextDnsId.value = id;
          }
        }
      } else {
        el.dnsStatusBadge.className = 'badge badge-counter';
        el.dnsStatusBadge.innerText = `MODO: ${dns.mode || 'Automático'} (Sin Filtro)`;
        const autoCard = document.querySelector('.dns-provider-card[data-provider="auto"]');
        if (autoCard) autoCard.classList.add('active-dns');
      }

      // Estado de Launcher Ads
      const adsDisabled = !!data.launcherAdsDisabled;
      applyLauncherAdsUi(data.launcherAds, adsDisabled);

      // Persistencia del DNS tras reinicios
      applyPersistenceUi(data.persistence, data.guard);
    } catch (e) {
      console.error('Error al obtener estado de Ad-Block:', e);
    }
  }

  function applyPersistenceUi(persistence, guard) {
    const enabled = !!(guard && guard.enabled);
    const supported = !!(persistence && persistence.supported);
    const installed = !!(persistence && persistence.installed);
    const host = (guard && guard.host) || (persistence && persistence.host) || '';

    el.switchPersistDns.checked = enabled;
    el.persistDnsNote.classList.add('hidden');
    el.persistDnsNote.innerText = '';

    if (!state.connectedDevice) {
      el.labelPersistDns.innerText = 'Conecta tu Android TV';
      return;
    }

    if (enabled && installed) {
      el.labelPersistDns.innerText = `Activo · Script de arranque (root)${host ? ' · ' + host : ''}`;
      el.persistDnsNote.innerText = 'La propia TV reaplica el DNS en cada arranque, aunque NeoSwitch esté cerrado.';
      el.persistDnsNote.classList.remove('hidden');
      return;
    }

    if (enabled) {
      el.labelPersistDns.innerText = `Activo · Vigilancia del servidor${host ? ' · ' + host : ''}`;
      el.persistDnsNote.innerText = supported
        ? 'Vigilancia activa: NeoSwitch reaplica el DNS al reconectar. Mantén el servidor abierto para que sobreviva a los reinicios.'
        : 'Sin root/Magisk la TV no puede reaplicar el DNS por sí sola: NeoSwitch lo hace al reconectar. Mantén el servidor abierto o usa root para persistencia real.';
      el.persistDnsNote.classList.remove('hidden');
      return;
    }

    el.labelPersistDns.innerText = 'Inactivo';
    if (!supported) {
      el.persistDnsNote.innerText = 'Con root/Magisk se instala un script de arranque en la TV. Sin root, activa esta opción para que el servidor vigile y reaplique el DNS.';
      el.persistDnsNote.classList.remove('hidden');
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

  // NextDNS: el usuario pega su ID y se construye el host DoT
  el.btnApplyNextDns.addEventListener('click', async () => {
    let id = el.inputNextDnsId.value.trim().toLowerCase();
    id = id.replace(/^https?:\/\//, '').replace(/\.dns\.nextdns\.io\/?$/i, '');

    if (!/^[a-z0-9]{5,32}$/.test(id)) {
      return showToast('Ingresa tu ID de NextDNS (solo letras y números, ej: abc123)', 'error');
    }

    await applyDnsProvider('custom', `${id}.dns.nextdns.io`);
    showToast('En nextdns.io activa HaGeZi Multi Pro++ y OISD Full para el filtrado agresivo.', 'info');
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
        applyLauncherAdsUi({ canToggle: data.canToggle !== false, isGoogleTv: data.isGoogleTv }, disable);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Error al modificar anuncios del Launcher', 'error');
        // Reflejar el estado real del dispositivo si el backend lo conoce
        if (typeof data.adsDisabled === 'boolean') {
          applyLauncherAdsUi(
            { canToggle: data.canToggle !== false, isGoogleTv: data.isGoogleTv, reason: data.message },
            data.adsDisabled
          );
        } else {
          e.target.checked = !disable;
        }
      }
    } catch (e) {
      showToast('Error en la petición', 'error');
    }
  });

  // Switch de Persistencia del DNS tras reinicios
  el.switchPersistDns.addEventListener('change', async (e) => {
    if (!state.connectedDevice) {
      e.target.checked = !e.target.checked;
      return showToast('Conecta tu Android TV primero', 'error');
    }

    const enabled = e.target.checked;
    e.target.disabled = true;
    showToast(enabled ? 'Activando bloqueo permanente...' : 'Desactivando bloqueo permanente...', 'info');

    try {
      const res = await fetch('/api/device/adblock/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, installBootScript: true })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        if (enabled && data.bootScript && data.bootScript.supported === false) {
          showToast('Sin root/Magisk: se usará la vigilancia del servidor', 'info');
        }
        await fetchAdblockStatus();
      } else {
        showToast(data.message || 'No se pudo cambiar la persistencia', 'error');
        e.target.checked = !enabled;
        applyPersistenceUi(data.persistence, data.guard);
      }
    } catch (err) {
      e.target.checked = !enabled;
      showToast('Error de conexión al cambiar la persistencia', 'error');
    } finally {
      e.target.disabled = false;
    }
  });

  // Abrir los Ajustes de la TV (para activar "Modo solo apps")
  el.btnOpenTvSettings.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

    try {
      const res = await fetch('/api/device/settings/open', { method: 'POST' });
      const data = await res.json();
      showToast(data.message, data.success ? 'success' : 'error');
    } catch (e) {
      showToast('No se pudieron abrir los Ajustes de la TV', 'error');
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
        el.textSmartTube.innerText = '¡SmartTube Instalado con Éxito!';
      } else {
        showToast(data.message || 'Error al instalar SmartTube', 'error');
        el.textSmartTube.innerText = 'Instalar SmartTube en 1-Clic';
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      el.textSmartTube.innerText = 'Instalar SmartTube en 1-Clic';
    } finally {
      el.btnInstallSmartTube.disabled = false;
      el.spinnerSmartTube.classList.add('hidden');
    }
  });

  // Instalación de AdGuard para Android TV en 1-Clic
  el.btnInstallAdguardTv.addEventListener('click', async () => {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

    el.btnInstallAdguardTv.disabled = true;
    el.spinnerAdguardTv.classList.remove('hidden');
    el.textAdguardTv.innerText = 'Descargando e instalando AdGuard TV oficial...';

    showToast('Descargando la última versión oficial de AdGuard para Android TV...', 'info');

    try {
      const res = await fetch('/api/device/apps/install-curated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appKey: 'adguard-tv' })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        el.textAdguardTv.innerText = '¡AdGuard TV Instalado!';
      } else {
        showToast(data.message || 'Error al instalar AdGuard TV', 'error');
        el.textAdguardTv.innerText = 'Instalar AdGuard TV en 1-Clic';
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      el.textAdguardTv.innerText = 'Instalar AdGuard TV en 1-Clic';
    } finally {
      el.btnInstallAdguardTv.disabled = false;
      el.spinnerAdguardTv.classList.add('hidden');
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
        el.textProjectivy.innerText = '¡Projectivy Launcher Instalado!';
      } else {
        showToast(data.message || 'Error al instalar Projectivy', 'error');
        el.textProjectivy.innerText = 'Instalar Projectivy Launcher';
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      el.textProjectivy.innerText = 'Instalar Projectivy Launcher';
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

  // --- Soporte AirPlay iPhone & AirScreen ---
  function setAirPlayMetric(container, valueEl, detailEl, state, value, detail) {
    if (container) container.dataset.state = state;
    if (valueEl) valueEl.innerText = value;
    if (detailEl) detailEl.innerText = detail;
  }

  async function checkAirPlayStatus() {
    if (!state.connectedDevice) {
      if (el.airPlayStatusBadge) el.airPlayStatusBadge.innerText = 'Desconectado';
      return;
    }

    try {
      const res = await fetch('/api/device/airplay/status');
      const data = await res.json();

      if (!data.success) {
        if (el.airPlayStatusBadge) {
          el.airPlayStatusBadge.innerText = 'Sin datos';
          el.airPlayStatusBadge.className = 'badge badge-counter';
        }
        return;
      }

      const currentUser = data.currentUser;
      const userLabel = `Usuario ${currentUser}`;

      if (data.installedForUser) {
        setAirPlayMetric(el.metricAirPlayProfile, el.airPlayProfileValue, el.airPlayProfileDetail,
          'ok', 'Instalado', `${userLabel} · AirScreen ${data.version || ''}`.trim());
      } else if (data.installedAnywhere) {
        setAirPlayMetric(el.metricAirPlayProfile, el.airPlayProfileValue, el.airPlayProfileDetail,
          'warn', 'Otro perfil', `Solo existe en un perfil distinto de ${userLabel}`);
      } else {
        setAirPlayMetric(el.metricAirPlayProfile, el.airPlayProfileValue, el.airPlayProfileDetail,
          'off', 'No instalado', `${userLabel} · sin receptor AirPlay`);
      }

      if (data.musicPlaying) {
        setAirPlayMetric(el.metricAirPlayRunning, el.airPlayRunningValue, el.airPlayRunningDetail,
          'ok', 'Reproduciendo', `Audio activo · pid ${data.pid}`);
      } else if (data.running) {
        setAirPlayMetric(el.metricAirPlayRunning, el.airPlayRunningValue, el.airPlayRunningDetail,
          'ok', 'En ejecución', data.foreground ? `En pantalla · pid ${data.pid}` : `Segundo plano · pid ${data.pid}`);
      } else if (data.installedForUser) {
        setAirPlayMetric(el.metricAirPlayRunning, el.airPlayRunningValue, el.airPlayRunningDetail,
          'warn', 'Detenido', 'El receptor está instalado pero no corre');
      } else {
        setAirPlayMetric(el.metricAirPlayRunning, el.airPlayRunningValue, el.airPlayRunningDetail,
          'off', 'Apagado', 'Sin receptor que iniciar');
      }

      setAirPlayMetric(el.metricAirPlayIp, el.airPlayIpValue, el.airPlayIpDetail,
        data.tvIp ? 'ok' : 'warn',
        data.tvIp || 'Sin IP',
        data.tvIp ? 'Misma Wi-Fi que el iPhone' : 'No se pudo leer la red de la TV');

      if (data.ready) {
        if (el.airPlayStatusBadge) {
          el.airPlayStatusBadge.innerText = 'AirPlay listo';
          el.airPlayStatusBadge.className = 'badge badge-leaf';
        }
        if (el.airPlayStatusTitle) el.airPlayStatusTitle.innerText = 'AirPlay activo: tu iPhone ya puede enviar Apple Music';
        if (el.airPlayStatusDesc) el.airPlayStatusDesc.innerText = 'Abre Apple Music en el iPhone, toca el icono AirPlay y elige esta TV. El sonido sale por la TV.';
        if (el.textAirScreenAction) el.textAirScreenAction.innerText = 'Reabrir receptor en la TV';
        if (el.airPlayHint) el.airPlayHint.innerText = 'El receptor está escuchando. Si el iPhone no lo ve, pulsa «Comprobar red» para verificar que la TV se anuncia en tu Wi-Fi.';
      } else if (data.installedForUser) {
        if (el.airPlayStatusBadge) {
          el.airPlayStatusBadge.innerText = 'Receptor detenido';
          el.airPlayStatusBadge.className = 'badge badge-counter';
        }
        if (el.airPlayStatusTitle) el.airPlayStatusTitle.innerText = 'El receptor AirPlay está instalado pero apagado';
        if (el.airPlayStatusDesc) el.airPlayStatusDesc.innerText = 'Pulsa «Activar Modo Apple Music» para abrirlo y dejarlo escuchando en la TV.';
        if (el.textAirScreenAction) el.textAirScreenAction.innerText = 'Activar Modo Apple Music';
      } else {
        if (el.airPlayStatusBadge) {
          el.airPlayStatusBadge.innerText = 'No instalado';
          el.airPlayStatusBadge.className = 'badge badge-counter';
        }
        if (el.airPlayStatusTitle) el.airPlayStatusTitle.innerText = 'Receptor AirPlay no detectado';
        if (el.airPlayStatusDesc) el.airPlayStatusDesc.innerText = 'El botón abrirá la página oficial del receptor en Play Store, en la pantalla de la TV.';
        if (el.textAirScreenAction) el.textAirScreenAction.innerText = 'Instalar receptor desde Play Store';
      }
    } catch (e) {
      console.warn('Error al verificar estado de AirPlay:', e);
    }
  }

  async function scanAirPlayNetwork() {
    if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
    if (!el.btnScanAirPlayNetwork) return;

    el.btnScanAirPlayNetwork.disabled = true;
    if (el.airPlayScanNote) el.airPlayScanNote.innerText = 'Buscando receptores AirPlay en la red…';
    setAirPlayMetric(el.metricAirPlayNetwork, el.airPlayNetworkValue, el.airPlayNetworkDetail,
      'unknown', 'Buscando…', 'Consultando mDNS');

    try {
      const res = await fetch('/api/network/airplay/scan');
      const data = await res.json();

      if (!data.supported) {
        setAirPlayMetric(el.metricAirPlayNetwork, el.airPlayNetworkValue, el.airPlayNetworkDetail,
          'warn', 'No disponible', 'Este equipo no puede consultar mDNS');
        if (el.airPlayScanNote) el.airPlayScanNote.innerText = data.message || '';
        return;
      }

      if (data.tvVisible) {
        setAirPlayMetric(el.metricAirPlayNetwork, el.airPlayNetworkValue, el.airPlayNetworkDetail,
          'ok', 'Visible', `Anunciada como «${data.tvReceiver.name}»`);
        if (el.airPlayScanNote) {
          const extra = (data.receivers || []).length - 1;
          el.airPlayScanNote.innerText = extra > 0
            ? `Detectada en tu Wi-Fi. Además hay ${extra} receptor(es) más en la red.`
            : 'Detectada en tu Wi-Fi. El iPhone debería verla en AirPlay.';
        }
        showToast('La TV está anunciando AirPlay en tu red', 'success');
      } else {
        setAirPlayMetric(el.metricAirPlayNetwork, el.airPlayNetworkValue, el.airPlayNetworkDetail,
          'off', 'No visible', 'La TV no se anuncia por mDNS');
        if (el.airPlayScanNote) el.airPlayScanNote.innerText = 'El receptor no se anuncia: ábrelo en la TV o revisa que el router no aísle a los dispositivos.';
        showToast('La TV no se anuncia en la red. Abre el receptor en la TV.', 'error');
      }
    } catch (e) {
      if (el.airPlayScanNote) el.airPlayScanNote.innerText = 'No se pudo consultar la red';
      showToast('Error al comprobar la red AirPlay', 'error');
    } finally {
      el.btnScanAirPlayNetwork.disabled = false;
    }
  }

  if (el.btnScanAirPlayNetwork) {
    el.btnScanAirPlayNetwork.addEventListener('click', scanAirPlayNetwork);
  }

  if (el.btnLaunchAirScreen) {
    el.btnLaunchAirScreen.addEventListener('click', async () => {
      if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');

      el.btnLaunchAirScreen.disabled = true;
      showToast('Preparando el receptor AirPlay en tu TV...', 'info');
      try {
        const res = await fetch('/api/device/airplay/setup', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          await checkAirPlayStatus();
          setTimeout(scanAirPlayNetwork, 1200);
        } else {
          showToast(data.message || 'No se pudo activar AirPlay', 'error');
          await checkAirPlayStatus();
        }
      } catch (e) {
        showToast('Error de conexión con el servidor', 'error');
      } finally {
        el.btnLaunchAirScreen.disabled = false;
      }
    });
  }

  if (el.btnSendDirectUrl) {
    el.btnSendDirectUrl.addEventListener('click', async () => {
      if (!state.connectedDevice) return showToast('Conecta tu Android TV primero', 'error');
      const url = el.inputDirectUrl.value.trim();
      if (!url) return showToast('Ingresa o pega un enlace primero', 'error');

      try {
        const res = await fetch('/api/device/open-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          el.inputDirectUrl.value = '';
        } else {
          showToast(data.message || 'No se pudo abrir el enlace', 'error');
        }
      } catch (e) {
        showToast('Error de conexión', 'error');
      }
    });
  }

  // --- Modal de Guía ---
  el.btnOpenGuide.addEventListener('click', () => el.guideModal.classList.remove('hidden'));
  el.btnCloseGuide.addEventListener('click', () => el.guideModal.classList.add('hidden'));
  el.btnGuideGotIt.addEventListener('click', () => el.guideModal.classList.add('hidden'));

  // --- Inicialización ---
  initWebSocket();
  fetchStatus();
  loadDeviceHistory();
});
