# El cerebro de diseño de Judo Marketing

Lo que hemos aprendido construyendo los websites del portafolio, destilado
para que cada website nuevo arranque desde aquí y no desde cero. Se estudió
el sitio vivo de: Judo Marketing, Denali CRT, Melanie Osorio, Pachy Pinchos,
The Equipment Source, The Notes, ART Foundation, Zanoah, Paradise Ranch 22 y
Gerald Market.

**Cómo se usa:** al empezar un website nuevo (en su propio chat), leer este
archivo antes de escribir la primera línea. Este repo es público, así que
cualquier sesión puede leerlo:
`https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/master/docs/CEREBRO.md`

**Cómo se alimenta:** cada proyecto aporta por su cuenta lo que aprende, en
`CEREBRO-APORTES.md` (ahí está el formato y los pasos). Los aportes se curan
desde el chat de Judo Marketing y los buenos pasan aquí. Nadie edita este
archivo directo desde otro proyecto: una sola mano lo mantiene coherente.

La paleta y los logos de la marca Judo Marketing en sí están en `BRAND.md`;
esto es lo otro: cómo se diseña un sitio **para un cliente**.

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
9. **Se mide, no se mira.** El contraste, el peso de un video y el tamaño
   real de un icono se comprueban con un número. Casos reales: un amarillo
   que "se veía bien" daba 3,09:1 sobre blanco (el mínimo legible es 4,5:1);
   un icono perfecto a 72px era una mancha a los 27px a los que de verdad se
   muestra. Y al poner cualquier textura de fondo, recalcular el texto que
   cae encima contra el píxel del trazo, no contra la variable.
10. **El comentario no es prueba; la captura sí.** Ya pasó: un CSS decía que
    estaba "concentrando" los colores de la marca mientras hacía lo
    contrario. Todo criterio de diseño se confirma mirando el render.
11. **La tipografía equilibra la marca, no la repite.** Usar la fuente del
    logo en todos los titulares costó una versión entera de un sitio. Logo
    alegre → tipografía seria; el registro juguetón se queda en el logo.
12. **Manda lo que alguien recordaría del logo al día siguiente** — casi
    nunca es el texto ni el color más grande del archivo. Y el color de
    acción es UNO: si también pinta enlaces e iconos, deja de señalar.
13. **El material real manda sobre la plantilla.** Mirar todas las fotos y
    videos del cliente ANTES de componer, y preguntar cuál es la prueba de
    lo que hace el negocio: esa va primero y grande. Elegir el clip que cabe
    en el hueco costó una portada que no decía nada. Y al cambiar una
    imagen, cambiar el texto que la acompaña y su `alt`.
14. **Una sola serie de espaciado.** Cuando el cliente dice que algo se ve
    "rústico" y no sabe señalar qué, casi siempre es esto: doce huecos
    inventados uno por uno, ninguno relacionado. Una serie (4/8/12/16/24/
    32/48/64/96) repartida por jerarquía: el hueco crece con la importancia
    del corte.
15. **En el schema, quien construyó el sitio va en `creator`, no en
    `sameAs`.** `sameAs` es para otras páginas del MISMO negocio (su
    Instagram, su Google); meter ahí al hermano o a Judo es una afirmación
    falsa.

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

## 5. El cerebro profundo del kit

Las sesiones del kit de construcción llevan su propia memoria en
`kit/cerebro/` (rama `claude/kit-cerebro` hasta que se una): `METODO.md` (el
orden de las decisiones de diseño), `MODERNO.md` (técnicas actuales con su
código y sus trampas), `VERIFICACION.md` (los scripts de comprobación),
`ERRORES.md` (los errores cometidos de verdad, con lo que costó cada uno) y
`PROMPTS.md`. Este archivo cura lo general; el detalle técnico vive allá.

---

## 6. Checklist antes de entregar

- [ ] Metadata y OpenGraph en los dos idiomas; JSON-LD del rubro.
- [ ] Favicon y `<title>` con oficio (marca + qué hace + dónde).
- [ ] Dominio decidido (www o pelado) y el otro redirigiendo.
- [ ] Fotos optimizadas (recortadas al contenido, ancho máximo real).
- [ ] Formularios que escriben a base de datos → captcha del lado del
      servidor, no solo del navegador.
- [ ] Sitio registrado en el portal de admin: dominio, precio, día de cobro,
      visible en showcase + categoría + descripción ES/EN.
- [ ] Botón "📡 Avisar ahora" del portal después de publicar (IndexNow para
      Bing/Yandex; Google va por Search Console).
- [ ] Revisado en teléfono de verdad, no solo achicando la ventana.
