# Moderno

Las técnicas que dan el aspecto actual. Cada una trae **la condición bajo la
cual funciona**, porque copiadas sin esa condición todas empeoran el sitio.

Implementación de referencia: repo `ABA-For-Happiness`, rama
`claude/aba-happiness-v2-ezkofa`.

---

## 1 · Hero de video a sangre con panel de cristal

El recurso que más cambia la primera impresión, y el más fácil de arruinar.

**El error típico:** poner un velo negro al 85–95% para que el texto se lea.
Entonces el video ya no es un video, es una textura oscura, y daba igual
haberlo grabado.

**La forma correcta:** velo global suave (≈25%) para asentar el conjunto, y el
contraste lo pone un **panel de cristal** solo bajo la columna de texto. La
escena se ve entera, incluso desenfocada detrás de las letras.

```css
.a-hero-media::after {              /* velo global: suave */
  content: "";
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgba(12,16,22,.34) 0%, rgba(12,16,22,.2) 52%, rgba(12,16,22,.12) 100%),
    linear-gradient(0deg,  rgba(12,16,22,.42), transparent 46%);
}

.a-hero-copy {                      /* el panel: aquí sí hay contraste */
  background: rgba(12, 16, 22, 0.46);
  backdrop-filter: blur(18px) saturate(115%);
  -webkit-backdrop-filter: blur(18px) saturate(115%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 24px;
  padding: clamp(28px, 3.4vw, 46px) clamp(26px, 3.2vw, 44px);
}

/* Sin backdrop-filter el panel es un 46% de negro sobre video en movimiento:
   legible pero inquieto. Se sube la opacidad. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .a-hero-copy { background: rgba(12, 16, 22, 0.72); }
}
```

**La regla de contraste, que no se puede saltar:** el fotograma más claro del
clip es el peor caso, y hay que medir contra él. No basta calcularlo en papel
— se mide sobre los píxeles renderizados, recorriendo varios fotogramas. El
script está en [VERIFICACION.md](VERIFICACION.md#contraste-sobre-video).

Referencia real: velo 25% + panel 46% dio **5,84:1** en el peor fotograma.

**Un solo color para el texto de encima.** Sobre imagen en movimiento, el
texto a dos tintas se ensucia. Todo blanco, y si hay que destacar una palabra,
se subraya con un trazo fino — no se cambia de color.

**En móvil el panel no sirve.** A 390px taparía casi todo el plano, y un plano
general o se ve entero o no se entiende. El clip se queda arriba con su
recorte y el texto baja a fondo sólido.

```css
@media (max-width: 860px) {
  .a-hero-media { position: relative; inset: auto; aspect-ratio: 16 / 10; }
  .a-hero-copy { background: none; backdrop-filter: none; border: 0; padding: 0; }
}
```

---

## 2 · Cristal y vectores de línea van juntos

Esto es lo que casi nadie explica: **un panel translúcido sobre un fondo liso
es idéntico a uno opaco**. La transparencia solo existe si hay algo que ver
por debajo.

Por eso el cristal y el trazo de fondo son una sola decisión, no dos.

```css
/* La capa de trazo, detrás de todo, sin interceptar clics */
.a-lineart {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 0;
  color: var(--blue-deep);
  opacity: 0.13;              /* ver el límite más abajo */
}
.a-section { position: relative; overflow: hidden; }
.a-section > .a-wrap { position: relative; z-index: 1; }

/* Las superficies, translúcidas */
.a-card, .a-quote, .a-faq, .a-chip {
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .a-card, .a-quote, .a-faq, .a-chip { background: rgba(255, 255, 255, 0.94); }
}
```

Motivos que funcionan: **rejilla de puntos** (la más neutra, sirve bajo
cualquier tarjeta), **curvas de nivel** (donde el bloque habla de un
recorrido: un proceso, un método) y **la marca del cliente dibujada a trazo**
como marca de agua grande y muy tenue.

Se dibujan con `currentColor` y `aria-hidden="true"`: el color lo decide la
sección y no aportan información.

### El límite de opacidad del trazo

Un trazo de fondo **oscurece el punto donde cae**. Si ahí encima hay texto
secundario, el contraste que se calculó contra la superficie limpia ya no
vale.

Con el texto secundario en `#5c6674` y el trazo al 16%, el peor caso caía a
**3,89:1** — por debajo del mínimo. Se corrigió por los dos lados: secundario
a `#525b67` y trazo limitado al **13%**. Peor caso ahora: 4,8:1.

> Al añadir un fondo con textura, hay que **recalcular el contraste del texto
> que va encima** contra el píxel del trazo, no contra el fondo liso.

---

## 3 · Movimiento al scroll, sin JavaScript

`animation-timeline` liga una animación al scroll de forma nativa: la calcula
el compositor, no hay listeners, no hay `requestAnimationFrame` y no cuesta un
solo kilobyte de JS.

```css
.a-progress { display: none; }   /* por defecto no existe */

@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {

    /* Barra de avance de lectura */
    .a-progress {
      display: block;
      position: fixed; inset: 0 0 auto 0; height: 3px; z-index: 90;
      transform-origin: 0 50%;
      scale: 0 1;
      background: linear-gradient(90deg, var(--red) 0 25%, var(--yellow) 25% 50%,
                                          var(--green) 50% 75%, var(--blue) 75% 100%);
      animation: a-progress linear both;
      animation-timeline: scroll(root);
    }
    @keyframes a-progress { to { scale: 1 1; } }

    /* Paralaje del hero: solo `scale`, que el compositor mueve gratis */
    .a-hero-media video, .a-hero-media img {
      animation: a-hero-scale linear both;
      animation-timeline: scroll(root);
      animation-range: 0 100vh;
    }
    @keyframes a-hero-scale { to { scale: 1.14; } }

    /* Los trazos de fondo derivan al pasar por delante */
    .a-lineart {
      animation: a-drift linear both;
      animation-timeline: view();
      animation-range: entry 0% exit 100%;
    }
    @keyframes a-drift { from { translate: 0 30px; } to { translate: 0 -30px; } }
  }
}
```

Las dos envolturas son obligatorias:

- `@supports` — en un navegador que no lo entienda, simplemente no ocurre.
- `prefers-reduced-motion: no-preference` — quien pide menos movimiento no lo
  ve. Comprobado: con `reduce`, la barra queda en `display:none` y el hero en
  `scale:none`.

**Nada de contenido puede depender de esto.** Es decoración, y se comporta
como tal.

---

## 4 · Entrada al hacer scroll, con salida segura

La animación de aparición es el sitio donde más fácil se rompe la
accesibilidad: si el estado inicial es "invisible" y el JS no llega, la página
queda en blanco.

Tres cautelas, en `components/Reveal.tsx`:

1. **El estado oculto lo arma el cliente.** Sin JS nunca se añade la clase que
   oculta, así que se ve todo tal cual.
2. **`prefers-reduced-motion` desarma el efecto entero**, no lo acelera.
3. **El observador se desconecta al primer disparo.** Repetir al subir y bajar
   marea y gasta batería.

```tsx
useEffect(() => {
  const node = ref.current;
  if (!node) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  setArmed(true);                                   // recién aquí se oculta
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { setShown(true); io.disconnect(); }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  io.observe(node);
  return () => io.disconnect();
}, []);
```

Y un detalle de CSS que cuesta encontrar: el desplazamiento va en la propiedad
**`translate`**, no en `transform`.

```css
.a-reveal.is-armed        { opacity: 0; translate: 0 22px;
                            transition: opacity .7s var(--ease-out), translate .7s var(--ease-out); }
.a-reveal.is-armed.is-in  { opacity: 1; translate: none; }
```

Si ambas cosas escribieran en `transform`, la regla de la entrada ganaría por
especificidad sobre el `:hover` de la tarjeta y el hover heredaría su
transición de 0,7 s — se siente pastoso y cuesta mucho diagnosticar. Al ser
propiedades independientes, cada una anima con su propio tiempo.

---

## 5 · Iconos propios

```tsx
const PATHS: Record<IconName, React.ReactNode> = {
  home: (<><path d="M3.6 10.2 12 3.7l8.4 6.5" /><path d="M5.6 9v10.3h12.8V9" />
          <path d="M9.7 19.3v-5.1h4.6v5.1" /></>),
  // …
};

export function Icon({ name, size = 24, className }: Props) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth={1.75}
         strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
```

Con el nombre **tipado** (`icon: IconName` en el contenido, no `string`), un
nombre mal escrito no llega a producción como un hueco en blanco.

Trampa de CSS que costó una revisión: si la pastilla del icono declara su
propia variable de acento, pisa la que hereda de la tarjeta y **todas salen
del mismo color**. Se resuelve con `--acc: inherit` en la pastilla.

---

## 6 · Video: peso y cortesía

Los clips de banco vienen a ~5 Mbps. Se recomprimen así (−90% de peso, sin
diferencia visible, PSNR 37 dB):

```bash
ffmpeg -i original.mp4 -an -vf "scale=1280:-2,fps=24" \
  -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p \
  -profile:v high -level 4.0 -movflags +faststart nombre.mp4

ffmpeg -ss 0.2 -i nombre.mp4 -frames:v 1 -q:v 4 nombre-poster.jpg
```

`-an` quita el audio (se reproducen en silencio) y `+faststart` mueve el
índice al principio para que empiece antes. El póster es **un fotograma real
del propio clip**, así no hay salto visual al arrancar.

Solo MP4: el VP9 equivalente pesaba más con este material, y H.264 lo
reproduce cualquier navegador.

Y el componente **no descarga el video hasta que la página terminó de
cargar**, y lo omite por completo si el visitante tiene ahorro de datos, va
por conexión lenta o pidió menos movimiento. En esos casos se queda el póster.
Un cliente en el móvil con datos limitados no paga por nuestra decoración.
