# La capa pro: videos que se ven de referente

Salió de rehacer el video 3 de JuditoADS (28 de octubre de 2026). Junior vio
la primera versión y dijo: "está idéntico al anterior y tiene los mismos
sonidos… los ejemplos son repetitivos… se ve sloppy. Cambia los fondos de
escena en escena y aprende de los mejores". La segunda versión se hizo con
lo que hacen Apple, Stripe y Linear en sus videos explicativos, y es esta
capa.

**Úsala por defecto** para explicar un producto o un servicio, presentar una
marca o cualquier video que tenga que dar confianza. La biblioteca enérgica
(`escenas.md`: teléfono, sellos, pilas, globos) sirve para anuncios con
pantallas reales y fotos del negocio. Se pueden mezclar en un video, pero
cada escena va en un solo estilo.

Contenido:
1. Las reglas
2. Cómo se escribe una escena
3. Fondos y transiciones
4. Letra
5. Las piezas
6. Ritmo, música y sonido
7. Antes de entregar

---

## 1. Las reglas

1. **Un fondo distinto en cada escena.** Nunca dos seguidas con el mismo:
   negro, claro, el color de la marca, el acento, el tercero, la mezcla.
   Alternar oscuro y claro hace que cada corte se sienta.
2. **Una idea y un objeto por plano**, con aire alrededor. Si una escena
   necesita dos cosas, son dos escenas.
3. **Cada escena con su composición.** El primer video 3 repetía el mismo
   mapa en casi todas: eso es lo que se lee como plantilla. Aquí cada idea
   tiene su forma:
   - tarjetas unidas por un hilo para un proceso;
   - un círculo que se traga lo que entra para "le dice a Meta qué hacer";
   - un número que cuenta para un precio;
   - un deslizador para "lo eliges tú";
   - avisos que llegan para "te avisa".
4. **Ejemplos distintos y creíbles.** Un negocio de ejemplo con nombre
   ("Café Luna · Miami"), marcado "Ejemplo"; cada aviso o ficha dice algo
   diferente. Nunca tres veces la misma frase con otro icono.
5. **El texto entra por máscara** (sube desde abajo de su línea) y se queda
   quieto. Nada de rebotes ni de palabras que saltan: las curvas son `--sale`
   (rápida y suave al final) y `--entra-sale`.
6. **Una sola familia de iconos por video.** Los Phosphor duotono de
   `vectores/` (licencia MIT) se ven de producto serio; los emojis 3D se ven
   de anuncio. No van juntos en una escena.
7. **Sombras suaves y largas, grano y una luz que respira** en el fondo. Ya
   vienen en la capa: no agregues brillos ni contornos de neón.
8. **Sonido escaso y suave**, con música propia (sección 6). El primer video
   3 tenía los mismos pops del anterior.

## 2. Cómo se escribe una escena

Cada escena de la capa pro tiene tres partes: el fondo, el contenido y el
panel del color de la escena que sigue.

```html
<template id="conexion" data-sfx="cristal@1.2:1 clic-suave@1.95 barrido-suave@3.65" data-entrada="corte" data-swish="no">
  <div class="fondo claro">
    <div class="contenido sal-abajo" style="--sal:3.7s">
      <div class="rotulo-mono">Cómo se conecta</div>
      <div class="pro-cap arriba t-m">
        <span class="m"><span style="--d:.05s">JuditoADS maneja</span></span>
        <span class="m"><span style="--d:.14s">tus anuncios,</span></span>
        <span class="m"><span style="--d:.23s"><span class="color-marca">con tu permiso.</span></span></span>
      </div>
      …las piezas…
    </div>
  </div>
  <div class="panel abajo tercero" style="--sal:3.7s"></div>
</template>
```

- **`data-entrada="corte"` y `data-swish="no"` siempre:** la transición la
  hace el panel, no ffmpeg.
- **`--sal` = duración − 0,5** (− 0,55 con el círculo). El panel termina de
  cubrir justo en el corte y la escena que sigue empieza con ese fondo, así
  que el empalme no se ve.
- **El sonido del panel** va en `--sal`: `barrido-suave@<sal>` (o
  `barrido-grave` con el círculo).
- **Si un video tiene muchas escenas así, escríbelo con un script** que arme
  el storyboard (el video 3 lo hizo con `armar.py` en
  `scripts/video/juditoads-3/` del repo de Judo Marketing). Evita errores de
  copia y deja cambiar un color en un solo lugar.

## 3. Fondos y transiciones

| Fondo (`.fondo …`) | Letra | Para |
| --- | --- | --- |
| `negro` | blanca | Ganchos, bucles, lo serio ("no tocamos tu dinero") |
| `claro` | tinta | Procesos, cifras, tarjetas blancas encima |
| `marca` | blanca | Presentar el producto, listas |
| `acento` | la de `--acento-texto` | Un momento de energía (pagar, lograr) |
| `tercero` | blanca | Datos y tableros (en JuditoADS, el azul de Meta) |
| `mezcla` | blanca | El cierre |

Encima, si hace falta textura desde el primer cuadro: `<div
class="puntos-fondo"></div>` (una rejilla de puntos que deriva).

| Salida | Marcado | Cuándo |
| --- | --- | --- |
| Panel desde abajo | `contenido sal-abajo` + `panel abajo <color>` | La de siempre |
| Panel desde el lado | `sal-lado` + `panel lado <color>` | Cuando la idea sigue ("y además…") |
| Círculo | `sal-circulo` + `panel circulo <color>` con `--cx` y `--cy` (en %) | Entrar en algo: se abre desde el objeto de la escena |
| Corte seco | sin panel | Al cerrar un bucle, en el golpe de la música |

**Que no se repita la misma salida tres veces seguidas.** En el video 3:
abajo, lado, círculo, abajo, círculo, corte…

## 4. Letra

- **Titulares en la letra de la marca**, apretados (`--tracking-pro`,
  −0,035 em). Con una letra técnica y neutra (Inter Tight) se ve mejor;
  `marca.md` la tiene en las parejas.
- **Tamaños:** `t-xxl` (34 cqw, para un número solo), `t-xl` (14), `t-l`
  (11,2), `t-m` (8,4), `t-s` (5,4). Dos tamaños por escena como mucho.
- **Cada línea es un `<span class="m">`** y no se parte: si no cabe en el
  ancho, `revisar.mjs` avisa. Cambia la frase o baja el tamaño de ese
  titular (`style="font-size:10.4cqw"`).
- **El contraste de pesos dice la jerarquía:** la idea en 800 y el remate en
  `.ligera` (300). "Soluciones complejas" en negrita, "para problemas
  complejos." en ligera.
- **El rótulo mono** (`.rotulo-mono`) es un capítulo: "Cómo se conecta",
  "Lo que pagas", "Lo que ves", "Para empezar". Uno cada tres o cuatro
  escenas, no en todas.
- **Para resaltar:** un color (`.color-marca`, `.color-verde`) o un
  subrayado que se dibuja (`<span class="raya" style="--dr:.9s">`). No el
  recuadro amarillo de la biblioteca enérgica.

## 5. Las piezas

Los iconos van con máscara, en el color del texto:
`<i class="ico" style="--ico:url(vectores/key.svg)"></i>`. La lista está en
`assets/proyecto/vectores/`.

Las piezas dibujadas (moneda, tarjeta de crédito, gráfica, capas
isométricas) las imprime `python3 piezas.py …` para pegarlas en la
plantilla.

`catalogo-escenas.html` trae cada una funcionando (escenas c08 a c16):
`python3 build.py --catalogo && node render.mjs c08 c09 … --muestra`.

| Pieza | Marcado | Lo que hace |
| --- | --- | --- |
| Tarjeta de interfaz | `.tarjeta-ui` con `.icono`, `<b>`, `<small>`; `.borde` (`--dac`) y `.marca-ok` (`--dok`) | Aparece; se enciende y se marca cuando le toca |
| Hilo entre tarjetas | `.hilo-v` (`top`, `height`, `--d`), `.en-hilo` con una `.pastilla`, `.viajero` (`--y0`, `--y1`) | La línea crece, la etiqueta se posa y un punto viaja |
| Círculo que recibe | `.circulo-blanco` (`left`, `top`, `--ancho`) + `.anillo` + `.absorbe` (`--y0`, `--y1`) | Lo que entra cae dentro y abre un anillo |
| Tarjeta que vuela | `.vuela-dentro` (`--dx`, `--dy`) con `piezas.py tarjeta` | Entra girando, se detiene y se mete detrás del círculo |
| Número que cuenta | `<span class="cuenta" style="--desde:0;--hasta:20;--d:.25s;--dc:1.1s">` | Cuenta de un número a otro |
| Deslizador | `.ui-tarjeta` con `.monto`, `.riel` (`--desde-p`, `--hasta-p`), `.perilla` | El cursor arrastra y el monto sube |
| Recibo | `.recibo` | El cobro en una línea |
| Tablero | `.tablero` con `.cifras`, `piezas.py grafica`, `.pie-tab` | La gráfica se dibuja y se enciende el punto en vivo |
| Avisos | `.aviso` dentro de `.baja` (`--db`) | Cada aviso nuevo llega arriba y empuja a los anteriores |
| Lo que necesitas | `.rejilla` de `.hueco` (con `--fuera` cuando llega su ficha) y otra de `.casilla` | Los huecos punteados se llenan uno por uno |
| Capas isométricas | `.iso.cae` con `piezas.py capa …` + `.sombra-piso` | Caen y se apilan |
| Objeto con luz | `.luz-cenital` + `.objeto-pro.flota-pro` + `.gira-lento` | Para los bucles: flota bajo una luz |
| Escudo, lupa, icono grande | `.icono-pro` (`--ancho`, `height`, `--c`) + `.halo` + `.circulo-traza` | Un icono grande con su halo y un anillo que se dibuja |
| Los tres en fila | `.fila-nodos` con `.nodo-f` y `.disco`, `.viajero-h` | El resumen: quién, qué y con quién |
| Máquina que se rompe y se arregla | `.engrane` con `.gira` (`--a0`, `--a1`, `--a2`, `--d2`), `.se-rompe`, `.esquirla` y `.astilla`, `.cinta` con `.tira-paquetes` y `.paquete-c`, `.arbitro` (`piezas.py arbitro`), `.carta-regla` (`--dx`, `--dy`) | Gira, se traba a los 0,9 s, el del medio se parte, la cinta se pone roja; el árbitro levanta la tarjeta, la tarjeta vuela al hueco, entra un engrane nuevo y todo vuelve a correr en verde. Engranes: `piezas.py engrane COLOR`; el de al lado va 15° girado y a 0,88 veces su ancho. Ejemplo armado: escena 2 del video 3 (`scripts/video/juditoads-3/armar.py`, `maquina()`) |
| Cierre en dos tiempos | `.fase.sale-antes` (`--fuera`) y otra `.fase` | La oferta y después el contacto |
| Contacto | `.contacto-pro` con `<span>` + `.ico` | WhatsApp, @ y dirección, uno por uno |

**Dos animaciones no van en el mismo elemento** (una pisa a la otra): si algo
entra y además flota, la entrada va en una caja y la flotación en otra
adentro.

## 6. Ritmo, música y sonido

- **Las escenas duran múltiplos de 0,6 s** (un golpe a 100 por minuto): 1,8
  · 2,4 · 3,0 · 3,6 · 4,2… Así cada corte cae en el golpe de la música.
- **`python3 musica.py`** (después de `build.py`) sintetiza la música en
  `salida/musica.wav`:
  - cuatro acordes, un colchón suave, un arpegio con eco, bombo y platillo
    bajitos;
  - en las escenas de bucle (las que dicen "Bucle" en su pieza) se va la
    batería y el colchón se oscurece;
  - vuelve de golpe en la escena que cierra el bucle (con corte seco).
- **`sfx.py` la mezcla debajo de los efectos** si existe (`MUSICA_DB`), y
  `voz.py` la baja sola cuando entra la voz.
- **Sonidos de la capa pro** (`sonido.md`, "Suaves"): `cristal` para los
  vistos y lo que aparece, `clic-suave`, `tecla` para lo que cuenta,
  `golpe-suave` para lo que cae, `aviso` para notificaciones, `datos`,
  `barrido-suave` en los paneles, `subida-suave` en los bucles,
  `acorde-suave` en el cierre y `sub` para el primer cuadro.
- **Uno o dos sonidos por escena**, más el del panel. Los vistos en serie
  suben de nota (`cristal@1.9:1`, `cristal@3.5:2`, `cristal@5.1:3`).

## 7. Antes de entregar

- `node revisar.mjs` sin avisos. En la capa pro también mide que cada línea
  quepa en su titular, y no revisa el último medio segundo (ahí entra el
  panel y todo se va a propósito).
- `node render.mjs --muestra` y mira **cada** escena. Busca:
  - una composición chica en medio de mucho vacío (agranda el objeto);
  - algo que se ve corrido a un lado (los logos con el dibujo cargado a un
    lado se corren con `left`);
  - dos escenas seguidas que se parecen.
- **Un minuto de video tarda unos 15 minutos en renderizar** con 4 hilos. Haz
  primero la muestra y renderiza todo cuando la muestra esté bien.
