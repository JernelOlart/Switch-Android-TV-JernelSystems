# NeoSwitch TV — Android TV Studio

Herramienta avanzada de auditoría, escaneo de red Wi-Fi, optimización y modificación de sistema para dispositivos **Android TV**, **Google TV**, **Chromecast con Google TV** y **Fire TV**.

---

## Colaboración & Créditos

**NeoSwitch TV** es un proyecto desarrollado por [**@JernelOlart**](https://github.com/JernelOlart) en colaboración estratégica entre:

- [**Jernel Systems**](https://www.jernelsystems.com)
- [**NeoTech Solutions**](https://neotechsolutions.mx/)
- Repositorio & GitHub: [https://github.com/JernelOlart](https://github.com/JernelOlart)

---

## Características Principales

1. **Radar y Escáner de Red Local**:
   - Detección automática de la subred Wi-Fi local (ej: `192.168.6.0/24`).
   - Sondeo de puertos clave: `5555` (ADB), `8008` / `8009` (Google Cast / Chromecast) y `6466` (Android TV Remote).
   - Identificación de fabricante por tabla ARP y dirección MAC (Sony, TCL, Google, Xiaomi, etc.).
   - Conexión directa en 1-clic con la TV detectada.
   - Soporte para **Emparejamiento Inalámbrico** (Pairing Code & Port para Android 11+).

2. **Bloqueador de Anuncios y Privacidad (A Nivel de Sistema)**:
   - **DNS Privado DoT**: Filtrado de publicidad, popups, banners y telemetría en **todas las apps y juegos** con 1-clic (AdGuard DNS, AdGuard Familiar, Mullvad AdBlock o DNS propio como NextDNS/Pi-hole).
   - **Bloqueo de Anuncios en Pantalla de Inicio**: Deshabilita trailers autoplay y filas de publicidad patrocinada en Android TV / Google TV Home (`com.google.android.tvrecommendations`).
   - **Instalador de YouTube Sin Anuncios**: Descarga e instalación asistida en 1-clic de **SmartTube** oficial (sin anuncios, con SponsorBlock y soporte 4K/60fps/HDR).
   - **Launcher Alternativo**: Instalador directo de **Projectivy Launcher** para una interfaz minimalista, veloz y sin publicidad.
   - **Límite de Procesos en Segundo Plano**: Optimización de memoria RAM para TVs de 1GB/2GB.

3. **Modificaciones de Sistema & Tweaks de Rendimiento**:
   - **Velocidad de Animaciones**: Aceleración de interfaz a `0.5x` o `0x` (instantáneo) para eliminar retrasos de menú.
   - **Densidad de Pantalla (DPI)**: Personalización o presets (`240`, `280`, `320`, `400` DPI).
   - **Resolución Forzada (wm size)**: Modificación forzada a 1080p, 4K UHD o 720p.
   - **Pantalla Siempre Activa (Stay Awake)**: Evita screensavers o reposo forzado en modo kiosko / multimedia.
   - **Limpieza Masiva de Caché**: Ejecución de `pm trim-caches 4096M` para recuperar espacio y fluidez.
   - **Reinicio Remoto**: Reinicio normal o arranque en modo Recovery.

4. **Debloater Inteligente y Gestor de Apps**:
   - Lista todas las aplicaciones (Sistema, Usuario, Deshabilitadas).
   - Clasificación automática de bloatware común (telemetría de Google, apps de streaming promocionales, apps OEM).
   - Congelar / Deshabilitar paquetes (`pm disable-user --user 0`) de forma segura y reversible.
   - Reinstalar o reactivar paquetes en cualquier momento.
   - Forzar detención (`am force-stop`) y limpiar datos (`pm clear`).
   - **Instalador de APKs**: Drag & Drop directo en el navegador web hacia la TV.

5. **Control Remoto Digital y Captura de Pantalla en Directo**:
   - Mando digital interactivo con diseño ergonómico y minimalista.
   - D-Pad (Arriba, Abajo, Izquierda, Derecha, OK).
   - Teclas de navegación: Atrás, Inicio, Menú, Volumen +, Volumen -, Silencio, Power.
   - Teclado virtual directo para escribir texto largo en la TV (búsquedas, contraseñas, URLs).
   - Captura de pantalla de la TV en tiempo real con refresco automático opcional.

6. **Terminal Shell ADB Integrada**:
   - Consola web interactiva con comandos directos (`getprop`, `df -h`, `top`, `uptime`, etc.) e historial con teclas flecha.

---

## Inicio Rápido

### Requisitos
- Node.js v18+ instalado.
- Dispositivo Android TV conectado a la **misma red Wi-Fi** que este equipo.

### Pasos para iniciar

1. **Lanzar la herramienta**:
   ```bash
   ./start.sh
   ```
   *El navegador se abrirá automáticamente en `http://localhost:4200`*.

2. Alternativamente, por comandos `npm`:
   ```bash
   npm start
   ```

3. O vía CLI de consola:
   ```bash
   node cli.js scan                 # Escanear red Wi-Fi
   node cli.js connect <IP>         # Conectar con la TV
   node cli.js adblock on adguard   # Activar bloqueo de anuncios
   node cli.js smarttube            # Instalar YouTube Sin Anuncios
   node cli.js tweaks               # Aplicar optimizaciones
   ```

---

## Cómo Activar la Depuración en tu Android TV

1. **Habilitar Opciones de Desarrollador**:
   - En tu Android TV, ve a `Ajustes > Preferencias del dispositivo > Información` (o `Sistema > Acerca de` en Google TV).
   - Baja hasta **"Número de compilación"** y presiona el botón central del mando **7 veces seguidas** hasta que aparezca el aviso *"¡Ya eres un desarrollador!"*.

2. **Activar Depuración USB / Red**:
   - Entra en el menú nuevo de **"Opciones para desarrolladores"**.
   - Activa **"Depuración USB"** (y si existe, *"Depuración de red"* o *"Depuración inalámbrica"*).

3. **Autorizar el equipo**:
   - Al conectar por primera vez desde esta herramienta, tu TV mostrará un diálogo:
     > *"¿Permitir depuración USB?"*
   - Marca la casilla **"Permitir siempre desde este equipo"** y pulsa **Aceptar** con tu mando.

---

## Tecnologías y Diseño

- **Arquitectura**: Node.js, Express, WebSocket (`ws`), Multer, ADB Bridge.
- **Frontend**: Sistema de diseño basado en `DESIGN.md` (*Acctual — Paper invoice on frosted glass*), Vanilla CSS con tokens de alta gama, tipografía Outfit e Inter, componentes pill-shaped y micro-interacciones fluidas.
- **Compatibilidad**: macOS, Linux y Windows con Node.js y ADB.
