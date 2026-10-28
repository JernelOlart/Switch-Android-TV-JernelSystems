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
   - **Persistencia tras Reinicios**: Con root + Magisk instala un script de arranque en la TV; sin root, el servidor vigila el equipo y reaplica el DNS al reconectar. El bloqueo deja de perderse al reiniciar la Android TV.
   - **Bloqueo de Anuncios en Pantalla de Inicio**: Deshabilita el canal de recomendaciones en Android TV (`com.google.android.tvrecommendations`). En Google TV ese paquete es un *stub* deshabilitado por el sistema: la app detecta la limitación, la explica en el panel y ofrece abrir los Ajustes de la TV (Modo solo apps) o instalar Projectivy Launcher.
   - **Instalador de YouTube Sin Anuncios**: Descarga e instalación asistida en 1-clic de **SmartTube** oficial (sin anuncios, con SponsorBlock y soporte 4K/60fps/HDR).
   - **AdGuard para Android TV**: Instalación en 1-clic del APK oficial (VPN local, filtrado DNS + HTTPS, firewall por app y arranque automático). Es la opción más agresiva sin root; incluye 14 días de prueba y luego requiere licencia.
   - **Preset NextDNS agresivo**: Con tu ID de NextDNS, NeoSwitch configura el DoT y te guía para activar las listas HaGeZi Multi Pro++ y OISD Full, más estrictas que el DNS de Mullvad.
   - **Guía de bloqueo a nivel de red**: Instrucciones integradas para TP-Link (firmware original y OpenWrt), AdGuard Home y Pi-hole, incluyendo redirección de DNS y bloqueo de DoT.
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

6. **Receptor AirPlay para iPhone, iPad & Mac**:
   - Soporte nativo para duplicar pantalla (Screen Mirroring) desde el Centro de Control de iOS a 60 fps.
   - Envío de video a pantalla completa desde Safari o navegador web.
   - Transmisión de música de alta fidelidad desde Apple Music, Spotify o YouTube Music hacia los altavoces de la TV.
   - Lanzador directo de enlaces web y videos a la TV mediante Deep Linking.
   - **Modo Apple Music en 1-clic**: comprueba el perfil activo de la TV, habilita el receptor si solo estaba instalado en otro perfil, lo abre y verifica con `pidof` que realmente quedó escuchando.
   - **Diagnóstico honesto**: muestra si el receptor está instalado en el perfil activo, si corre, la IP de la TV y —mediante mDNS (`dns-sd`/`avahi-browse`)— si la TV se está anunciando de verdad en tu Wi-Fi como `_airplay._tcp` / `_raop._tcp`.
   - Nota: Apple no publica Apple Music para Android TV/Google TV (Play Store la marca como no compatible). La vía oficial para escucharla en la TV es AirPlay desde el iPhone; el APK de móvil existe pero no está adaptado al mando.

7. **Terminal Shell ADB Integrada**:
   - Consola web interactiva con comandos directos (`getprop`, `df -h`, `top`, `uptime`, etc.) e historial con teclas flecha.

8. **Panel de Control del Servidor e Historial de Dispositivos**:
   - **Reinicio del Servidor en 1-clic**: El botón `Reiniciar Servidor` de la cabecera reinicia el backend sin salir del navegador; el panel detecta la reconexión y se recarga solo. La salida del nuevo proceso se guarda en `data/server.log`.
   - **Historial de Dispositivos**: Cada conexión exitosa se guarda automáticamente (máximo 20 equipos, ordenados por la más reciente) en `data/device-history.json`. Desde el panel puedes reconectar a una TV anterior con un clic o quitar entradas del historial.
   - Tras un reinicio del servidor la sesión ADB queda en memoria limpia: usa el historial para reconectar a tu TV en un clic.

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
   node cli.js adblock on custom abc123.dns.nextdns.io  # NextDNS agresivo
   node cli.js adblock persist      # Instalar script de arranque (root + Magisk)
   node cli.js airplay              # Iniciar o instalar receptor AirPlay para iPhone
   node cli.js smarttube            # Instalar YouTube Sin Anuncios
   node cli.js tweaks               # Aplicar optimizaciones
   node cli.js launcher-ads off     # Desactivar/Reactivar recomendaciones de anuncios del Home
   node cli.js reboot recovery      # Reiniciar TV en modo Recovery
   ```

---

## Bloqueo Permanente y Alcance Real

### Que el DNS no se desactive al reiniciar

NeoSwitch aplica el DNS privado con `settings put global private_dns_mode hostname`. Android lo guarda, pero algunos fabricantes (sobre todo TVs y boxes OEM) lo revierten al arrancar o al cambiar de red. Para cubrir ambos casos:

- **Con root + Magisk (persistencia real en la TV)**: se instala `/data/adb/service.d/neoswitch-dns.sh`, que espera a que termine el arranque y reaplica el DNS. Funciona aunque NeoSwitch esté cerrado.
- **Sin root (vigilancia desde el servidor)**: NeoSwitch guarda el DNS elegido en `data/adblock-config.json` y cada 30 s comprueba el equipo; si la TV lo perdió, lo reaplica. Si la TV está desconectada, intenta reconectarse cada 2 min usando el historial de dispositivos. Requiere que NeoSwitch esté abierto.

En el panel: pestaña **Ad-Block → Bloqueo Permanente tras Reiniciar**. Desde la CLI:

```bash
node cli.js adblock persist adguard   # Aplica AdGuard e instala el script de arranque
node cli.js adblock persist           # Instala el script con el DNS que ya esté activo
node cli.js adblock persist off       # Elimina el script de arranque
```

### AdGuard TV y NextDNS desde el panel

- **AdGuard para Android TV**: en la pestaña **Ad-Block**, botón **Instalar AdGuard TV en 1-Clic**. Descarga el APK oficial (GitHub de AdGuard), lo instala por ADB y abre la app. En la TV concede el permiso de VPN y activa “Iniciar al arrancar”. Es la opción más agresiva sin root (VPN local + filtrado DNS/HTTPS + firewall). Incluye 14 días de prueba y luego requiere licencia.
- **NextDNS agresivo**: en la tarjeta **NextDNS**, pega tu ID (`abc123`) y pulsa **Activar NextDNS**. NeoSwitch configura `abc123.dns.nextdns.io` por DoT. Después entra en [nextdns.io](https://nextdns.io) y activa las listas **HaGeZi Multi Pro++** y **OISD Full**.
- Recuerda: AdGuard TV usa la única ranura de VPN de Android. Si lo activas, deja el DNS privado en **Automático** para no duplicar filtros.

### ¿Se pueden quitar los anuncios de YouTube y de todas las plataformas?

El DNS solo bloquea publicidad servida desde dominios distintos al contenido. Por eso:

| Plataforma | ¿El DNS la bloquea? | Alternativa |
| --- | --- | --- |
| Apps y juegos con SDK de anuncios | Sí | DNS AdGuard / Mullvad |
| YouTube | No: el anuncio llega del mismo dominio del video | **SmartTube** (instalación en 1-clic) |
| Home de Google TV | Parcial | Projectivy Launcher o «Modo solo apps» |
| Netflix, Prime Video, Disney+, Spotify | No: el anuncio lo inserta el servidor de la cuenta | Plan sin anuncios del servicio |

La combinación recomendada es **DNS + SmartTube + Projectivy Launcher**: cubre publicidad del sistema, de las apps y de YouTube.

### Bloqueo para todos los dispositivos del hogar (opcional)

Si quieres que el filtrado cubra también móviles y otros equipos, configura en tu router los DNS de AdGuard: `94.140.14.14` y `94.140.15.15`. Así el bloqueo es independiente de la TV y sobrevive a cualquier reinicio.

- **TP-Link Archer / Deco con firmware original**: en `DHCP` (o `LAN → Servidor DHCP`) pon esos DNS como primario y secundario. El firmware original no permite redirigir el puerto 53 ni bloquear DoT/DoH, y HomeShield es control parental, no un ad-blocker real. Para listas propias, monta AdGuard Home o Pi-hole en una Raspberry Pi y usa su IP como DNS del DHCP.
- **TP-Link con OpenWrt u Omada**: además puedes redirigir el puerto 53 al AdGuard Home y bloquear la salida 853 (DoT) para que ninguna app evada el filtro.
- En la TV, deja el DNS privado en **Automático** cuando el router ya filtra.

La guía completa está integrada en el panel: **Bloqueador de Anuncios → Guía: bloquear anuncios en toda la casa**.

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
