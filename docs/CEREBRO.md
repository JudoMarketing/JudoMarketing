# El cerebro de diseño de Judo Marketing

Lo que hemos aprendido construyendo los websites del portafolio, destilado
para que cada website nuevo arranque desde aquí y no desde cero. Se estudió
el sitio vivo de: Judo Marketing, Denali CRT, Melanie Osorio, Pachy Pinchos,
The Equipment Source, The Notes, ART Foundation, Zanoah, Paradise Ranch 22 y
Gerald Market.

**Cómo se usa:** al empezar un website nuevo (en su propio chat), pegar el
prompt de `PROMPT-WEBSITE-NUEVO.md`; ese prompt manda a leer este archivo,
`NICHOS.md` y `PORTAFOLIO-VISUAL.md` antes de escribir la primera línea. Este repo es público, así que
cualquier sesión puede leerlo:
`https://raw.githubusercontent.com/JudoMarketing/JudoMarketing/master/docs/CEREBRO.md`

**Cómo se alimenta:** cada proyecto aporta por su cuenta lo que aprende, en
`CEREBRO-APORTES.md` (ahí está el formato y los pasos). Los aportes se curan
desde el chat de Judo Marketing y los buenos pasan aquí. Nadie edita este
archivo directo desde otro proyecto: una sola mano lo mantiene coherente.

> **Ojo con la rama.** `master` es la rama de producción y donde vive este
> cerebro. JuditoADS aporta desde la rama `juditoads`, Juditos desde `juditos`
> y los demás proyectos empujan a `master`. El reparto completo está en el
> README, sección «Ramas del repositorio». Lo comprueba
> `git ls-remote --heads origin`.

**Novedades** (lo último que cambió, para el que ya lo había leído):

| Fecha | Qué cambió |
| --- | --- |
| 2026-10-28 | **Videos en 8 piezas (sección 8).** Gancho, introducción, cuerpo, bucle abierto, cuerpo, bucle abierto, cuerpo y llamado a la acción, siempre en ese orden (audio de Junior). El video 2 de JuditoADS se rearmó así: `scripts/video/juditoads-2/`. |
| 2026-10-26 | **Errores que ya cometimos (sección 10).** Lo que salió mal trabajando con Claude, con lo que costó y la regla que lo evita: mediciones sin comprobar, ramas de producción, deploys manuales, npm, claves impresas, la terminal, rendimiento, formularios y videos. Se lee antes de tocar git, Vercel, dependencias o claves. Cada error nuevo se anota ahí el mismo día; desde otro proyecto, por `CEREBRO-APORTES.md`. |
| 2026-10-22 | **Seguridad de fábrica (sección 9).** El día de PHP2Shell y de la RCE del optimizador de imágenes de Next.js se revisaron los 34 repos y los 30 sitios: ninguno corre PHP. 20 repos se parcharon y los cuatro que seguían en Next 14 se migraron a Next 15. Todo proyecto nuevo nace sin PHP, en una línea de Next con parches y con `.github/workflows/seguridad.yml`, que avisa por correo. La plantilla JudiWEB ya lo trae. Inventario y procedimiento de emergencia: `SEGURIDAD.md`. |
| 2026-10-22 | **Videos explicativos verticales.** El primero, de JuditoADS (60 s, 1080×1920, sin voz, con efectos), quedó aprobado. Las reglas que salieron de las cinco vueltas de correcciones de Junior están en la sección 8. Todo lo necesario para rehacerlo o sacar el siguiente vive en `scripts/video/juditoads-1/`, y el cómo, en `VIDEOS.md`. |
| 2026-10-13 | **Website Esencial a $150 al mes**, mostrado rebajado de $300 con la etiqueta de 50% de descuento, **sin cuota de inicio** (se quitó la de $130), o **$1,500 de una vez** por los 12 meses (ahorra $300). `pricing.json` guarda el pago único como total fijo (`pagoUnico.essential: {meses, total}`); `descuento()` y `ahorroPagoUnico()` en `src/lib/pricing.ts`. Los borradores de prospección pendientes con cifras viejas salen con las nuevas. |
| 2026-10-12 | **God's Home en el showcase** (godshome.app), primero, con sus primeros 7 segundos en video. Es un proyecto fijo (`PROYECTOS_FIJOS` en `src/content/portfolio.ts`), no del portal. |
| 2026-10-12 | **Prospección con fuentes gratis**: Junior apagó Google por costo. Los negocios salen de OpenStreetMap (`scripts/leads/osm.mjs`) y Sunbiz (website buscado por el nombre); el informe mide con Lighthouse local; el "¿ya rankea?" lo comprueba la sesión con su búsqueda web. `/api/leads` rechaza las acciones de Google (`BUSQUEDAS_GOOGLE_APAGADAS`) y bloquea el recontacto por correo y por dominio entre registros. Detalle arriba de `LEADS.md`. |
| 2026-10-12 | **Precio nuevo del Website Esencial**: $199 al mes, mostrado rebajado de $400 (tachado). Dos formas de pagarlo: 12 pagos mensuales de $199 más $130 de inicio, o un pago único de $2,388 ($199 x 12) sin cuota de inicio. Todo sale de `src/content/pricing.json` (`precioAntes`, `pagoUnico`); el pago único se cobra en Stripe como pago, no como suscripción. Contrato y política cubren las dos formas. Los clientes de antes conservan su precio. |
| 2026-10-04 | **Videos de portada en el showcase**: 13 sitios con movimiento enseñan unos 5 segundos (entrada del hero y bajada suave) en vez de la foto. Se reproducen solo en pantalla y respetan "reducir movimiento". Cómo grabar o sumar uno: `SHOWCASE-VIDEO.md`. |
| 2026-10-02 | **Estrategia por partes** en `ESTRATEGIA.md` (meta $10,000 al mes, diez partes con estado, dueño y marcador semanal). Ya en producción: cuota de inicio de $130 en el Website Esencial (Complejos y Apps sin cuota), prospección que aparta a quien ya rankea arriba en Maps y dice el precio real en cada correo, y el nicho de salud mental con página `/es/salud-mental` y `/mental-health`. |
| 2026-09-28 | **Prompt de arranque y mapa por nicho.** `PROMPT-WEBSITE-NUEVO.md` es el texto que se pega en el chat de cada proyecto nuevo. `NICHOS.md` dice qué lleva cada tipo (contratista, autos, salud, belleza, comida, cursos, SaaS, app de teléfono, comunidad, experiencias, B2B). `PORTAFOLIO-VISUAL.md` es el análisis visual y de funciones de los 26 sitios en vivo, con lo que se repite y lo que falla (el error más repetido: material de borrador publicado). |
| 2026-09-27 | **Prospección: los 10 mejores de cada zona y correo de venta honesto.** La sesión automática ya no toca `enviar.mjs` (la rutina se quedaba colgada en un permiso): ahora guarda con `scripts/leads/guardar.mjs`, que solo escribe en nuestra base; `enviar.mjs` queda para envío manual. Si una zona no da 10 buenos se corre la siguiente el mismo día. El correo pasa a 90 a 160 palabras en 4 partes: el hecho, quiénes somos y qué haríamos, por qué lo decimos (a nuestros clientes les fue mejor, el dinero bien dirigido, crecer contigo) y el cierre. Guía en `LEADS.md`. |
| 2026-09-25 | **Auditoría semanal automática** (`AUDITORIA-RUTINA.md`, rutina de los lunes): mide velocidad, SEO técnico, Google y Bing, correo y seguridad; corrige lo mecánico y deja el informe en `docs/auditorias/`. Metas por trimestre hasta 2028. |
| 2026-09-25 | **Auditoría completa de judomarketing.net** en `AUDITORIA-JUDO-MARKETING.md`: notas por área, evidencia, plan de 90 días y lo que ya se corrigió (fondo animado solo en la primera pantalla, iconos, cabeceras de seguridad, redirecciones del sitio viejo, imagen para compartir, portafolio a una columna en teléfono). |
| 2026-09-25 | **Prospección: España apagada (LSSI) y Reino Unido solo a sociedades Ltd** (señal `sociedad_uk` en `buscar.mjs`). Quedan Estados Unidos y Reino Unido, 10 por país al día. |
| 2026-09-24 | **Prospección en tres países: Estados Unidos, España y Reino Unido, 10 por país al día** (Alemania cargada, apagada por ley). Zonas en `scripts/leads/zonas.json` (3.400 ciudades). La sesión ya no manda: guarda los borradores y el sitio los manda a las 9:30 AM de Miami desde `/api/leads/cron`. Migración 0028. Ley por país en `LEADS.md`, "Candados y ley". |
| 2026-09-23 | **Prospección: 10 negocios al día, todos los días** (antes 20, tres veces por semana). La sesión automática lee los aprendizajes de las corridas anteriores (`leads_corridas.resumen`) antes de elegir y deja los suyos al terminar. Criterio en `LEADS.md`, sección "Aprender de cada corrida". |
| 2026-08-29 | **Sección 0 nueva: Judo Marketing es una empresa de Florida.** Ley de Florida, tribunales de Miami-Dade, brechas por FIPA, horario Eastern, cobros en USD, mercado base Miami. Aplica a todos los proyectos. |

La paleta y los logos de la marca Judo Marketing en sí están en `BRAND.md`;
esto es lo otro: cómo se diseña un sitio **para un cliente**. Y si la duda es
en qué chat se pide un cambio cuando algo se ve en un sitio pero los datos
vienen de otro, eso está en `QUIEN-HACE-QUE.md`.

---

## 0. Dónde está Judo Marketing (dato fijo)

**Judo Marketing es una empresa de Florida, Estados Unidos.** Sede en Miami:
66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130. No es un detalle de
contacto: cambia decisiones en todos los proyectos.

| Qué | Cómo cae en el trabajo |
| --- | --- |
| **Ley aplicable** | Estado de Florida. Jurisdicción para disputas: Miami-Dade County. Todo contrato, política o aviso legal que se escriba para un sitio nuestro se rige por Florida salvo que el cliente imponga otra cosa por escrito. |
| **Brechas de datos** | Aplica la ley de notificación de brechas de Florida (FIPA). Si un sitio guarda datos personales, el plan de incidentes se escribe contra esa regla, no contra el GDPR por defecto. |
| **Autoridades** | Una solicitud de datos con jurisdicción sobre nosotros es de Florida / EE. UU. El procedimiento está en `legal/solicitudes-de-autoridades.md` y en la sección 20 de la Política de Servicio. |
| **Zona horaria** | Eastern (`America/New_York`). Horarios, cortes de facturación, envíos de correo y cron jobs se piensan en Eastern, no en UTC a secas. |
| **Idioma** | Miami es bilingüe de verdad. Español e inglés al mismo nivel, sin “versión traducida”. El selector EN/ES no es un extra. |
| **SEO local** | El mercado base es Miami / South Florida. Ciudad y estado van en títulos, descripciones y en el `LocalBusiness` del sitio; `areaServed` incluye Miami y Florida. |
| **Impuestos y pagos** | Facturación en USD, procesamiento por Stripe con entidad en EE. UU. Los precios se muestran en dólares sin conversión automática. |

Un cliente puede estar en cualquier parte —hay sitios nuestros fuera de
Florida—, pero **la empresa que firma, cobra y responde es de Florida.** Ante
la duda de qué ley o qué huso horario usar, es Florida.

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
(ART), Poppins + Inter (Judo). Máximo una tercera como acento manuscrito y
solo si el rubro lo pide (Caveat en Pachy para el "ahora en tu casa"). Tres
familias trabajando es el tope; cuatro es ruido.

Y la display se queda ARRIBA. Una geométrica puesta a hacer de cuerpo se lee
ancha y rebotada en párrafos, etiquetas y tablas — el propio judomarketing.net
tuvo a Poppins haciendo las dos cosas hasta que se separaron los papeles. Al
ponerla en grande, tracking negativo: al espaciado por defecto se ve suelta,
con huecos entre letras que no están en el diseño de la fuente.

**Lo que se mueve comparte un compás.** Un pulso base y todas las duraciones
como múltiplos enteros de él: así las piezas vuelven a coincidir cada tantos
ciclos y se percibe un latido debajo. Con duraciones sueltas —7s, 10s, 40s,
5s— nada se reencuentra nunca y un montón de cosas moviéndose se lee como
ruido, no como algo vivo. Es la misma idea que la serie de espaciado: una
escala, no números inventados uno por uno.

En judomarketing.net el pulso es 2,4s; los flotantes van a ×2, ×3, ×4 y ×16,
las entradas se escalonan en dieciseisavos (0,15s) y los resplandores laten
en el pulso base, cada uno en su fase para que una fila no respire como un
bloque. La curva de los bucles es sinusoidal (`cubic-bezier(.37,0,.63,1)`):
no se detiene del todo en los extremos, que es lo que separa una respiración
de un vaivén de máquina.

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

## 3. Reglas de construcción (de Judito-Ads y JuditoWEBS)

Diseño aparte: esto es lo que rompe un sitio ya entregado.

**Lo que falla en silencio es lo que hay que cazar.** Es el patrón que más se
repite en los aportes, con tres caras distintas:

1. **Supabase no avisa cuando RLS bloquea.** Responde OK con cero filas
   tocadas. Mirando solo `error`, el panel canta éxito sin haber hecho nada.
   Toda escritura de administración lleva `.select()` y se comprueba que
   volvió al menos una fila. (Pasó en el admin: «Deshabilitar» y «Borrar»
   daban ✓ verde sin cambiar nada.)
2. **Que un ajuste se guarde no significa que se use.** Hay que seguirlo
   hasta el final: pantalla → base de datos → el motor que lo aplica. Los
   intereses del público se elegían, se guardaban y salían en el resumen,
   pero el motor nunca se los mandaba a Meta. Meses a medias sin un error en
   pantalla.
3. **La interfaz miente por omisión:** enseña la promesa, no el resultado.

**El servidor de desarrollo no prueba nada.** En Next.js App Router, un
manejador de eventos (`onError`, `onClick`) dentro de un componente de
SERVIDOR revienta la página entera en producción, y `next dev` no lo detecta.
Antes de publicar, `next build` + `next start` de verdad.

**Zonas horarias: preguntar en cuál agrupa el servicio externo.** Con
`toISOString()` se calcula el día UTC; si el servicio usa otro huso, las
cifras de hoy salen en cero y se pierde el primer día. Meta agrupa el gasto
en la zona de la cuenta publicitaria.

**Safari en iPhone no dispara los eventos de carga de un `<video>` que no se
está reproduciendo.** Cualquier cosa que espere `loadeddata` se cuelga para
siempre. `playsInline` + un `play()/pause()` de arranque, escuchar también
`loadedmetadata`, y SIEMPRE un tope de tiempo que suelte la interfaz.

**El honeypot se acepta en el esquema y se descarta después.** Si el
validador rechaza el campo trampa lleno, el bot lee "reintenta" y la rama que
descarta el spam queda muerta. Y el éxito falso debe ser idéntico carácter
por carácter al real, o el bot compara respuestas y aprende.

**`.env*` en `.gitignore` también ignora `.env.example`.** Hace falta
`!.env.example` después del patrón, o el repo llega sin registro de qué
variables configurar. `git check-ignore -v` engaña; la prueba real es
`git add --dry-run`.

**Permisos de Meta: semanas de antelación.** Una app en modo Desarrollo solo
deja entrar a quien tenga rol en ella; los demás ven «Función no disponible»
y parece fallo nuestro. Pasar a Live y el App Review se empiezan antes de
tener clientes esperando. Y un portafolio de negocio con restricción
publicitaria no puede ni conectar la app — eso se apela aparte.

**Next.js 16 rompe patrones que se escriben por inercia:** `middleware.ts` →
`proxy.ts`; `params` y `searchParams` son Promises; `images.domains` →
`remotePatterns`; `next.config` ya no acepta `eslint`. El más traicionero es
`images.qualities`, que vale `[75]` por defecto: un `quality={90}` no da
error, se degrada en silencio. Next trae sus docs en
`node_modules/next/dist/docs/`.

**Un puente entre apps se prueba el viaje entero, no cada lado por su
cuenta.** Y el lado que llama debe distinguir «me dijeron que no» de «no me
contestaron»: son problemas distintos y se arreglan en sitios distintos. Los
botones de suspender y eliminar del portal estuvieron listos días antes que
el `POST` del otro lado; cada clic salía 405 y parecía un fallo del portal.

**Al dar de baja algo que mueve dinero, el orden es la función.** Primero se
corta el gasto —anuncios, cobros— y solo después se toca el registro. Si el
gasto no se puede cortar, la baja se **niega** y dice por qué: una baja a
medias deja anuncios corriendo sin dueño y cobros a un cliente que ya no
existe, y nadie se entera hasta ver la factura. Y baja lógica antes que
borrado físico, que el historial de facturación no se recupera.

### Asistentes de IA (de Juditos)

**El modelo nunca es la fuente de verdad del dinero ni de los hechos.** La
herramienta que registra un pedido ignora el precio que diga el bot y lo saca
del catálogo; la que agenda una cita comprueba el solape en la base antes de
aceptar. Un modelo puede regalar un descuento o prometer un hueco ocupado con
toda seguridad, y el cliente lo va a exigir. **Al prompt se le da la vuelta
hablando; a un `SELECT` no.**

**Las notas internas del sistema no van como un mensaje más de la
conversación.** Si el motor decide si contestar mirando «¿el último mensaje es
del contacto?», una nota de error guardada al final vuelve esa respuesta un
«no» y todos los reintentos se saltan en silencio, para siempre: el trabajo
queda marcado como hecho y el cliente nunca recibe respuesta. Filtrar las
notas internas antes de esa comprobación.

**En el prompt cacheado no entra nada que cambie entre mensajes** — ni la
fecha, ni la hora, ni el nombre del contacto. La caché funciona por prefijo
exacto: un byte distinto invalida todo lo que viene detrás y se paga el
prompt entero otra vez, cada mensaje. Lo estable (negocio, tono, reglas,
catálogo) en el `system`; lo variable en el mensaje del usuario. Se comprueba
en `cache_read_input_tokens`: si sale cero mensaje tras mensaje, algo
variable se coló.

**El bot del cliente es vía de captación con tres reglas, y un problema sin
ellas.** (1) Dice quién lo construyó **solo si le preguntan**: meterlo en
saludos y despedidas convierte el servicio del cliente en publicidad nuestra.
(2) No habla del modelo ni de su proveedor — el crédito es de la casa, no de
la tecnología. (3) No finge ser humano; si le preguntan si es un bot, lo
dice: además de honesto, varios países ya lo exigen por ley. Y un interruptor
por cliente, que siempre habrá uno que quiera marca blanca.

---

## 4. El esqueleto de home que funciona

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

## 5. Dirección de arte por rubro (del portafolio)

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

La versión completa, con funciones, preguntas y trampas por tipo (incluidas
apps de teléfono, SaaS, reservas con pago y B2B), está en `NICHOS.md`.

---

## 6. El cerebro profundo del kit

Las sesiones del kit de construcción llevan su propia memoria en
`kit/cerebro/` (archivado en la rama `archivo/kit-cerebro`; se trae con
`git checkout origin/archivo/kit-cerebro -- kit/cerebro`): `METODO.md` (el
orden de las decisiones de diseño), `MODERNO.md` (técnicas actuales con su
código y sus trampas), `VERIFICACION.md` (los scripts de comprobación),
`ERRORES.md` (los errores cometidos de verdad, con lo que costó cada uno) y
`PROMPTS.md`. Este archivo cura lo general; el detalle técnico vive allá.

---

## 7. Checklist antes de entregar

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
- [ ] `next build` + `next start` corrido de verdad, no solo `next dev`.
- [ ] Cada escritura de administración comprobada contra la base: que la fila
      cambió, no que el botón dijo ✓.
- [ ] Revisado en teléfono de verdad, no solo achicando la ventana.
- [ ] Seguridad (sección 9):
  - `npm audit --omit=dev` sin críticas ni altas;
  - `.github/workflows/seguridad.yml` en el repo y en verde;
  - cabeceras de seguridad en todas las rutas (`curl -I`);
  - cero archivos PHP, cero rutas de prueba abiertas, cero claves en el repo;
  - el dominio agregado a `scripts/seguridad/sitios.txt`.

---

## 8. Videos explicativos para redes (vertical)

Aprendido haciendo el video de JuditoADS (octubre de 2026). Junior lo revisó
escena por escena en cinco versiones antes de producirlo. Cada regla de
abajo es una corrección suya o algo que costó rehacer. El cómo (carpeta,
scripts y pasos) está en `VIDEOS.md`.

**Formato.**
- 1080×1920 a 60 fps, alrededor de 60 segundos, sin voz.
- El guion va en subtítulos grandes y amarillos sobre fondo morado oscuro,
  con la marca de la casa.
- Una idea por escena, de 2 a 4 segundos.
- Lo que se cuenta en lista (los consejos) va uno por uno, unos 2 segundos
  cada uno.
- Si Junior sale a cámara, es al principio y dura 2 o 3 segundos.

**Estructura: 8 piezas, siempre en este orden** (audio de Junior, 28 de
octubre de 2026). Es lo que hace que la gente vea el video hasta el final.
El video 2 de JuditoADS es el ejemplo armado así.
1. **Gancho.** Algo que rompe con lo que venían viendo y los hace frenar. Se
   mueve desde el primer cuadro: una pregunta cualquiera no frena a nadie.
2. **Introducción.** En pocos segundos, qué se llevan si se quedan ("Quédate:
   te enseño a lanzar el tuyo").
3. **Cuerpo 1.** Algo que les sirve y no sabían.
4. **Bucle abierto.** La pieza que de verdad los amarra: una frase como "Pero
   eso no es lo más loco…" deja una pregunta en el aire. Se cierra en la
   escena que sigue, dicho con todas las letras.
5. **Cuerpo 2.**
6. **Otro bucle abierto.**
7. **Cuerpo 3.** El último cuerpo es lo más útil que se puede usar hoy (en
   JuditoADS, los consejos de Judito).
8. **Llamado a la acción.** Es la pieza que trae clientes. Se le habla al que
   llegó hasta el final, que es el más interesado ("Si llegaste hasta aquí,
   pruébalo gratis"), y se le da un solo siguiente paso.

Cómo se ve un bucle abierto: la frase entra palabra por palabra, un emoji 3D
y tres puntos que avisan que viene algo, con un sonido que sube y corta en
seco. Dura menos de 2 segundos.

**El teléfono nunca toca el texto.** Fue la corrección de casi todas las
escenas de la primera versión. La pantalla se reparte en franjas:
- el texto entre el 14% y el 56% del ancho, contado desde arriba;
- el teléfono desde el 60%, cortado por abajo;
- las zonas que tapan los botones de Reels y TikTok, libres.

Sin la isla negra del iPhone (se leía como "una mancha"): basta una barra de
estado con la hora.

**Pantallas reales, sin zoom.**
- Lo que se muestra es la app de verdad, en modo demo con un negocio de
  ejemplo, nunca una maqueta.
- Junior pidió quitar los acercamientos: la captura se ve entera y quieta.
- Para señalar se usa una flecha o un recuadro amarillo grueso, ajustado al
  borde de la tarjeta.
- Revisar que ningún titular quede cortado por la barra de estado.

**Nada que parezca hecho por IA.**
- Un genio en ilustración plana se leyó como "un mojón morado".
- Lo que funcionó:
  - emojis 3D de Microsoft Fluent (licencia MIT);
  - objetos modelados en 3D para la ocasión (la lámpara, en three.js);
  - sombras de verdad;
  - animación con rebote y frenado suave.
- Cada golpe, toque y transición lleva su efecto de sonido. Los efectos se
  sintetizan nosotros, sin bancos de sonido de terceros.

**Mapas: nunca Google Earth en un anuncio.** Sus reglas lo prohíben. El vuelo
"de la Tierra a la oficina" se hace con CesiumJS e imágenes públicas, con el
crédito visible:
- NASA para la Tierra;
- Sentinel-2 de EOX para Florida;
- USGS y NAIP para la ciudad y el edificio.

Tiene que ser un solo movimiento continuo, sin cortes ni fundidos. Al
llegar: un punto rojo con una etiqueta blanca y el logo en negro.

**Cifras que se entienden de un vistazo.**
- El precio de los cursos va con su total y su promedio ("$6,823 y 134
  horas · en promedio $758 por curso").
- El precio de la app va comparado con algo cotidiano y corto: "Lo que
  cuesta una hamburguesa" (sin "con todo").
- Toda cifra tiene que ser verdad: el "te llegó por menos de 5¢" se dice
  solo si la campaña lo cumple.

**Cierre.**
- "Pruébalo gratis" con la dirección y el dedo tocando el botón de prueba.
- Después, unos 5 segundos con el contacto: @judo.marketing y el WhatsApp de
  la agencia (+1 305 934 9981).

**Método.**
1. Primero el guion con capturas como artifact, con comentarios por escena
   que Junior deja en la misma página.
2. Producir solo cuando lo aprueba.
3. Antes de entregar: una hoja con un cuadro cada 2 segundos, más los
   cuadros de cerca de cada salida de escena.

---

## 9. Seguridad: lo que todo proyecto trae de fábrica

Aprendido el 22 de octubre de 2026, el día de **PHP2Shell**: dos fallas de
PHP (CVE-2026-109618 y CVE-2026-109619) que dejan tomar un servidor sin
contraseña y que afectan a WordPress, Magento, Drupal y casi cualquier
hosting con PHP. El mismo día salió una ejecución remota de código en el
optimizador de imágenes de Next.js. El inventario de sitios, el
procedimiento de emergencia y las excepciones están en `SEGURIDAD.md`.

**Sin PHP.**
- Construimos en Next.js (o estático) sobre Vercel: no hay PHP que parchar,
  ni servidor nuestro que se quede atrás.
- Nada de WordPress, `.php` ni hosting compartido para un sitio nuestro.
  `seguridad.yml` falla si aparece un archivo PHP en el repo.

**Si un cliente trae PHP** (un WordPress que ya tiene, un hosting que no
quiere dejar), antes de tocarlo:
- **Versión con parches.** PHP 8.2.35, 8.3.36, 8.4.27 u 8.5.12 o más nueva.
  PHP 8.1 y anteriores ya no reciben parches: se migra o el hosting tiene
  que dar parches extendidos por escrito.
- **Hosting administrado** que aplique los parches de PHP por su cuenta
  (Hostinger, SiteGround, Kinsta y similares), nunca un servidor que nadie
  actualiza.
- **Mientras llega el parche:**
  - `session.upload_progress.enabled = 0`;
  - un firewall delante (Cloudflare o el del hosting) con sus reglas de
    PHP2Shell.
- **WordPress:** núcleo y plugins con actualización automática, fuera los
  plugins abandonados, copia de seguridad diaria fuera del servidor y admin
  con contraseña larga y segundo factor.
- **Propuesta escrita.** Se propone pasarlo a nuestro stack, y queda por
  escrito si el cliente prefiere quedarse.

**Next.js en una línea con parches.**
- Siempre la última versión de una línea que todavía recibe parches.
- Una línea sin soporte (Next 14 en 2026) no se parcha: se migra.
- Con React 19, los formularios no pueden perder lo escrito cuando el
  servidor contesta con un error. Se cubren con un componente como
  `ActionForm` de RBT Corner.

**Vigilancia que avisa sola.**
- Todo repo lleva `.github/workflows/seguridad.yml` (plantilla en
  `scripts/seguridad/seguridad.yml.plantilla`; JudiWEB ya lo trae). Corre
  lunes, miércoles y viernes, y cuando cambian las dependencias.
- Falla si aparece:
  - una vulnerabilidad crítica o alta en las dependencias de producción;
  - un archivo PHP;
  - un optimizador de imágenes abierto a cualquier dominio.
- **Si llega el correo de que falló, se parcha ese día.**
- Si la rama de producción no es la principal, el flujo revisa la de
  producción (`ref:`).
- La auditoría semanal además revisa todos los sitios desde afuera con
  `scripts/seguridad/sondear-sitios.py`.

**Reglas de construcción.**
- **Cabeceras en todas las rutas.**
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `X-Frame-Options: SAMEORIGIN`.
  - Una CSP que no toca scripts: `frame-ancestors 'self'; base-uri 'self';
    object-src 'none'; upgrade-insecure-requests`.
  - Una CSP con `script-src` solo se pone con nonces, nunca con
    `unsafe-inline` para aparentar.
- **`images.remotePatterns` solo con los dominios que de verdad usa
  `<Image>`.** Con `hostname: "**"`, cualquiera usa el optimizador del
  cliente como proxy y Vercel nos lo cobra.
- **Cero rutas de prueba o diagnóstico abiertas.** Si hacen falta, piden
  sesión de admin. Zanoah tenía `/api/diag`, que creaba órdenes reales,
  mandaba correos a los admins y mostraba sus correos a cualquiera.
- **Claves y contraseñas solo en las variables de Vercel.** Nunca en el
  repo, ni en un `.md` "para acordarse". Si se escribió una, se cambia: el
  historial no se borra.
- **Toda ruta pública que escribe o manda correo** valida lo que recibe,
  tiene límite de intentos por IP y, si es un formulario, trampa anti-bots y
  captcha verificado en el servidor.
- **El preview no es un lugar seguro para probar pagos.** Si el proyecto
  comparte base de datos, Stripe o correo entre preview y producción, una
  compra de prueba en el preview es real. Se avisa en el `CLAUDE.md` del
  repo.

**Cuando sale una vulnerabilidad grande:**
1. judomarketing primero.
2. Después todos los repos con `scripts/seguridad/auditar.sh`.
3. Se parcha con `parchar.sh`.
4. Se prueba en el preview contra producción con `comparar.sh`.
5. Se sube solo si la rama de producción no se movió.

El detalle paso a paso está en `SEGURIDAD.md`.

---

## 10. Errores que ya cometimos (y cómo no repetirlos)

Lo que salió mal trabajando con Claude en los proyectos de la casa: qué
pasó, qué costó y la regla que lo evita. Se lee entero antes de tocar git,
Vercel, dependencias, claves o videos.

Los errores de diseño de los sitios están en la sección 2 y en
`kit/cerebro/ERRORES.md`. Esta sección es de **cómo trabajamos**.

**Cómo se alimenta.**
- Cada vez que una sesión se equivoca, se agrega aquí **el mismo día**, con
  la fecha. Da igual quién lo pille: Junior, una prueba o un cliente.
- Desde el chat de otro proyecto, el error va a `CEREBRO-APORTES.md` y se
  cura aquí.
- Repetir un error que ya estaba escrito cuesta el doble: se perdió el
  tiempo y se perdió la confianza.

### Dar algo por hecho sin comprobarlo

- **Lighthouse midió la página de login de Vercel**, no el preview
  (2026-10-26).
  - Qué pasó: el script que leía el archivo de cookies se saltaba las líneas
    `#HttpOnly_`, y sin cookie de acceso Vercel muestra su login. Los
    números no eran del sitio.
  - Regla: toda medición se valida antes de creerla. Se mira la
    `finalDisplayedUrl` del informe o una captura: que lo medido sea lo que
    se quería medir.
- **Comparamos el preview contra alias viejos** (2026-10-22).
  - Qué pasó: `dame-una-mano.vercel.app` y `ai-assistants.vercel.app`
    sirven una versión vieja y dieron "diferencias" falsas.
  - Regla: se compara contra el dominio real del cliente, con su `basePath`
    si lo tiene.
- **Dijimos "la rama de producción se movió" y no se había movido**
  (2026-10-22).
  - Qué pasó: un `git fetch` de varias ramas en un clon superficial no creó
    las referencias.
  - Regla: fetch con refspec explícito
    (`+refs/heads/X:refs/remotes/origin/X`). Antes de concluir, se
    comprueba que la referencia existe.
- **Las portadas del showcase salieron en español** (grabadas el
  2026-10-04; las vio Junior, no nosotros, el 2026-10-22).
  - Qué pasó: el navegador del grabador estaba en `es-US` y los sitios
    bilingües contestaron en español.
  - Regla: lo grabado o generado se mira antes de publicar, cuadro por
    cuadro o portada por portada. Y lo que se enseña a clientes de afuera
    se graba en `en-US`.

### Publicar (git y Vercel)

- **La rama principal no siempre es la de producción.**
  - Qué pasó: may-baykery, aba y zanoah publican desde otra rama.
  - Regla: antes de subir, el `githubCommitRef` del último deploy de
    producción en Vercel dice cuál es. Esa rama se sube solo si no se movió
    mientras trabajábamos.
- **Un push a ABA no llegó a producción** (2026-10-22).
  - Qué pasó: ese proyecto publica a mano y su dominio es un alias.
  - Regla: si el deploy de producción no aparece a los pocos minutos, se
    revisa cómo publica el proyecto antes de reintentar. En ABA se hace
    `create_deployment` a producción y después `assign_alias`.
  - "Promover" un preview no sirve: no reconstruye y se lleva las variables
    del preview.
- **Un build falló por una descarga de Google Fonts.**
  - Regla: un fallo de red en el build se reintenta una vez antes de tocar
    código. Si falla dos veces, el problema es nuestro.
- **El showcase del preview sale solo con los proyectos fijos.** No es un
  error del cambio: el preview no tiene la clave de servicio de Supabase.
  Se revisa la parte fija y lo demás en producción.

### Dependencias (npm)

- **`npm install` corrió `prisma generate` y falló.**
  - Regla: cuando solo se actualiza el lock, va con `--ignore-scripts`.
- **npm cambió versiones exactas por rangos con `^`.**
  - Regla: si el repo fija versiones exactas, se instala con
    `--save-exact`. El diff de `package.json` se lee antes de subir.
- **El build local falló con "supabaseUrl is required".**
  - Regla: los builds locales llevan variables de relleno, con forma de URL
    donde se espera una URL. Nunca las claves reales.

### Claves y datos sensibles

- **Se imprimió en la terminal la contraseña de admin de Zanoah**
  (2026-10-22).
  - Qué pasó: la expresión que debía taparla falló, y hubo que pedirle a
    Junior que la cambie.
  - Regla: un valor secreto no se imprime nunca, ni "enmascarado". Se
    cuenta cuántas veces aparece (`grep -c`) y se dice en qué archivo, nada
    más.
  - Las variables de Vercel no se descifran.

### Terminal y herramientas

- **La sesión se mató a sí misma** (salida 144), dos veces.
  - Qué pasó: `pkill -f "next start -p 3099"` encontró el patrón en su
    propia línea de comandos.
  - Regla: se mata por el PID guardado (`$!`). Si hace falta un patrón, se
    arma por partes (`P="30"; P="${P}99"`) para que no aparezca escrito.
- **ffmpeg no está en el PATH** de las sesiones en la nube. Se usa el
  binario de `imageio-ffmpeg`.
- **Playwright falla con ERR_CERT detrás del proxy.** Lleva
  `ignoreHTTPSErrors`, `--ignore-certificate-errors` y el proxy
  configurado.
- **Varios subagentes escribieron en la misma carpeta y se pisaron los
  resultados.** Cada agente trabaja en una carpeta con nombre único.
- **Script nuevo con un error de sintaxis** (`sondear-sitios.py`).
  - Regla: todo script se corre una vez completo antes de subirlo.
- **Se creó un enlace simbólico que apuntaba a sí mismo**, en la carpeta de
  trabajo del video.
  - Regla: después de crear un enlace, se lista con `ls -l`.

### Rendimiento: el código que pesa

Medido en el showcase el 2026-10-26. Lighthouse en computadora pasó de 54
a 99.

- **`shadowBlur` en un canvas a pantalla completa** se comía el hilo
  principal: 44 s de trabajo en la prueba.
  - Regla: nunca `shadowBlur` dentro de un bucle de animación. El brillo se
    imita con dos trazos anchos y tenues debajo del fino (`LightLines.tsx`).
- **La mascota pedía cuadros todo el tiempo**, aunque el cursor no se
  moviera.
  - Regla: todo `requestAnimationFrame` se apaga cuando no hay nada que
    mover o cuando no se ve.
- **La aparición escalonada contaba toda la lista**: la ficha 16 esperaba
  2,25 s.
  - Regla: el escalonado es por fila (`i % columnas`), nunca por lista.
- **El atributo `poster` bajó los 14 pósters de entrada**, y la primera
  portada tardó casi 8 s en un teléfono.
  - Regla: el póster va como `next/image` (perezoso, con `priority` solo en
    el primero) y el video aparece encima cuando arranca.

### Formularios con Next 15 y React 19

- **Los formularios se vaciaban cuando el servidor contestaba un error**,
  al migrar RBT Corner.
  - Regla: los formularios con Server Actions usan un componente como el
    `ActionForm` de RBT (`preventDefault` + `startTransition`, ignorando el
    error de redirección). Se prueban con un error a propósito antes de
    entregar.

### Videos

Las correcciones de Junior escena por escena están en la sección 8. Aquí van
las trampas técnicas.

- **Opacidad con un solo fotograma clave, al 100%.**
  - Qué pasó: el cambio se repartió por toda la animación y la moneda se
    veía a medias desde el principio.
  - Regla: el valor de partida se fija también en el fotograma donde debe
    empezar a cambiar.
- **Un titular cortado por la barra de estado y un sello que se iba antes
  del barrido.**
  - Regla: antes de enseñarlo, hoja con un cuadro cada 2 s más los de cada
    salida de escena (sección 8).
- **Cesium desde el CDN no cargó**: sus workers corren desde otro origen.
  - Regla: se sirve local.
- **La exportación de NAIP se corta en 4000 px.**
  - Regla: se pide por mosaicos.
- **Textos que partían mal la línea** en el primer borrador del video 2
  (2026-10-28).
  - Qué pasó: palabras sueltas en una línea, el resaltado amarillo cortado
    en dos y la frase de la introducción tapando el globo del genio.
  - Regla: cada frase se mide en el navegador antes del render, con el mismo
    marcado de la escena. Las palabras animadas (`.w`) parten la línea
    distinto que el texto corrido. Después, cuadros sueltos con `--muestra`
    y se miran.
- **El render sacaba cuadros con el valor viejo de una animación**
  (2026-10-28).
  - Qué pasó: una animación que ya había corrido sola al cargar la página
    salía con ese valor en la foto. La frase del primer bucle aparecía antes
    de tiempo.
  - Regla: antes de cada foto se esperan dos cuadros del navegador
    (`requestAnimationFrame` dos veces). Ya está en `render-escenas.mjs`.
