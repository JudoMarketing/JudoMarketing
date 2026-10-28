# Videos explicativos verticales

El primero se hizo para JuditoADS el 22 de octubre de 2026 y Junior lo aprobó
("excelente video"). Dura 60 segundos, en vertical 1080×1920 a 60 cuadros por
segundo. No lleva voz: el guion va en subtítulos grandes y suenan efectos en
cada golpe y transición. Muestra pantallas reales de la app en un teléfono y
tiene un vuelo desde el espacio hasta nuestra oficina en Miami.

Todo lo que hace falta para rehacerlo, cambiarlo o sacar el siguiente vive en
`scripts/video/juditoads-1/`. Las reglas de estilo que salieron de las
correcciones de Junior están en `CEREBRO.md`, sección 8. Este archivo es el
cómo.

## Qué hay en la carpeta

| Archivo | Qué es |
| --- | --- |
| `JuditoADS-video1-es.mp4` | El video aprobado, tal como se entregó el 22 de octubre de 2026 (escena 1 todavía sin la cara de Junior). |
| `storyboard.html` | **La fuente de todo.** Guion, escenas (`ESCENAS`, con su tiempo), plantillas `<template id="fNN">` y todo el CSS de las animaciones. Es el mismo HTML que Junior revisó como artifact (v5), con comentarios por escena. |
| `img/` | Imágenes que usan las escenas: capturas de la app, emojis 3D, lámpara, logos. |
| `vuelo-hd.mp4` | El vuelo de la escena 4, limpio, sin textos (270 cuadros a 1080×1920). La etiqueta y el titular se ponen encima en el render. |
| `build.py` | Saca de `storyboard.html` la página de producción (`salida/video.html`) y la lista de escenas con su duración (`salida/escenas.json`). |
| `render-escenas.mjs` | Fotografía cada escena cuadro por cuadro en Chromium, con el tiempo de cada animación puesto a mano, y la codifica en `salida/clips/eNN.mp4`. |
| `sfx.py` | Sintetiza los 76 efectos (pops, toques, whooshes, campanas, sello, caja registradora, moneda, viento del vuelo) y los coloca en su tiempo exacto: `salida/sonido.wav`. No hay sonidos de terceros. |
| `montar.py` | Une las escenas con transiciones (xfade de 0.25 s, distinta según la escena) y el sonido en `salida/JuditoADS-video1-es.mp4`. |
| `capturas/` | `capturar.mjs` fotografía JuditoADS en modo demo como un iPhone (390×844 a 2x). `cafe-luna.jpg` es la foto del anuncio de ejemplo. |
| `preparar-img.py` | Pasa las capturas a `img/`, baja los emojis 3D de Microsoft Fluent (licencia MIT), le pone los lentes al genio y prepara los logos. |
| `vuelo/` | El vuelo en CesiumJS: `index.html` (cámara, capas, mezcla por altura), `render.mjs` (graba los cuadros), `prefetch.py` y `naip.py` (bajan las imágenes satelitales a `vuelo/tiles/`). |
| `lampara/` | La lámpara del genio modelada en three.js; `render.mjs` la saca a PNG transparente. |

Lo generado (`salida/`, `fuentes/`, `capturas/salida/`, las imágenes satelitales y
Cesium) no se sube al repo; se rehace con los scripts.

## Requisitos

- Node con `playwright-core` (ya está en el repo) y un Chromium. Por defecto usa
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; en otra máquina,
  `CHROME=/ruta/al/chrome`.
- Python 3 con `pip install imageio-ffmpeg numpy scipy pillow`. El ffmpeg sale de
  `imageio-ffmpeg`, no hace falta instalarlo aparte.
- Conexión para Google Fonts (las letras de las escenas) y, solo si se rehace la
  lámpara, para three.js del CDN.

## Producir el video

```bash
cd scripts/video/juditoads-1
python3 build.py                 # storyboard → salida/video.html + escenas.json
node render-escenas.mjs          # las 16 escenas (unos 10 minutos)
python3 sfx.py                   # sonido
python3 montar.py                # salida/JuditoADS-video1-es.mp4
```

Para cambiar una escena se edita `storyboard.html` y se vuelve a renderizar
solo esa: `python3 build.py && node render-escenas.mjs e03 && python3 montar.py`.
Con `--muestra` saca cinco cuadros sueltos de la escena en `salida/escenas/eNN`,
sin codificar: sirve para revisar antes del render completo.

Si cambia la duración de una escena hay que correr `sfx.py` otra vez, porque
cada efecto se coloca contra el inicio de su escena.

**Antes de entregar:**

1. Sacar una hoja con un cuadro cada 2 segundos.
2. Revisar de cerca los momentos con texto encima del teléfono, las salidas
   de las escenas y el cierre.

Así salieron los dos últimos arreglos de esta versión: el titular de la
página cortado por la barra de estado y el sello rojo que se iba antes que
los cursos.

## Volver a tomar las pantallas de la app

Las capturas son de JuditoADS de verdad, corriendo en local en modo demo, con
una base SQLite vacía y las cuentas de Meta de demostración que trae la app.
En el repo `judito-ads`:

```bash
sed 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma > prisma/rig-sqlite.prisma
DATABASE_URL=file:../pruebas/tmp/video.db npx prisma db push --schema prisma/rig-sqlite.prisma --skip-generate --accept-data-loss
npx prisma generate --schema prisma/rig-sqlite.prisma
DATABASE_URL=file:$PWD/pruebas/tmp/video.db AUTH_SECRET=$(openssl rand -hex 32) \
  NEXT_PUBLIC_APP_URL=http://localhost:3020 NEXT_PUBLIC_BASE_PATH= npx next dev -p 3020
```

Y desde esta carpeta: `node capturas/capturar.mjs && python3 preparar-img.py`.
El script crea la cuenta de Café Luna Miami y, en orden, fotografía:

- la página de inicio y la entrada;
- el panel vacío y las cuentas conectadas;
- los pasos 3 y 4 del asistente (presupuesto por día y por campaña);
- la campaña activada.

Al terminar, el `prisma generate` de Postgres deja la app como estaba.

## El vuelo de la escena 4

- Las imágenes son públicas y se pueden usar en anuncios. En pantalla llevan
  su crédito:
  - NASA GIBS (Blue Marble) para la Tierra;
  - EOX Sentinel-2 cloudless (CC BY 4.0) para Florida;
  - USGS para la ciudad;
  - NAIP para el edificio.
- **Google Earth no se puede usar en un anuncio:** sus reglas lo prohíben.
- Rehacerlo (otra dirección, otro largo):
  1. Cambiar las coordenadas en `vuelo/index.html`, `prefetch.py` y `naip.py`.
  2. Correr:

     ```bash
     cd vuelo && npm install && cd ..
     python3 vuelo/prefetch.py && python3 vuelo/naip.py
     node vuelo/render.mjs 1080 1920 60 4.5
     ```

  3. Codificar `vuelo/cuadros/` como `vuelo-hd.mp4` (x264, crf 16).
- Cada cuadro espera a que Cesium termine de cargar sus mosaicos. Así no
  aparecen parches borrosos, aunque en HD tarde unos 40 minutos.

## Lo que falta de este video

- **La cara de Junior en la escena 1.** Hoy es un fondo de relleno. Cuando
  llegue el clip (2 a 3 s, vertical, cámara frontal):
  1. Se abre en cuadros como el vuelo.
  2. Se pone en la escena con un `<img>` que el render cambia cuadro a cuadro.
     Un `<video>` no se puede sincronizar cuadro a cuadro.
  3. Se renderiza `e01` y se monta otra vez.
- **Versión en inglés.** Requiere:
  - copiar los textos de `storyboard.html` y traducirlos;
  - volver a tomar las capturas con la app en inglés. En `capturar.mjs`,
    los nombres de los botones están en español; hay que pasarlos a los de
    la app en inglés.

## Video 2 de JuditoADS: el mismo material en 8 piezas

El 28 de octubre de 2026 Junior mandó la estructura que hace que un video se
vea hasta el final (CEREBRO, sección 8) y el video se rearmó con ella en
`scripts/video/juditoads-2/`. El video 1 queda intacto en su carpeta.

| Pieza | Escenas | Segundos |
| --- | --- | --- |
| 1 · Gancho | La moneda de 5¢, enorme desde el primer cuadro | 0 – 2.6 |
| 2 · Introducción | "Quédate: te enseño a lanzar el tuyo sin gurú", con el genio | 2.6 – 5.8 |
| 3 · Cuerpo 1 | Los 10 cursos, el vuelo a Miami, JuditoADS y el público ideal | 5.8 – 18.5 |
| 4 · Bucle abierto | "Pero eso no es lo más loco…" | 18.5 – 20.1 |
| 5 · Cuerpo 2 | "Lo lanzas tú solo. En 4 pasos", los cuatro pasos y el listo | 20.1 – 36.3 |
| 6 · Bucle abierto | "Y lo que sigue, casi nadie te lo dice…" | 36.3 – 38.1 |
| 7 · Cuerpo 3 | "Judito sí te lo dice": los tres consejos | 38.1 – 44.1 |
| 8 · Llamado | El precio, "Si llegaste hasta aquí, pruébalo gratis" y el contacto | 44.1 – 56.1 |

Qué cambia respecto de la carpeta del video 1:

- Los efectos de `sfx.py` y las transiciones de `montar.py` van por
  plantilla (`fNN`), no por número de escena. Así el orden se puede cambiar
  sin tocarlos.
- Los bucles abiertos son las plantillas `f17` y `f18`, con los emojis 3D
  `cabeza.webp` y `secreto.webp` (Fluent, MIT).
- `render-escenas.mjs` espera dos cuadros del navegador antes de cada foto.
  Sin eso, una animación que ya había corrido al cargar salía con su valor
  viejo.

Se produce igual que el 1, desde su carpeta; sale
`salida/JuditoADS-video2-es.mp4`. La copia entregada a Junior el 28 de octubre
de 2026 está en la carpeta: `JuditoADS-video2-es.mp4` (56 s). Las capturas de la app, el vuelo y la
lámpara se rehacen desde `juditoads-1/` y se copian a `img/` y
`vuelo-hd.mp4`.

## Video 3 de JuditoADS: cómo funciona por dentro

Es para la gente que ya preguntó y quiere entender cómo funciona JuditoADS
(28 de octubre de 2026). Va en su segunda versión: 60 segundos, 16 escenas.

La primera (un mapa conceptual en casi todas las escenas) la rechazó Junior:
"idéntico al anterior, los mismos sonidos, ejemplos repetitivos". La segunda
se hizo con la capa pro, la que ahora trae la skill
(`.claude/skills/judo-video-vertical/references/estilo-pro.md`):

- un fondo distinto en cada escena (negro, claro, violeta, azul de Meta,
  oro, mezcla);
- una idea y un objeto por plano;
- texto en Inter Tight que sube por máscara;
- iconos Phosphor duotono (`vectores/`, licencia MIT);
- transiciones con un panel del color que sigue (desde abajo, desde el lado,
  en círculo) o un corte seco en el golpe;
- música propia (`musica.py`, 100 BPM) que se abre en los dos bucles, y
  efectos suaves nuevos.

- **Carpeta:** `scripts/video/juditoads-3/`.
- **Cómo se arma:** el storyboard lo genera `armar.py` desde `base.html` (la
  plantilla de la skill) y `pro.css` (el sistema visual de este video).
- **Para cambiarlo:**

  ```bash
  python3 armar.py && python3 build.py && node revisar.mjs && node render.mjs --hilos 4 && python3 musica.py && python3 sfx.py && python3 montar.py JuditoADS-video3-como-funciona-es && python3 qa.py salida/JuditoADS-video3-como-funciona-es.mp4 --portada 2.8
  ```

  El render completo tarda unos 15 minutos.
- **Entregado:** `JuditoADS-video3-como-funciona-es.mp4` y
  `JuditoADS-video3-portada.jpg`, en la carpeta.
- **Guion de voz:** `guion-voz.md`. Lleva los tiempos nuevos, el tono y lo
  que se corrigió del texto de Junior: página de Facebook obligatoria,
  tarjeta en la cuenta de anuncios y nada de "tiempo real".

## El siguiente video

Se hace con la skill `judo-video-vertical` (`.claude/skills/`). Trae la
plantilla de este proyecto en genérico, para cualquier marca, la capa pro
del video 3, la música, la revisión automática de textos y la mezcla de voz. Lo de abajo sigue valiendo para
entender cómo se hizo el primero.

Copiar la carpeta `juditoads-2/` a `scripts/video/<nombre>/` y empezar por el
storyboard:

1. Escribir el guion por escenas, repartido en las 8 piezas.
2. Publicarlo como artifact con comentarios por escena para que Junior lo
   revise. Este tomó cinco vueltas.
3. Producir solo cuando lo apruebe.

`build.py`, `render-escenas.mjs` y `montar.py` no dependen del contenido.
`sfx.py` (los tiempos de cada efecto) y las transiciones de `montar.py` sí
son de este video y se ajustan para el nuevo.
