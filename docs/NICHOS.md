# Qué llega según el nicho

Mapa de los tipos de proyecto que ya hizo Judo Marketing, sacado de mirar los
26 sitios en vivo (capturas en escritorio y teléfono, 28 de septiembre de
2026) y de leer su código. Sirve para una cosa: cuando Junior diga "un website
para un taller" o "una app para una psicóloga", el chat ya sabe qué suele
llevar, qué preguntar y en qué se equivocaron los anteriores.

Cómo se usa: se identifica el tipo (a veces son dos: una clínica con portal es
Salud + Plataforma), se toma su esqueleto y sus funciones como punto de
partida, y se le dice a Junior qué se va a construir **antes** de construir.
Nada de aquí reemplaza lo que el cliente diga: lo que el cliente describe se
construye literal (`CEREBRO-APORTES.md`, "la vara del dueño").

El detalle sitio por sitio está en `PORTAFOLIO-VISUAL.md`. Las reglas de
diseño de la casa, en `CEREBRO.md`.

---

## Resumen

| Tipo | Referencias nuestras | Claro u oscuro | Lo que no puede faltar | Stack habitual |
| --- | --- | --- | --- | --- |
| 1. Servicios del hogar y contratistas | HR Gutters, Paradise Ranch, SoFla, JudiWEB | Oficio pesado oscuro; hogar claro | Estimado rápido, barra fija Llamar/Texto/Cotizar, zonas, antes/después | JudiWEB (Next) o estático |
| 2. Autos y emergencias | AC Customs, Mr Naples | Oscuro, un color vivo | Cita con selección múltiple o SOS con ubicación, precio "desde" | JudiWEB o estático con Leaflet |
| 3. Salud y terapia | Denali, ABA for Happiness | Claro, cálido | Seguros arriba, verificar elegibilidad, credenciales, emergencias | Next + portal si hay login |
| 4. Belleza y marca personal | Melanie Osorio, Athena Beauty, Johan Tailoring | Claro (pastel) o editorial B/N | Reservar, servicios con precio, galería real, la persona en cámara | JudiWEB o estático |
| 5. Comida, restaurante y tienda | Pachy Pinchos, Zanoah, Delivery Rush | Comida al fuego oscuro; repostería clara | Menú con precios, carrito o pedido, horario "abierto ahora", reparto | Next + Stripe o pedido a WhatsApp |
| 6. Educación y cursos | RBT Corner, Gerald Market, JuniorMath | Claro con degradado, o oscuro premium | Catálogo con precio, video "mírame antes", inscribirme, login | Next + Prisma/Neon + Stripe + R2 |
| 7. SaaS | The Notes, JuditoADS, Juditos | Claro (salud) u oscuro (marca Judo) | Precio sin letra pequeña, prueba gratis, cumplimiento, captura del producto | Next + Supabase |
| 8. App de teléfono | JudiMental, Mil Colores | Según la app | Página pública que explique la app + bienvenida del primer uso | Expo / PWA + página de marketing |
| 9. Comunidad y fundación | Dame una Mano, ART Foundation | Claro | Misión en tres palabras, a dónde va el dinero, inscribirse o donar | Next + Blob/Supabase |
| 10. Experiencias y reservas con pago | Van Venture | El que pida la marca | Reserva con disponibilidad, pago total o anticipo, fotos del viaje | Next + Neon + Stripe |
| 11. Catálogo B2B y equipos | The Equipment Source | Claro, industrial | Buscador por fechas, inventario con precio, lista de cotización, sedes | Next o estático + formulario |

---

## Lo que llega a TODOS (no se pregunta, se hace)

- Bilingüe EN/ES completo con selector en el header (Miami). Solo se quita si
  el cliente lo pide.
- Teléfono y WhatsApp visibles; en teléfono, **barra fija inferior** con las
  2 o 3 acciones del negocio (lo hacen bien HR Gutters, Paradise, ABA; les
  falta a Pachy, Zanoah, Equipment, JudiWEB).
- Un botón protagonista en el header. Nunca cuatro (judomarketing.net tiene
  cuatro en el hero y se diluye).
- Hero: kicker lugar + prueba + velocidad, H1 promesa, dos botones (uno
  lleno, uno de borde), fila de tres señales de confianza.
- "Cómo funciona" en 3 pasos, oferta con precio "desde" o "se cotiza",
  prueba social, FAQ, cierre con CTA y datos locales.
- JSON-LD del rubro (LocalBusiness y su subtipo, FAQPage), sitemap, robots,
  imagen para compartir, `<title>` con oficio + ciudad.
- Formulario que avisa por correo al dueño, con trampa anti-bots y captcha en
  el servidor, probado en el sitio publicado.
- Reseñas: arreglo vacío que oculta la sección hasta tener reseñas reales, y
  un botón a la ficha de Google. Nunca escritas por nosotros.
- Analítica (GA4 y, si va a haber anuncios, Pixel + API de conversiones).
- Contenido visible sin JavaScript: las animaciones de entrada realzan, no
  esconden.

---

## 1. Servicios del hogar y contratistas

Canaletas, desmonte, demolición, limpieza, jardinería, techos, plomería,
remodelación, mudanzas.

**Visitante:** dueño de casa con un problema concreto, en el teléfono, que
quiere saber cuánto cuesta y si le contestan hoy.

**Visual:** oficio pesado (tierra, demolición, obra) en oscuro con ámbar y
display condensada (Anton, Barlow Condensed, Archivo); servicios de hogar en
claro con un azul o verde de marca. Fotos reales de trabajos; si aún no hay,
ilustración con carácter, nunca banco de imágenes.

**Esqueleto:** hero con estimado → 3 pasos → servicios (máx. 6 visibles) →
la herramienta de estimado → antes/después → zonas (ciudades en fichas) →
reseñas → FAQ → "habla con una persona" (llamar, texto, WhatsApp, correo) →
cierre.

**Funciones que llegan:**
- Estimado rápido: formulario por pasos con fotos y ubicación (Paradise),
  o cotizador instantáneo por satélite que mide el techo (HR Gutters: Google
  Solar API + polígono editable; OSM falla en zonas residenciales de Florida).
- Reserva de visita con franjas y cupo (Google Calendar por cuenta de
  servicio).
- Barra fija Llamar / Texto / Cotizar.
- Comparador antes/después arrastrable.
- En lujo (SoFla): se dice "consulta", nunca "cotización gratis"; página para
  otros contratistas con PDF de capacidades.

**Preguntar:** ciudades que cubre, licencia y seguro (número), precios
reales "desde" o fórmula, qué datos necesita para cotizar, cuántas visitas
por día, fotos de trabajos con permiso del dueño.

**Trampas vistas:** reseñas escritas sin fuente (HR Gutters), dos teléfonos
distintos en la misma página, "Licensed & insured" sin comprobar, 13
secciones en la home.

## 2. Autos y emergencias

Personalización, talleres, grúas, detailing.

**Visual:** oscuro con un solo color vivo (neón para personalización, ámbar
para grúas); display condensada en mayúsculas. En neón, luz detrás de la
letra y brillo con tope (`CEREBRO-APORTES.md`, AC Customs).

**Funciones que llegan:**
- Cita con **selección múltiple** de servicios y estimado sumado, calendario
  abierto, y aviso "aquí no se cobra, se paga en el taller".
- Grúa: botón SOS con GPS, punto en el mapa, estimado por millas de ruta,
  pestañas Emergencia / Programar, envío por SMS al despacho.

**Preguntar:** marcas y modelos con los que trabaja, precios "desde",
horario de emergencias real, clave del proveedor de mapas.

**Trampas vistas:** mapa con "API KEY REQUIRED" en producción (Mr Naples);
plantilla con "YOUR NAME HERE" publicada (AC Customs); H1 que suena a broma
("Te lleno el techo de estrellas" dio risa al dueño).

## 3. Salud y terapia

ABA, psicoterapia, clínicas, dentistas.

**Visitante:** un familiar cansado, con miedo, mirando el teléfono entre dos
cosas (`kit/cerebro/METODO.md`, sitio ABA).

**Visual:** claro, cálido, sans geométrica seria (Plus Jakarta, Figtree) con
Inter; foto humana real; el color alegre del logo solo en el botón.

**Esqueleto:** hero → verificar elegibilidad por seguro (justo después del
hero) → "¿qué necesitas hoy?" → servicios → pasos → equipo y credenciales →
zona que cubre → testimonios → FAQ → emergencias (911/988/211) → aviso legal.

**Funciones que llegan:** verificador de seguro, agenda de consulta, portal
con login si hay alumnos o pacientes, formularios de ingreso, cumplimiento
visible (HIPAA, BHCOE).

**Preguntar:** seguros que acepta DE VERDAD (no "la mayoría"), credenciales
con número, zona, si hay clínica física, idioma del equipo.

**Trampas vistas:** lista de aseguradoras inventada para llenar la columna;
servicio "en clínica" que no existía; tipografía del logo en todos los
titulares (costó una versión entera).

## 4. Belleza y marca personal

Maquillaje, salones, barberías, sastrería, fotógrafos, coaches.

**Visual:** la persona en cámara y su nombre como logo. Pastel con un acento
(Melanie, Zanoah) o editorial en blanco y negro con display condensada
(Johan). Serif con cursiva para el toque personal.

**Esqueleto:** hero con la persona → "dime qué buscas" (tarjetas que llevan a
cada línea de negocio) → servicios con precio → galería real → cursos o
productos → testimonios → FAQ → cierre con WhatsApp.

**Funciones que llegan:** reservar cita (termina en WhatsApp o calendario),
servicios con precio, galería, cursos o portal de alumnas, cupones, captura
de correo. Reserva con número de piezas y fotos de referencia (Johan).

**Preguntar:** horarios por especialista, duración de cada servicio, precios,
fotos reales (sesión de fotos si no hay), redes activas.

**Trampas vistas:** galería de marcadores ("M") publicada (Melanie);
diferenciador 24/7 escondido en una cinta en movimiento (Johan); tres CTA
compitiendo dentro de la reserva (Athena); página de 13.000 px.

## 5. Comida, restaurante y tienda

Food trucks, restaurantes, repostería, productos empacados, delivery.

**Visual:** comida al fuego en oscuro con naranja y Anton (Pachy); repostería
y saludable en claro con serif (Zanoah). **El producto en el primer
pantallazo**: una tienda de postres sin un postre arriba no vende.

**Esqueleto:** hero con estado "abierto ahora · cerramos a las 10" y datos
(pedido mínimo, horario, desde $) → beneficios → dónde estamos (mapa,
horario) → menú con pestañas y precios → reparto o retiro → reseñas → FAQ →
cierre.

**Funciones que llegan:** menú con categorías, carrito y pago (Stripe) o
pedido a WhatsApp, horario en vivo, zonas de reparto, JSON-LD de menú o
ItemList.

**Preguntar:** menú con precios, horario real, zonas y costo de reparto,
pedido mínimo, si cobra en línea o al entregar.

**Trampas vistas:** ventana de "déjanos review" que tapa el teléfono al
entrar (Pachy); WhatsApp flotante que tapa el botón "Add" (Zanoah); sitio
caído con metadatos que siguen prometiendo el servicio (Delivery Rush).

## 6. Educación y cursos

Cursos en línea, clases, tutorías, juegos educativos.

**Visual:** claro con degradados suaves y sans redonda (RBT Corner) u oscuro
premium con dorado (Gerald). El profesor habla en el H1 y en video.

**Esqueleto:** hero → "mírame antes de decidir" (video) → catálogo con
filtros y precio (tachado si hay lanzamiento) → temario → conoce a tu
profesor → testimonios verificados → FAQ → cierre.

**Funciones que llegan:** cuentas y login con roles, compra con Stripe y
webhook, videos en almacenamiento privado (R2), progreso guardado, lista de
espera, referidos, panel de ventas con CSV, chat de soporte con IA, reseñas
solo de alumnos que compraron.

**Preguntar:** cursos con precio y temario, quién da las clases y su
credencial, dónde están los videos, entidad legal (para la política de
reembolsos), si la región cambia el precio.

**Trampas vistas:** dejar elegir la región confundía (se pasó a IP); el
registro bloqueaba hasta confirmar un correo que no salía; SQLite pierde
datos en Vercel; video HEVC no se ve en Chrome; relleno ("Sustituir por la
grabación real") publicado (Gerald).

## 7. SaaS

**Visual:** claro y confiable para salud (The Notes), oscuro violeta para la
familia Judo. **Se muestra el producto**: una captura del panel, una nota de
ejemplo, una conversación del bot. Los tres SaaS nuestros venden solo con
texto y es su punto más débil.

**Esqueleto:** hero con la promesa de tiempo o dinero + "prueba gratis, sin
tarjeta" → cómo funciona → el producto en pantalla → precios sin letra
pequeña → seguridad y cumplimiento → para quién es → FAQ corta (no 17) →
cierre.

**Funciones que llegan:** registro y login, prueba gratis, planes con Stripe,
portal, correos transaccionales, JSON-LD SoftwareApplication.

**Trampas vistas:** emojis como iconos; header de teléfono roto con el CTA
partido en tres líneas (Juditos); fuente que no carga y cae a la del sistema
(The Notes).

## 8. App de teléfono

**Dos piezas, siempre:**
1. **La app** (Expo / React Native o PWA): barra de pestañas abajo, una tarea
   por pantalla, estado personal ("Día 12 de 40"). Mil Colores lo hace muy
   bien.
2. **La página pública que la vende**: qué hace en una frase, maqueta de
   teléfono con capturas reales, 3 beneficios, calificación o testimonios,
   botones de tienda repetidos (con texto accesible, no solo imagen), y una
   bienvenida del primer uso antes de entrar a la app.

A JudiMental le falta decir qué hace (solo mascota y botones de tienda) y a
Mil Colores le falta la página pública (un visitante nuevo cae en "Día 12"
sin saber qué es).

**Preguntar:** nombre verificado en tiendas, USPTO y dominio **antes** de
diseñar (JuniApp chocaba con una marca registrada); cuentas de Apple y
Google; si el profesional necesita un portal (solo las decisiones que solo
él puede tomar, y totales, nunca personas).

## 9. Comunidad y fundación

**Visual:** claro; serif digna para fundación (ART), sans amable para
comunidad (Dame una Mano). Fotos reales de la gente o del trabajo.

**Funciones que llegan:** donar con destino explicado, inscribirse a clases,
voluntariado, tienda, eventos cerca, login por código sin contraseña, barra
de pestañas tipo app, recordatorios por correo, respaldos diarios.

**Preguntar:** datos legales del país (NIT, 501(c)(3)), límites del plan de
correo (Resend gratis se acaba con unas 25 inscripciones), moderación.

**Trampas vistas:** home con información repetida (se bajó a 5 bloques);
botones que se montaban a 360 px; eventos que no cargan y chat vacío en
producción.

## 10. Experiencias y reservas con pago

Tours, alquileres por día, eventos.

**Funciones que llegan:** reserva con disponibilidad y protección contra doble
reserva, pago total o anticipo con la tarjeta guardada y el saldo cobrado días
antes, formularios de exención firmados, correo pidiendo reseña al día
siguiente, avisos por SMS o WhatsApp al dueño, calendario del dueño.

**Preguntar primero el modelo de negocio:** precio, capacidad, cancelación,
qué incluye, punto de recogida, seguro. "Primero el cobro, después las
firmas."

**Trampa vista:** portada de dos tarjetas sin una foto, sin precio y sin
botón de reservar (Van Venture). En experiencias, la foto del viaje es la
venta.

## 11. Catálogo B2B y equipos

**Funciones que llegan:** buscador por equipo, sede y fechas; inventario con
precio por día, semana y mes; "agregar a cotización"; sedes con mapa;
emergencia 24/7.

**Trampa vista:** header de teléfono sin colapsar: aviso, cuatro teléfonos y
el menú entero ocupan la primera pantalla y el H1 empieza a 1.600 px
(Equipment Source).
