# Biblioteca de escenas

Todo lo de aquí ya tiene sus estilos en `assets/proyecto/storyboard.html`.
Esta es la biblioteca enérgica (anuncios con pantallas y fotos). La capa pro,
para explicar y dar confianza, está en `estilo-pro.md`; sus escenas de
ejemplo son las c08 a c16 del catálogo.
Para verlo funcionando:
- `storyboard.html` es el ejemplo, el video 2 de JuditoADS resumido;
- `catalogo-escenas.html` tiene los tipos que no salen en el ejemplo
  (`python3 build.py --catalogo && node render.mjs --muestra`).

Contenido:
1. Cómo se escribe una escena
2. Tiempos: --t, --d y --fuera
3. Texto
4. Eventos de uso general
5. Tipos de escena (gancho, globo y sello, pila, fichas, lista, teléfono,
   tarjetas, cifra, precio, logo, foto y video real, antes y después,
   público, bucle, mapa, cierre)
6. Variables de posición más usadas

---

## 1. Cómo se escribe una escena

Cada escena es una plantilla en `storyboard.html` más una entrada en la lista
de escenas (el JSON del final).

```html
<template id="bucle1" data-sfx="pop@0 pop@0.12 plop@0.75 subida@0:1.75" data-entrada="zoomin">
  …el marcado de la escena…
</template>
```

```json
{ "id": "e05", "plantilla": "bucle1", "dur": 1.6, "pieza": "4 · Bucle abierto",
  "texto": "Pero eso no es lo más loco…", "ve": "…", "voz": "…", "ojo": "…" }
```

| Campo | Para qué sirve |
| --- | --- |
| `data-sfx` | Los sonidos (`sonido.md`). |
| `data-entrada` | La transición con la que entra (`produccion.md`, «Transiciones»). Entre dos escenas de un mismo mapa se usa `corte`. |
| `dur` | Lo que dura, en segundos. |
| `pieza` | Cuál de las 8 piezas es. `build.py` avisa si falta alguna. |
| `texto` | Lo que se lee en pantalla. |
| `ve` | Lo que se ve. |
| `voz` | Lo que dice la voz, si va a tener. |
| `ojo` | Lo que falta confirmar. Sale en naranja en la mesa. |

## 2. Tiempos: --t, --d y --fuera

- **`--t`** es lo que dura la escena. Lo pone la página; no se escribe. Lo
  continuo usa `var(--t)`: el resplandor del bucle, la mira que recorre, la
  foto que se asienta.
- **`--d`** es el segundo en que algo empieza a entrar, contado desde el
  inicio de la escena (`style="--d:1.2s"`).
- **`--fuera`** es el segundo en que algo sale antes del corte. Si no se
  pone, se queda hasta el final y sale con la transición.

Un sonido que acompaña algo va en el mismo segundo que su `--d`.

## 3. Texto

```html
<div class="cap arriba" style="font-size:8.6cqw">Conectas tu cuenta de <span class="hl">Meta</span></div>
<div class="cap centro">Lo lanzas<br><span class="hl">tú solo</span>.</div>
<div class="cap abajo entra" style="--d:1.5s">Lo que cuesta una hamburguesa.</div>
```

- `.cap.arriba` empieza en 15 cqw; `.cap.centro` va centrada; `.cap.abajo`
  va en 116 cqw.
- `.hl` resalta en el color de acento. **Resalta una idea, no la frase
  entera.**
- `.sub` es una línea chica debajo, por ejemplo la dirección web.
- `.w` es una palabra que entra de golpe en su `--d`. Se usa en los bucles y
  en los ganchos de frase.
- `.texto-chico` es la letra pequeña. `.credito` es el crédito de imágenes o
  de marcas.

**Partir las líneas a mano** con `<br>`, pensando en dónde respira la frase.
Para que dos palabras no se separen (y no quede una sola al final), únelas con
`&nbsp;`.
El resaltado no se parte en dos líneas y ninguna palabra queda sola en la
última; `revisar.mjs` lo avisa. Cabe más o menos esto por línea:

| Tamaño | Letras por línea |
| --- | --- |
| 7 cqw | 16 |
| 8,4 cqw | 13 |
| 9,6 cqw | 12 |

Si la letra de la marca es condensada (Anton, Barlow Condensed), caben más y
`aplicar-marca.py` agranda los tamaños de las clases. Si escribes el tamaño en
la escena, escríbelo como `calc(8.4cqw * var(--escala-titulares))` para que
crezca igual.

## 4. Eventos de uso general

Se agregan como clase a cualquier cosa que no tenga animación propia:

| Clase | Qué hace |
| --- | --- |
| `.entra` | Sube y aparece con rebote en `--d`; sale en `--fuera`. |
| `.funde` | Aparece y desaparece sin moverse. |
| `.golpea` | Cae de golpe desde grande, girado `--giro`, y queda en `--giro-final`. |
| `.encima` | No es una animación: marca lo que va encima de otra cosa a propósito (un sello, un total) para que `revisar.mjs` no lo cuente como encimado. |

## 5. Tipos de escena

### Gancho con un objeto
```html
<div class="objeto girando moneda" style="--ancho:38cqw">5¢</div>
<img class="objeto cae" src="img/hamburguesa.webp" alt="" style="--y:90cqw;--ancho:32cqw;--d:1.2s">
```
Variantes:
- `.girando`: entra enorme y girando desde el cuadro 0, lo mejor para un
  gancho;
- `.cae`: cae desde arriba;
- `.brota`: sale de algo, como el genio de la lámpara; vuelve en `--fuera`;
- `.flota`: entra y queda flotando.

`.moneda` es una moneda dorada hecha con CSS.

Los emojis 3D de Fluent vienen de 256 px: hasta unos 40 cqw de ancho se ven
bien; más grandes se ven blandos.

### Globo de diálogo y sello
```html
<div class="globo entra encima" style="--d:.75s;--fuera:1.75s">Te enseño todo por <b>$$</b></div>
<div class="sello encima" style="--d:1.75s">NO</div>
```
- El sello acepta `--color` y `--tam`.

### Pila con su total (lo que cuesta la alternativa)
```html
<div class="pila" style="--d:.8s;--fuera:3.2s">
  <div class="item" style="--i:0;--c:#c2410c;--r:-1.5deg">Escala tu negocio<small>25 h</small><span class="precio-c">$1,997</span></div>
</div>
<div class="total golpea encima" style="--d:1.5s;--fuera:3.2s">$3,832 y 72 horas<small>en promedio $639 por curso</small></div>
```
- Los colores de cada `.item` llevan letra blanca. Usa tonos oscuros con
  4,5:1 o más: `#c2410c`, `#4338ca`, `#0f766e`, `#be185d`, `#6d28d9`,
  `#1d4ed8`.
- El total suma de verdad lo que muestra la pila.

### Fichas numeradas (los pasos)
```html
<div class="fichas" style="--d:.1s"><b style="--i:0">1</b><b style="--i:1">2</b><b style="--i:2">3</b><b style="--i:3">4</b></div>
```

### Lista que se marca
```html
<ul class="lista errores" style="--y:62cqw">
  <li class="entra" style="--d:.3s">Se desborda</li>
</ul>
```
- Variantes:
  - `.errores`: con ✕ rojo;
  - sin clase: con ✓ verde;
  - `.iconos`: con un logo o un emoji en vez de la marca, por ejemplo
    `<li><img src="img/facebook.svg"><span>Página de Facebook<small>Desde ahí salen tus anuncios.</small></span></li>`.
- El tamaño se cambia en la lista (`style="font-size:6cqw"`).

### Teléfono con la pantalla real
```html
<div class="tel" style="--fuera:2s"><div class="pant"><div class="estado-tel"><span>9:41</span><svg><use href="#ic-estado"/></svg></div>
  <div class="vista"><img style="--s:22cqw" src="img/panel.webp" alt="…"><img class="funde" style="--s:62cqw;--d:1.45s" src="img/cuentas.webp" alt="…"></div>
  <div class="toque" style="--x:73%;--y:40cqw;--d:1s"></div>
  <div class="marco funde" style="--x:5cqw;--y:27cqw;--w:53cqw;--h:13.5cqw;--d:.4s;--fuera:2s"></div>
</div></div>
```
- `--s` sube la captura dentro del teléfono.
- La segunda captura con `.funde` es el cambio de pantalla después del
  toque.
- `.marco` y `.flecha` señalan; `.etiqueta` es un cartel amarillo
  (`--x` o `--r`, `--y`, `--tam`).

### Tarjetas que pasan una por una (consejos)
```html
<div class="tarjeta entra" style="--d:.25s;--fuera:2s"><div class="rot"><img src="img/foco.webp" alt="">El consejo de Judito</div><b>Tres creativos, no uno</b><p>Meta le pasa el presupuesto a la que gana.</p></div>
```
- **Cada tarjeta tiene que poder leerse en lo que dura**, a 4 palabras por
  segundo; `revisar.mjs` lo mide.
- Texto corto: un título y una línea.

### Cifra que cuenta
```html
<div class="cifra" data-antes="" data-despues=" gal" style="--hasta:620;--d:.1s;--dura:1.2s"></div>
```
- Cuenta de `--desde` (0) a `--hasta`, sin separador de miles. Para "$6,823",
  mejor texto fijo con `.golpea`.

### Precio
```html
<div class="precio golpea"><b>$20</b><span>al mes</span></div>
<div class="sticker golpea" style="--d:2.7s;--giro:20deg;--y:63cqw">14 días<br>GRATIS</div>
<div class="texto-chico">+ el presupuesto de tus anuncios, que pagas directo a Meta.</div>
```

### Logo o producto
```html
<img class="logo-grande" src="img/juditoads.webp" alt="JuditoADS" style="--d:.05s">
```
- Acepta `--y`, `--ancho`, `--radio` y `--fuera`.

### Foto o video real a sangre
```html
<div class="foto deriva"><img src="img/obra.jpg" alt="…"></div>
<div class="velo"></div>
<div class="foto"><img class="secuencia" data-video="clips/obra.mp4" alt=""></div>
```
- **El video real va siempre como `img.secuencia` con `data-video`**: el
  render lo abre en cuadros y los cambia uno por uno. Un `<video>` no se
  puede sincronizar cuadro a cuadro. En la mesa de revisión se ve como
  video.
- `.velo` oscurece arriba y abajo para que el texto se lea. Sin él,
  `revisar.mjs` avisa.

### Antes y después
```html
<div class="ad" style="--d:.6s">
  <img src="img/antes.jpg" alt="Antes"><img class="despues" src="img/despues.jpg" alt="Después">
  <div class="linea"></div><span class="rot antes">Antes</span><span class="rot despues-rot">Después</span>
</div>
```
- Acepta `--y` y `--proporcion` (4 / 5 por defecto).
- **Solo con fotos reales y con permiso.** En salud y cuerpo, nunca
  (`reglas.md`).

### Público: la mira encuentra al comprador
Está en `catalogo-escenas.html` (`cat-publico`):
- una rejilla de 6 × 5 personas con `.elegido` en la número 16;
- `.mira` termina sobre esa persona.

### Bucle abierto
```html
<div class="pulso" aria-hidden="true"></div>
<div class="cap bucle"><span class="w">Pero</span> <span class="w" style="--d:.12s">eso</span> … <br><span class="w" style="--d:.55s"><span class="hl">lo más loco</span>…</span></div>
<img class="emoji" src="img/cabeza.webp" alt="" style="--d:.7s">
<div class="puntos" style="--d:1s"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i></div>
```
- Menos de 2 segundos.
- La parte resaltada entra como una sola pieza (un solo `.w`), no palabra por
  palabra: si no, se ve cortada.
- Sonido:
  - un `pop` por palabra;
  - `plop` del emoji;
  - `subida@0:<dur>`, que sube hasta el corte.

### Mapa conceptual (cómo funciona algo)
```html
<div class="mapa" style="--cam-desde:translate(-24cqw,-14.2cqw) scale(2);--cam-hasta:none;--cam-dura:1.1s">
  <svg class="lineas" viewBox="0 0 100 177.78" aria-hidden="true">
    <path class="linea" pathLength="1" d="M34 76 Q46 76 52 86" style="--d:1.6s"/>
    <path class="flujo" pathLength="1" d="M34 76 Q46 76 52 86" style="--d:2s"/>
  </svg>
  <div class="nodo" style="--x:26;--y:70;--tam:22cqw;--d:.9s"><img src="img/negocio.webp" alt=""><span class="nombre izq">Tú</span></div>
  <div class="nodo cuadrado lleno ya" style="--x:62;--y:96;--tam:27cqw"><img src="img/juditoads.webp" alt=""></div>
  <img class="paquete" src="img/llave.webp" alt="" style="--x0:34;--y0:76;--xm:44.5;--ym:78.5;--x1:52;--y1:86;--d:2.4s;--dura:1.1s">
  <div class="rotulo entra" style="--x:48;--y:67;--d:2.9s">tu permiso</div>
</div>
```

| Pieza | Para qué |
| --- | --- |
| `.nodo` | Un círculo con un logo o un emoji. Variantes: `.cuadrado`, `.lleno` (la imagen ocupa todo), `.blanco` (para logos sobre blanco), `.foco` (un anillo que late), `.ya` (ya estaba). La etiqueta va en `.nombre`, con `.izq`, `.der` o `.arriba` para cambiarla de lado. Una `.insignia` cae encima. |
| `.linea` | Se dibuja en `--d`. Colores: `.dinero` (acento), `.datos` (verde); sin clase, el primario. `.ya` si ya estaba dibujada. |
| `.flujo` | Trazos que corren por la misma línea; `.vuelve` corre al revés. |
| `.paquete` | Algo que viaja de (`--x0`, `--y0`) a (`--x1`, `--y1`), pasando por (`--xm`, `--ym`) si la línea es curva. En una curva `M a Q c b`, el punto medio es `a/4 + c/2 + b/4`. `.paquete.chip` es una etiqueta con texto que viaja. |
| `.rotulo` | Una etiqueta quieta junto a una línea. `.datos` la pone en verde; acepta un ícono con `<img>`. |
| `--cam-desde` / `--cam-hasta` | La cámara: transforma todo el mapa. Para pasar de un logo grande en el centro al mapa entero, se empieza con la escala y el corrimiento que dejan ese nodo en el centro. |
| `--luz-desde` / `--luz-hasta` / `--luz-d` | Apagar o prender el mapa; los bucles lo bajan a .18. |

Un mapa que se repite en muchas escenas conviene armarlo con un script que lo
escriba una sola vez. Así lo hace `scripts/video/juditoads-3/armar.py` en el
repo de Judo Marketing. A mano, un nodo corrido medio cqw se nota como un
salto en el corte.

### Cierre con contacto
```html
<div class="cap arriba funde" style="--fuera:2.2s">Si llegaste<br>hasta aquí,<br>pruébalo <span class="hl">gratis</span><span class="sub">judomarketing.net/juditoads</span></div>
<div class="tel" style="--fuera:2s">…con el botón y un .toque…</div>
<div class="final entra" style="--d:2.5s"><h3>¿Necesitas ayuda?</h3><p>Escríbeme:</p>
  <div class="contacto"><span><img src="marca/logo.png" alt="">@usuario</span><span>WhatsApp +1 …</span></div></div>
```
- La tarjeta queda al menos 4 segundos quieta.

## 6. Variables de posición más usadas

| Variable | Qué mueve |
| --- | --- |
| `--y` | Altura en cqw: `.objeto`, `.tel`, `.pila`, `.total`, `.lista`, `.tarjeta`, `.precio`, `.sticker`, `.logo-grande`, `.ad`, `.emoji`, `.puntos`, `.final`, `.cifra`. |
| `--ancho` | El ancho: `.objeto`, `.tel`, `.logo-grande`, `.emoji`. |
| `--x`, `--y` | La posición del `.globo`, el `.toque`, el `.marco`, la `.flecha` y la `.etiqueta`; en el mapa, sin unidad. |
| `--tam` | El tamaño de letra del `.sello`, la `.cifra` y la `.etiqueta`; en el mapa, el del nodo. |
