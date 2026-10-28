# Producción del MP4

Contenido:
1. Lo que hace falta
2. Armar el proyecto
3. Comandos, en orden
4. Transiciones
5. Capturas de un producto y material del cliente
6. Trampas que ya nos costaron

---

## 1. Lo que hace falta

- **Node 18 o más nuevo con Playwright** (`playwright-core` o `playwright`)
  y un Chromium:
  - en Claude Code en la nube ya están;
  - en otra máquina: `npm i -g playwright-core` y `npx playwright install
    chromium`, o `CHROME=/ruta/al/chrome`.
- **Python 3** con `numpy`, `scipy`, `pillow` e `imageio-ffmpeg`:
  `pip install numpy scipy pillow imageio-ffmpeg`. El ffmpeg sale de
  `imageio-ffmpeg`, no hace falta instalarlo aparte; si no, usa el `ffmpeg`
  del sistema.
- **Conexión a internet** para Google Fonts (las letras).

Si no hay navegador (claude.ai sin Claude Code, por ejemplo):
1. Entrega el guion y el storyboard: `python3 incrustar.py storyboard.html
   salida/storyboard-unico.html` arma una sola página para enseñar como
   artifact.
2. Di que el MP4 se produce en Claude Code con esta misma skill.

## 2. Armar el proyecto

```bash
cp -r <carpeta de la skill>/assets/proyecto <destino>/<nombre-del-video>
cd <destino>/<nombre-del-video>
cp <carpeta de la skill>/scripts/navegador.mjs <carpeta de la skill>/scripts/revision-texto.js .   # si no están
```

- **Destino:**
  - en un repo de cliente: `contenido/videos/<nombre>/`;
  - en el de Judo Marketing: `scripts/video/<nombre>/`;
  - si no hay repo: la carpeta de trabajo.
- **Marca:** `marca.json` (ver `marca.md`) y `python3 aplicar-marca.py
  marca.json storyboard.html`. Las marcas de la casa están en
  `assets/marcas/`.
- **Imágenes:**
  - van en `img/`; los videos reales, en `clips/`;
  - **borra las del ejemplo que no uses**: no deben viajar al proyecto del
    cliente;
  - los emojis 3D de Fluent (256 px, licencia MIT) se bajan con
    `python3 emoji.py "light bulb" img/foco.webp`; los nombres comprobados
    están en `emojis.md`;
  - los iconos vectoriales de la capa pro ya están en `vectores/`.
- **Reemplaza TODO el ejemplo:** las plantillas, la lista de escenas y el
  `<title>`. Nada de JuditoADS se queda en el video de otro negocio.

## 3. Comandos, en orden

```bash
python3 build.py                  # storyboard → salida/video.html y escenas.json; avisa lo que no cuadra
node revisar.mjs                  # textos: líneas partidas, zonas, encimados, contraste, tiempo de lectura
node render.mjs --muestra         # cinco cuadros por escena en salida/escenas/<id>/: míralos
node render.mjs                   # todas las escenas a 60 cuadros (unos 15 minutos por minuto de video)
python3 musica.py                 # la música de fondo (salida/musica.wav); se puede saltar
python3 sfx.py                    # los efectos, con la música debajo si existe
python3 montar.py <nombre>        # salida/<nombre>.mp4
python3 qa.py salida/<nombre>.mp4 # hojas de revisión y portada.jpg
```

- **Para cambiar una sola escena:**
  `python3 build.py && node render.mjs e03 && python3 montar.py <nombre>`.
- **Si cambia la duración de una escena**, corre `musica.py` y `sfx.py` otra
  vez: cada sonido se cuenta desde el inicio de su escena y la música corta
  la batería en los bucles.
- **Esperar el render sin vigilarlo:** córrelo en segundo plano y espera al
  número de proceso (`while kill -0 <pid>; do sleep 15; done`), no a un
  `pgrep -f render.mjs`: ese se encuentra a sí mismo y no termina nunca.
- **`render.mjs --hilos 4`** usa más núcleos; por defecto son 3.
- **El render completo tarda:** córrelo en segundo plano y sigue con otra
  cosa (el pie de video, el guion de voz).
- **Antes de entregar,** abre `salida/qa-cada2s.jpg` y `salida/qa-cortes.jpg`
  y míralos de verdad.

## 4. Transiciones

`data-entrada` en cada plantilla, o `"entrada"` en la lista de escenas:

| Transición | Se ve como |
| --- | --- |
| `fade` | Fundido (por defecto) |
| `fadeblack` | Fundido pasando por negro |
| `zoomin` | La nueva escena sale del centro (bueno para entrar a un bucle) |
| `smoothleft`, `smoothright` | Barrido lateral suave (pasos que se siguen) |
| `smoothup`, `smoothdown` | Barrido vertical suave |
| `slideup`, `slideleft` | Empuja la escena anterior |
| `circleopen` | Se abre en círculo (para un vuelo o una revelación) |
| `wipeleft` | Cortina |
| `corte` | Corte seco: para dos escenas de un mismo mapa o de una misma pantalla, y en la capa pro siempre (la transición la hace el panel, `estilo-pro.md`) |

## 5. Capturas de un producto y material del cliente

- **Capturas:**
  - con Playwright, en un viewport de teléfono (390 × 844 a 2x), con el
    producto en modo demo;
  - se recortan a lo que se va a ver y se guardan en `img/` como `.webp`.
- **Fotos y videos del cliente:**
  - los originales, en la máxima calidad que haya;
  - el video entra como `img.secuencia` con `data-video` (`escenas.md`);
  - lo que sea de personas, con permiso.

## 6. Trampas que ya nos costaron

- **Fotos con el valor viejo de una animación.** `render.mjs` espera dos
  cuadros del navegador antes de cada foto. No le quites esa espera.
- **Dos animaciones en un mismo elemento.** Si un tipo de escena ya tiene su
  animación (`.logo-grande`, `.nodo`, `.sello`, `.tel`), ponerle `.funde` o
  `.entra` la pisa y no pasa nada. Esos tipos ya aceptan `--fuera`; usa eso.
  En la capa pro, la entrada va en una caja y el movimiento continuo en otra
  adentro.
- **Un texto con máscara que todavía no subió se contaba como visible** (el
  revisor no miraba el recorte del propio elemento) y salían avisos de textos
  encimados que no se veían. Ya está corregido en `revision-texto.js`.
- **Opacidad con un solo fotograma clave al 100%:** el cambio se reparte por
  toda la animación. El valor de partida va también en el fotograma donde
  empieza a cambiar.
- **Textos que parten mal la línea:** se miden antes, con `revisar.mjs`. Las
  palabras animadas (`.w`) parten distinto que el texto corrido.
- **ffmpeg** no está en el PATH de algunas máquinas: los scripts usan el de
  `imageio-ffmpeg`.
- **Playwright detrás de un proxy da ERR_CERT:** los scripts ya abren
  Chromium con `--ignore-certificate-errors`.
- **Matar procesos con `pkill -f "<patrón>"` puede matar la propia terminal**
  si el patrón aparece en el comando. Mata por el número de proceso.
- **Cesium desde un CDN no carga** (sus workers corren desde otro origen):
  se sirve local. La exportación de NAIP se corta en 4000 px: se pide por
  mosaicos.
