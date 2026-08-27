# El cerebro de diseño de Judo Marketing

Lo que hemos aprendido construyendo los websites del portafolio, destilado
para que cada website nuevo arranque desde aquí y no desde cero. Se estudió
el sitio vivo de: Judo Marketing, Denali CRT, Melanie Osorio, Pachy Pinchos,
The Equipment Source, The Notes, ART Foundation, Zanoah, Paradise Ranch 22 y
Gerald Market.

**Cómo se usa:** al empezar un website nuevo (en su propio chat), leer este
archivo antes de escribir la primera línea. Este repo es público, así que
cualquier sesión puede leerlo:
`https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/main/docs/CEREBRO.md`

La paleta y los logos de la marca Judo Marketing en sí están en `BRAND.md`;
esto es lo otro: cómo se diseña un sitio **para un cliente**.

**Cómo está armado:** §1-§4 son las decisiones de diseño (qué se dice, cómo se
ve, qué esqueleto tiene). §5-§12 son el sistema por escrito: tipografía,
color, movimiento, accesibilidad, formularios, imágenes, copy bilingüe y SEO
técnico. §13 es el checklist de entrega, con la parte automatizable en
`scripts/revisar-sitio.mjs`. Los patrones ya en código, listos para copiar,
están en `kit/ui/` (ver `kit/ui/README.md`).

---

## 1. La firma de la casa

Lo que hace que un website se reconozca como nuestro, rubro aparte:

**El titular es una promesa dicha por una persona, nunca el nombre de la
empresa.** Primera o segunda persona, concreta, con punto final:

- "Te maquillo y te dejo hermosa." (Melanie)
- "We clear land. We tear down. We haul it off." (Paradise)
- "Tus notas diarias, escritas mientras tú descansas." (The Notes)
- "Te explico el mercado." (Gerald)
- "Art without limits." (ART Foundation)

El nombre de la empresa vive en el logo y en el `<title>`; el H1 es para
vender. Una sola palabra del titular lleva el color de la marca (mercado.,
hermosa, love): dirige el ojo sin gritar.

**Un color dueño por sitio.** Un solo color de marca + neutrales, declarado
como variables CSS en `:root` y todo lo demás derivado de él (Paradise:
`--brand-bark`, `--bg-raised`…). Oro para Gerald, naranja de atardecer para
Paradise, rosa pastel para Melanie y Zanoah, verde clínico para Denali, teal
para The Notes, fuego para Pachy. Si el sitio tiene varias ofertas que
conviene distinguir, cada familia toma su propio color y TODO lo que la
representa (etiqueta, borde, botón, viñetas, resplandor) sale de la misma
variable — así se lee como sistema y no como decisiones sueltas (patrón
`.svc-*` de judomarketing.net).

**Dos tipografías, con papeles claros.** Una display con carácter para
titulares + una sans tranquila para el cuerpo: Anton + Inter (Pachy), Domine
(ART), Poppins (Judo). Máximo una tercera como acento manuscrito y solo si el
rubro lo pide (Caveat en Pachy para el "ahora en tu casa"). Tres familias
trabajando es el tope; cuatro es ruido.

**El kicker encima del titular: lugar + prueba + velocidad.** En mayúsculas
pequeñas: "SOUTHWEST FLORIDA · FREE ESTIMATES · WE ANSWER FAST",
"MIAMI, FLORIDA · SINCE 2008", "CLASES EN ESPAÑOL". Dice de una vez dónde
opera, por qué creerle y qué tan rápido responde.

**La regla de tres.** Tres servicios, tres pasos, tres promesas, tres clases.
Aparece en todos los sitios porque funciona: se recuerda y cabe en una fila.

**Los H2 venden, no etiquetan.** "¿Dónde se gana más?" en vez de "Servicios".
"Paga por nota, no por suscripción inflada." en vez de "Precios". "Drag the
handle. That is the whole pitch." en vez de "Galería". Si un H2 podría estar
en el sitio de la competencia, está mal escrito.

**Un ancla de confianza pegada al hero.** La que el rubro tenga: rating de
Google (Pachy 5.0), acreditación (BHCOE en Denali), cumplimiento (HIPAA en
The Notes), año de origen (1999 en Equipment, 2008 en ART), seguidores
(19K en Melanie). Real y verificable, nunca inventada.

**El encabezado trabaja.** Teléfono visible, cambio EN/ES, y UN solo botón
protagonista que dice la acción del negocio: "Ordenar", "Quick Estimate",
"Book an appointment", "Inscribirme". No tres botones compitiendo.

---

## 2. Reglas duras (aprendidas pagando el precio)

1. **Oscuro no es negro.** Un fondo casi negro puro (`#0b0b12`) se lee
   apagado y hunde el texto secundario. Base mínima `#121-#1a1` con
   superficies que se despeguen de ella. Se corrigió en judomarketing.net.
2. **Claro u oscuro lo decide el rubro, no el gusto.** Comida al carbón,
   trading, industrial nocturno: drama oscuro. Salud, belleza, SaaS,
   repostería: aire claro. Melanie, Denali, The Notes y Zanoah son claros y
   son de los que mejor se ven.
3. **Brevedad o nada.** Kicker de 2-3 palabras + un titular + 4 viñetas le
   gana a cualquier párrafo. Si algo necesita explicación, un dibujo o una
   captura real la dan mejor que el texto.
4. **Fotos reales del negocio.** Las imágenes de banco se leen como
   publicidad y se saltan. La comida de Pachy, la cara de Melanie, la
   maquinaria de Equipment: eso detiene el dedo.
5. **Un idioma por vista, completo.** Nada de lema en inglés con página en
   español. Si el sitio es bilingüe, TODO existe en los dos idiomas.
6. **Solo se afirma lo que se puede probar.** Nada de "tráfico asegurado" ni
   "sube al doble" si no es exactamente al doble. Un cliente que pilla una
   exageración deja de creer el resto.
7. **Cada botón dice qué pasa al hacer clic.** "Ordenar ahora", "Ver el
   menú", "Free trial — one note". Nunca "Enviar" ni "Click aquí".
8. **`www` o pelado: decidir y redirigir.** melanieosorio.com solo contesta
   con www y eso rompió las capturas del showcase. El dominio que no sea el
   principal redirige al que sí.

---

## 3. El esqueleto de home que funciona

El orden que se repite en los sitios que mejor convierten:

1. **Hero**: kicker → H1 promesa → una línea de apoyo → CTA fuerte + CTA
   discreto → ancla de confianza.
2. **Cómo funciona**: 3-4 pasos numerados, una línea cada uno.
3. **La oferta**: productos/servicios/planes, con foto real o precio.
4. **Prueba social**: reseñas con nombre y lugar, sin filtro.
5. **Cierre**: CTA repetido + datos locales (dirección, teléfono, horario).
6. **Footer**: navegación, contacto, legal.

En móvil todo esto en una columna, botones de dedo (44px+), y el CTA
principal alcanzable sin hacer zoom.

---

## 4. Dirección de arte por rubro (del portafolio)

| Rubro | La jugada | Referencia |
|---|---|---|
| Restaurante | Fuego y producto: display condensada, fotos grandes de comida, horario y delivery arriba | Pachy Pinchos |
| Salud / terapia | Aire, foto humana real, credenciales visibles, bilingüe completo | Denali CRT |
| Belleza / marca personal | El nombre propio es el logo; pastel + 1 acento; la persona en cámara | Melanie Osorio |
| Industrial / servicios pesados | Condensada pesada, ilustración/insignia con carácter, "since XXXX", números | Paradise, Equipment |
| SaaS | La promesa de tiempo/dinero en el H1, precio sin letra pequeña, cumplimiento visible, prueba gratis | The Notes |
| Fundación | Serif digna, la misión en tres palabras, a dónde va la donación | ART Foundation |
| Tienda / comida empacada | Producto como héroe, entrega y retiro claros, FAQ | Zanoah |
| Educación / cursos | El profesor habla en el H1, video antes que texto, "mírame antes de decidir" | Gerald Market |

---

## 5. Tipografía: la escala de la casa

La display y la sans ya se eligieron en §1. Esto es cómo se usan.

**Tamaños fluidos, no saltos por breakpoint.** Una sola declaración con
`clamp()` cubre del teléfono al escritorio y nunca deja un tamaño intermedio
feo:

```css
h1 { font-size: clamp(2.2rem, 6vw, 4.2rem); line-height: 1.05; }
h2 { font-size: clamp(1.6rem, 3.4vw, 2.6rem); line-height: 1.15; }
p  { font-size: clamp(1rem, 1.1vw, 1.125rem); line-height: 1.6; }
```

**Nunca menos de 16px en un campo de formulario.** Safari de iPhone hace zoom
solo cuando enfocas un input con letra más chica, la página salta y el
visitante pierde el hilo. Es la razón técnica, no un gusto.

**La medida manda sobre el ancho del contenedor.** Párrafo a `max-width: 62ch`
(60-75 caracteres). Un texto de borde a borde en un monitor grande no se lee,
se escanea y se abandona.

**Solo los pesos que se usan.** judomarketing.net carga Poppins 400/500/600/700
y nada más; cada peso extra es descarga que el visitante paga. Se cargan
con `next/font` y `variable`, que auto-hospeda la fuente: no hay petición a
Google desde el navegador del cliente ni parpadeo de texto al cargar.

**Mayúsculas solo en kicker y etiquetas**, con `letter-spacing` de `.08em` o
más. Un párrafo en mayúsculas no se lee, se salta.

**Números en columna con `font-variant-numeric: tabular-nums`.** Precios y
teléfonos alineados; sin eso, una tabla de planes baila.

---

## 6. El color: todo sale de una variable

El "un color dueño por sitio" de §1 solo funciona si el código está armado
para eso. La forma es siempre la misma:

```css
:root {
  --marca: #e0399b;       /* el único color que se elige a mano */
  --marca-luz: #ff8ecb;   /* su versión clara, para textos sobre oscuro */
  --fondo: #12111d;
  --fondo-alto: #1b1928;  /* superficies que se despegan del fondo */
  --texto: #f5f5f7;
  --tenue: rgba(245,245,247,.62);
  --borde: color-mix(in srgb, var(--marca) 30%, transparent);
}
```

**Derivar con `color-mix`, no pegar rgba a mano.** Bordes, resplandores y
fondos suaves salen del mismo `--marca`, así cambiar una línea repinta el
sitio entero. Es el patrón `.svc-*` de judomarketing.net y es lo que permite
que cada servicio tenga su color sin duplicar CSS.

**El color de marca casi nunca es color de texto de párrafo.** Morado sobre
negro es el error clásico: pasa el ojo pero no pasa el contraste. El color
vive en botones, bordes, viñetas, resplandores y UNA palabra del titular.

**Contraste mínimo 4.5:1 en texto de lectura.** El texto tenue que baje de ahí
solo puede ser decorativo (un copyright, una marca de agua), nunca información
que el visitante necesite.

**Sombras de color, no negras.** `0 22px 55px -24px color-mix(in srgb,
var(--marca) 70%, transparent)` da profundidad y pertenece a la paleta; una
sombra negra sobre fondo de color ensucia.

**Cada estado se ve.** Hover cambia elevación, borde o brillo. Un botón que
solo cambia el cursor parece roto en pantalla táctil, donde no hay cursor.

---

## 7. Movimiento: el que se siente y el que estorba

Un sitio caro no se nota por la cantidad de efectos, se nota porque responde.
El movimiento es parte de lo que se vende: fondo vivo, transiciones que
encajan y una navegación que se siente sólida son la diferencia entre un
sitio de plantilla y uno que justifica el precio. Y son también lo primero
que arruina un sitio cuando se hacen sin oficio.

### Los tres niveles, en orden de importancia

1. **Respuesta al toque** (120-200ms): el botón que se hunde, la tarjeta que
   se levanta, el campo que enciende su borde. Es el nivel que más se siente y
   el que casi nadie trabaja. Si solo hay presupuesto para uno, es este.
2. **Entrada y cambio de estado** (300-500ms): aparecer al hacer scroll, abrir
   un panel, cambiar de pestaña. Corto, con curva, nunca lineal:
   `cubic-bezier(.2,.7,.2,1)` entra rápido y frena suave, que es como se mueven
   las cosas de verdad.
3. **Ambiente** (continuo): video de fondo, partículas, degradado que respira.
   Es el que más impresiona en la primera visita y el que más cuesta en
   rendimiento y en batería. Va de último y con presupuesto.

### Video de fondo

Cuando se usa bien es lo que más vende un hero. Las reglas no son negociables
porque cada una viene de un sitio que se rompió:

- `muted`, `loop`, `playsinline`, `preload="metadata"` y **`poster` siempre**.
  El poster es lo que ve el visitante mientras el video carga y lo que ve para
  siempre quien lo tenga bloqueado.
- **Sin pista de audio en el archivo**, no solo silenciado. Un video con audio
  pesa más y algunos navegadores lo tratan distinto.
- **8 segundos y 2.5 MB de tope**, en WebM (AV1 o VP9) con MP4 (H.264) de
  respaldo. Si el corte no cierra en 8 segundos, se recorta el corte.
- **El video no es el LCP.** El texto del hero se pinta primero; el video
  entra después y nunca retrasa el titular.
- **Se pausa** cuando sale de pantalla (IntersectionObserver) y cuando la
  pestaña se oculta (`visibilitychange`). Un video corriendo en una pestaña de
  fondo se come la batería del teléfono y el visitante no sabe por qué.
- **En teléfono, imagen.** Datos móviles y batería. La foto del poster hace el
  mismo trabajo en una pantalla de 390px.
- **Se apaga solo** con `prefers-reduced-motion: reduce` y cuando el navegador
  avisa `navigator.connection.saveData`.
- **Capa de contraste encima**, siempre. El texto tiene que pasar 4.5:1 contra
  el fotograma más claro del video, no contra el promedio.

`kit/ui/JudoFondoVivo.tsx` trae todo esto resuelto.

### Fondos interactivos (canvas, WebGL, degradados que reaccionan)

- **Presupuesto de 8ms por fotograma.** Si no cabe, se baja la densidad, no
  los fotogramas.
- **`requestAnimationFrame` que se detiene** cuando el fondo no está visible o
  la pestaña está oculta. Un bucle eterno es una laptop caliente.
- **La densidad se calcula por área**, no un número fijo de partículas: lo que
  se ve bien en un monitor de 27" ahoga un teléfono.
- **DPR con tope de 2.** En pantallas de 3x se pinta 9 veces el área para cero
  diferencia visible.
- **`pointer-events: none` y debajo del contenido.** El fondo nunca se roba un
  clic ni tapa un enlace.
- **Degradación honesta**: si el contexto WebGL no está disponible, queda un
  degradado estático que se ve bien a propósito, no un hueco negro.

### La navegación, que es donde se siente el sitio caro

- **Nada de secuestrar el scroll.** Ni scrolljacking ni librerías de scroll
  suave que rompen la rueda del mouse y el trackpad. Lo que sí: `position:
  sticky` para que una sección se quede mientras el contenido pasa, y
  `scroll-behavior: smooth` para los anclas.
- **Parallax como máximo 15% de desplazamiento**, y apagado en teléfono.
- **Transiciones entre vistas** con la View Transitions API cuando el
  navegador la tenga, y sin ella el cambio normal: el sitio no puede depender
  de eso para funcionar.
- **La carga no salta.** El esqueleto de carga ocupa exactamente el alto del
  contenido que va a llegar; si no, la página brinca y se pierde el clic.
- **Volver atrás devuelve al mismo punto** de la lista, no al principio.

### Cómo se paga: 60fps o no va

Solo se animan `transform` y `opacity`. Animar `top`, `left`, `width`,
`height`, `box-shadow` o `filter` en scroll es el jank clásico. `will-change`
solo mientras dura el efecto y se quita después, porque cada capa promovida
es memoria de video reservada.

### Lo que no se hace, aunque el cliente lo pida

Autoplay con sonido. Carrusel que avanza solo. Cortina de bienvenida antes del
contenido. Texto que se escribe letra por letra en el hero. Cursor
personalizado que esconde el real. Todo eso se interpone entre el visitante y
la promesa que vino a leer, y eso cuesta dinero.

### `prefers-reduced-motion` no es opcional

Y no significa "animar menos": significa **mostrar el contenido ya visible**.
El componente pinta el estado final de una vez, el video queda en su poster y
el canvas en su degradado. Hay gente a la que el movimiento le produce mareo
de verdad, y esa gente ya configuró su teléfono para avisarlo.

---

## 8. Accesibilidad: el piso innegociable

No es un extra de presupuesto. Un sitio que falla esto también falla en
buscadores y en teléfonos viejos, así que se paga dos veces.

- **Un solo `<h1>` por página**, y los `<h2>` de verdad debajo de él. El orden
  de los encabezados es el índice del documento, no un tamaño de letra.
- **Foco visible en todo lo enfocable.** Si el diseño quita el `outline`, pone
  otro (borde, anillo, fondo). Sin eso, el que navega con teclado va a ciegas.
- **44x44 px de área táctil**, y separados entre sí. El pulgar no tiene puntero.
- **`alt` que describa lo que se ve**, o `alt=""` si la imagen es decorativa.
  "imagen1.jpg" es peor que nada.
- **El color nunca es el único mensaje.** Campo en rojo + texto que dice qué
  pasó. Etiqueta "Agotado", no solo la tarjeta en gris.
- **`<label>` de verdad en cada campo.** El placeholder desaparece al escribir
  y con él la pregunta que el visitante estaba contestando.
- **`lang` correcto por vista** (`es` o `en`): además de accesibilidad, es lo
  que hace que el lector de pantalla pronuncie el idioma que toca.

---

## 9. Formularios: lo único que puede salir caro de verdad

1. **El captcha se verifica en el servidor.** El widget en el navegador es la
   mitad del trabajo: el token se comprueba donde se recibe el envío (en
   nuestro portal lo verifica Supabase Auth al recibir `captchaToken`). Un
   formulario que escribe a base de datos sin esa comprobación se llena de
   basura en días, y limpiarla después es trabajo manual.
2. **Campos mínimos**: nombre, una forma de contacto y qué necesita. Cada
   campo extra baja los envíos; el resto se pregunta contestando.
3. **`type` e `inputmode` correctos**: `type="tel"`, `type="email"`. En
   teléfono cambia el teclado y eso solo ya sube los envíos completados.
4. **Nunca perder lo escrito.** Si el envío falla, los datos siguen en el
   formulario y el mensaje dice qué hacer.
5. **Confirmación con oficio**: qué pasó, en cuánto contestan y a dónde
   escribir si es urgente. "Gracias" a secas deja al visitante sin saber si
   llegó.
6. **Dos correos del mismo evento**: el aviso al negocio y el acuse al que
   escribió. Si el cliente no ve el suyo, vuelve a enviar el formulario tres
   veces.

---

## 10. Imágenes y peso

- **Fotos reales del negocio** (§2.4), recortadas al contenido y guardadas al
  ancho real de uso. Una foto de 4000px mostrada a 600px es 6 veces el peso
  para el mismo pixel visible.
- **`next/image` con `sizes` correcto**, y `priority` solo en la imagen del
  hero. Poner `priority` en todo es lo mismo que no ponerlo en nada.
- **AVIF o WebP para fotos**, PNG solo para logos y dibujos con bordes duros.
- **Objetivo: LCP bajo 2.5s en 4G.** Un hero de 2MB en un teléfono con datos
  es un cliente que se fue antes de leer el titular.
- **Terceros solo si alguien mira ese número.** Chat widgets, mapas embebidos
  y pixeles de plataformas que nadie revisa pesan igual que los que sí se usan.
- Las capturas del portafolio se guardan **una hora, no un día**: el servicio
  de capturas contesta con un dibujo de "cargando" la primera vez que le piden
  una dirección nueva, y con caché de un día ese dibujo se queda de portada
  hasta el otro día.

---

## 11. El copy bilingüe

- **Se escribe en el idioma, no se traduce.** "Te maquillo y te dejo hermosa"
  no sobrevive a una traducción literal: en inglés se escribe otro titular que
  haga el mismo trabajo.
- **El interruptor de idioma se queda en la misma página.** Mandar al home al
  cambiar de idioma es perder al visitante en el paso donde ya estaba
  convencido.
- **El inglés ocupa 15-20% menos.** Botones, kicker y etiquetas se revisan en
  los dos idiomas: lo que en español rompe la fila, en inglés se ve vacío.
- **Lo que no se traduce**: el nombre del negocio, la dirección, el teléfono y
  los nombres propios de producto.
- **Cada idioma tiene su metadata, su OpenGraph y su `hreflang`.** Un sitio
  bilingüe con metadata en un solo idioma compite consigo mismo.

---

## 12. SEO técnico que sí mueve la aguja

- **`<title>` con oficio**: marca + qué hace + dónde. "Pachy Pinchos" no;
  "Pachy Pinchos · Pinchos y comida venezolana en Miami" sí.
- **Una descripción escrita por página.** La que genera el buscador solo
  cuando nosotros no escribimos ninguna casi nunca es la que vende.
- **JSON-LD del rubro, un solo bloque por página**: `LocalBusiness` o
  `Restaurant` para negocio con local, `ProfessionalService` para servicios,
  `SoftwareApplication` para SaaS, `Product`/`Offer` donde hay precio.
- **`creator` del `WebSite` = Judo Marketing**, `publisher` = el cliente,
  `sameAs` = perfiles del MISMO negocio. Meter ahí a Judo o a un sitio hermano
  es una afirmación falsa (el porqué, con detalle, en `kit/README.md`).
- **`www` o pelado: decidir y redirigir** (§2.8), y que el sitemap y los
  canónicos usen el que quedó.
- **El pie con el enlace a judomarketing.net sin `nofollow`.** Esa red de
  enlaces desde dominios reales con contenido real es el SEO de la marca
  (`docs/SEO.md` §4.4).
- **Search Console el día 1** (viene en la lista de accesos de
  `kit/NUEVO-SITIO.md`) y el botón "📡 Avisar ahora" del portal al publicar.

---

## 13. Checklist antes de entregar

Lo que se puede revisar solo, se revisa solo:

```bash
node scripts/revisar-sitio.mjs https://www.elsitiodelcliente.com
```

Ese script abre el sitio en un navegador de verdad (escritorio y teléfono) y
comprueba lo automatizable de esta lista: metadata, OpenGraph, favicon, un
solo H1, idioma y `hreflang`, JSON-LD, el enlace del pie a judomarketing.net
sin `nofollow`, botones con texto que dice qué pasa, `alt` en las imágenes,
fotos servidas más grandes de lo que se ven, área táctil de 44px, campos de
formulario con letra que hace zoom en iPhone, fondo negro puro y redirección
entre `www` y el dominio pelado. Sale con código 1 si algo FALLA, así que
sirve igual en un cron o en CI.

Lo que el script no puede juzgar, se revisa a mano:

- [ ] El H1 es una promesa dicha por una persona, no el nombre de la empresa.
- [ ] Kicker con lugar + prueba + velocidad, y ancla de confianza real
      (verificable, nunca inventada).
- [ ] Un solo color dueño, declarado en `:root`, y todo derivado de él.
- [ ] Fotos reales del negocio, no de banco.
- [ ] Los dos idiomas completos, escritos y no traducidos literal.
- [ ] Metadata y OpenGraph en los dos idiomas; JSON-LD del rubro.
- [ ] Favicon y `<title>` con oficio (marca + qué hace + dónde).
- [ ] Dominio decidido (www o pelado) y el otro redirigiendo.
- [ ] Fotos optimizadas (recortadas al contenido, ancho máximo real).
- [ ] Formularios que escriben a base de datos → captcha del lado del
      servidor, no solo del navegador. Probar un envío de punta a punta y ver
      llegar los dos correos.
- [ ] Movimiento respetando `prefers-reduced-motion` (probarlo activándolo).
- [ ] Sitio registrado en el portal de admin: dominio, precio, día de cobro,
      visible en showcase + categoría + descripción ES/EN.
- [ ] Botón "📡 Avisar ahora" del portal después de publicar (IndexNow para
      Bing/Yandex; Google va por Search Console).
- [ ] Kill switch probado: Deshabilitar → mascota triste → Reactivar.
- [ ] Revisado en teléfono de verdad, no solo achicando la ventana.
