# Verificación

Cómo se comprueba que un sitio está bien. No es el paso final opcional: es
parte de construirlo.

Los scripts de aquí funcionan tal cual. En el contenedor de Claude Code,
Chromium ya está instalado en `/opt/pw-browsers/chromium-*/chrome-linux/chrome`
y solo hace falta `npm i playwright pngjs` en una carpeta temporal.

---

## La lista mínima antes de decir "listo"

```
[ ] typecheck, lint y build limpios
[ ] Todas las rutas, a 390 / 768 / 1440px:
    [ ] sin desbordamiento horizontal
    [ ] sin errores de consola ni respuestas HTTP ≥400
[ ] Todos los pares de texto pasan AA (4,5:1); titulares y gráficos, 3:1
[ ] Texto sobre imagen o video: medido sobre píxeles renderizados
[ ] Con JavaScript desactivado no desaparece ningún contenido
[ ] Con prefers-reduced-motion no se mueve nada
[ ] Los iconos se han mirado a su tamaño real de uso
[ ] Fidelidad del material: cada imagen y video, medido al tamaño al que
    de verdad se muestra hoy (no al que se muestraba cuando se preparó)
[ ] Qué tapa cada panel: contorno del panel pintado sobre el plano sin velo
[ ] Los TODO / datos de relleno que queden, dichos en la entrega
```

---

## Contraste calculado

Para la paleta. Rápido, exacto y sin navegador.

```python
def lin(c):
    c /= 255
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4

def L(h):
    h = h.lstrip('#')
    r, g, b = [int(h[i:i+2], 16) for i in (0, 2, 4)]
    return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b)

def ratio(a, b):
    l1, l2 = L(a), L(b)
    if l1 < l2: l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

PARES = [
    ("cuerpo sobre blanco",   "#4a5462", "#ffffff", 4.5),
    ("titular sobre blanco",  "#101418", "#ffffff", 3.0),
    ("blanco sobre el botón", "#ffffff", "#0a4f96", 4.5),
]
for nombre, fg, bg, min_ in PARES:
    r = ratio(fg, bg)
    print(f"{'OK ' if r >= min_ else 'BAJO'} {r:5.2f}:1 (min {min_})  {nombre}")
```

**Componer antes de medir.** Si el texto va sobre una superficie translúcida o
sobre un fondo con trazo, el fondo real es el compuesto, no el color de la
variable:

```python
def over(fg, bg, a):        # fg con opacidad `a` sobre bg, ambos (r,g,b)
    return tuple(round(fg[i]*a + bg[i]*(1-a)) for i in range(3))

fondo = over(TRAZO, SECCION, 0.13)     # el trazo sobre la sección
panel = over(BLANCO, fondo, 0.68)      # el cristal encima
ratio_texto_sobre(panel)               # ← esto es lo que hay que medir
```

---

## Contraste sobre video

Calcular no basta: hay que medir sobre lo que el navegador pinta de verdad, y
a lo largo de varios fotogramas, porque el peor caso es el fotograma más
claro.

El truco es **ocultar el texto conservando el panel**, capturar solo el panel,
y buscar el píxel más claro.

```js
// medir.js — npm i playwright pngjs
const { chromium } = require('playwright');
const fs = require('fs'); const { PNG } = require('pngjs');

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const lin = c => { c /= 255; return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
const L = (r,g,b) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await (await b.newContext({ viewport:{width:1440,height:900} })).newPage();
  await p.goto(process.env.URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: `${process.env.SEL} > * { visibility: hidden !important; }` });

  let peor = Infinity;
  for (let i = 0; i < 6; i++) {                    // varios fotogramas del clip
    await p.waitForTimeout(900);
    const png = PNG.sync.read(await p.locator(process.env.SEL).screenshot());
    let maxL = -1;
    for (let y = 12; y < png.height-12; y++)       // sin el borde del panel
      for (let x = 12; x < png.width-12; x++) {
        const o = (png.width*y + x) << 2;
        const l = L(png.data[o], png.data[o+1], png.data[o+2]);
        if (l > maxL) maxL = l;
      }
    peor = Math.min(peor, 1.05 / (maxL + 0.05));   // contraste del texto blanco
  }
  console.log(`peor caso: ${peor.toFixed(2)}:1  ${peor >= 4.5 ? 'OK' : 'BAJO'}`);
  await b.close();
})();
```

```bash
URL=http://localhost:3000/es SEL=.a-hero-copy node medir.js
```

**Cuidado al recortar.** Tres mediciones falsas seguidas salieron de aquí:

1. `.panel > * { visibility: hidden }` oculta los hijos, pero **no** los nodos
   de texto sueltos ni los pseudo-elementos del propio contenedor. Dos
   superficies dieron "BAJO" por sus propios glifos.
2. Una captura **por elemento** incluye lo que se le superpone. Una cabecera
   translúcida casi blanca metió un píxel de luminancia 1,0 y el resultado
   cayó a 1,00:1. Hay que ocultar cabecera y barras fijas al medir:
   `.a-header, .a-callbar { display: none !important; }`
3. Por lo mismo, la captura por elemento hizo creer que un antetítulo quedaba
   debajo de la cabecera. Medido en la página real con `getBoundingClientRect`:
   86px de holgura.

**Un resultado extremo —1,00:1, cero píxeles, todo fallando— casi nunca es el
sitio: es el instrumento.** Antes de arreglar un número sospechoso, guarda el
recorte en un archivo y ábrelo. Treinta segundos, tres arreglos innecesarios
ahorrados.

---

## Barrido de rutas

Desbordamiento horizontal, errores de consola, respuestas HTTP ≥400 y bloques
de animación que se quedaron invisibles.

```js
// barrer.js
const { chromium } = require('playwright');
const PATHS = process.env.PATHS.split(',');
const [W, H] = process.env.VP.split('x').map(Number);

(async () => {
  const b = await chromium.launch({ executablePath: process.env.EXE });
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  const errs = new Set();
  p.on('pageerror', e => errs.add('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.add('console ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400) errs.add(`HTTP ${r.status()} ${r.url()}`); });

  let mal = 0;
  for (const path of PATHS) {
    await p.goto(process.env.BASE + path, { waitUntil: 'networkidle' });
    await p.evaluate(async () => {                       // recorrer para disparar todo
      const s = window.innerHeight * 0.75;
      for (let y = 0; y < document.body.scrollHeight; y += s) {
        window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50));
      }
    });
    await p.waitForTimeout(1100);                        // dejar terminar la transición
    const r = await p.evaluate(() => ({
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hidden: [...document.querySelectorAll('.a-reveal')]
                .filter(n => parseFloat(getComputedStyle(n).opacity) < 0.5).length,
    }));
    if (r.over > 0 || r.hidden > 0) { mal++; console.log(`  ${path}: desborda=${r.over} ocultos=${r.hidden}`); }
  }
  console.log(`${process.env.VP}: ${mal ? mal + ' con problemas' : 'limpio'} | ${errs.size ? [...errs].join(' ; ') : 'sin errores'}`);
  await b.close();
})();
```

Ese `waitForTimeout(1100)` **importa**: sin él se mide a mitad de la
transición de entrada y salen "ocultos" que no lo son. Es la clase de falso
positivo que hace perder una hora.

Dos avisos operativos que costaron tiempo:

- **Batches pequeños.** Con muchas rutas y contextos, el proceso se queda sin
  memoria y muere con código 137. De 5 en 6 rutas va bien.
- **`pkill -f "next start"` mata el propio shell** (el patrón coincide con su
  línea de comando) y, peor, deja un servidor viejo sirviendo HTML con un
  hash de CSS que ya no existe: la página sale sin estilos y parece un fallo
  de maquetación gravísimo que no existe. Buscar el PID real
  (`ps -eo pid,cmd | grep "[n]ext-server"`) o arrancar en otro puerto.

---

## Sin JavaScript y con menos movimiento

```js
const sinJs   = await b.newContext({ javaScriptEnabled: false });
const reducir = await b.newContext({ reducedMotion: 'reduce' });
// en ambos: ningún .a-reveal puede tener opacity < 0.5
```

Y para los efectos ligados al scroll, comprobar los dos modos:

```js
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
getComputedStyle(document.querySelector('.a-progress')).display;   // 'block' / 'none'
getComputedStyle(document.querySelector('.a-hero-media video')).scale; // '1.14' / 'none'
```

---

## Hoja de contactos de iconos

Los iconos se juzgan al tamaño real, no al de diseño. Se monta una página con
cada icono a 72px y a su tamaño de uso, y se mira:

```js
const svg = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"
  stroke="#101418" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
celdas += `<figure>${svg(72)}${svg(27)}<figcaption>${nombre}</figcaption></figure>`;
```

Así se detectaron una pieza de puzle que a 27px era una mancha dentada y un
apretón de manos que era un garabato.

---

## Fidelidad del material, y qué tapa cada panel

Estas dos comprobaciones se añadieron después de que un cliente encontrara lo
que la lista no miraba (ver `ERRORES.md` §10 y §11). Son las que más rinden
cuando el sitio ya pasa todo lo demás.

### El material, al tamaño al que se muestra HOY

Un clip comprimido para una caja de 600px se deshace en bloques cuando esa
caja pasa a ocupar 1440. **Un cambio de maquetación invalida las decisiones de
recurso tomadas bajo la maquetación anterior.**

Se mide con SSIM contra el máster, no con el ojo:

```bash
ffmpeg -i servido.mp4 -i master.mp4 \
  -lavfi "[0:v]fps=24,scale=1280:720[a];[1:v]fps=24,scale=1280:720[b];[a][b]ssim" -f null -
```

Referencia útil de una escalera real (clip de sala, 1280×720):

| | peso | SSIM |
| --- | --- | --- |
| CRF 30 | 1,3 MB | 0,967 |
| CRF 22 | 3,6 MB | 0,987 |
| CRF 18 | 6,2 MB | 0,992 |

De 30 a 22 se elimina más de la mitad del error; después decae. Y la
comparación que de verdad convence al cliente es un recorte del mismo
fotograma, ampliado como lo amplía el navegador:

```bash
ffmpeg -ss 4 -i clip.mp4 -frames:v 1 -vf "crop=420:236:640:300,scale=1260:708:flags=neighbor" antes.png
```

`flags=neighbor` a propósito: amplía sin suavizar, así se ve el bloque tal
cual está en el archivo.

Y si hay paralaje o zoom sobre ese material, cuenta: ampliar un 14% un 720p
que el navegador ya está escalando se nota. El efecto decorativo puede
degradar lo que decora.

### Qué tapa cada panel

Un panel de texto sobre una foto o un video **esconde algo**. Hay que ver qué,
no suponerlo. Se pinta su contorno sobre el plano limpio:

```js
await p.addStyleTag({ content: `
  .panel > * { visibility: hidden !important; }
  .panel { background: rgba(255,0,0,.18) !important; border: 3px solid red !important;
           backdrop-filter: none !important; }
  .media::after { background: none !important; }` });
```

En el sitio de terapia, esto reveló que el panel tapaba exactamente a las dos
terapeutas trabajando con una niña — o sea, la prueba del servicio — y dejaba
a la vista pared y suelo.

Cuando haya que reencuadrar, **renderiza las alternativas y míralas**, no
elijas sobre el papel. Inyectando CSS sobre la página en marcha cuesta un
minuto por opción.


---

## Capturas por tramos

Una captura de página completa sale de 9.000px de alto y no se puede leer. Se
corta en tramos de la altura del viewport:

```js
const total = await p.evaluate(() => document.body.scrollHeight);
const n = Math.ceil(total / H);
for (let i = 0; i < n; i++) {
  await p.screenshot({ path: `tramo-${String(i).padStart(2,'0')}.png`, fullPage: true,
    clip: { x: 0, y: i*H, width: W, height: Math.min(H, total - i*H) } });
}
```

**Y luego hay que mirarlas.** Ese es el paso que encuentra lo que ningún
número encuentra: un raíl que se pasa 120px del último nodo, seis tarjetas que
salieron todas del mismo color, un botón que en el fotograma de al lado
desaparece.
