# Auditoría de Judo Marketing (judomarketing.net)

**Fecha:** 25 de septiembre de 2026. **Quién:** el mismo proceso que corremos
contra los prospectos (velocidad, SEO técnico, Google, lo que se ve en el
sitio), más lo que a un prospecto no le medimos: índice de Google y Bing,
presencia local y directorios, autoridad, conversión, correo, seguridad,
redes, competencia y una revisión pantalla por pantalla en teléfono y
escritorio.

**Regla del documento:** cada debilidad trae la evidencia, el daño que hace y
la estrategia para volverla fortaleza. Lo que ya se corrigió en el código el
mismo día está marcado **[hecho]**. Lo que depende de Junior está marcado
**[Junior]**.

## Resumen en una pantalla

| Área | Nota | Lo que pesa |
| --- | --- | --- |
| Velocidad en teléfono | **3/10** | Home 34/100, Servicios 46, Portafolio 36, Contacto 37. Las páginas de producto (Juditos 92, JuditoADS 81) demuestran que el sitio puede volar: el problema es el fondo animado, que corre en todas las páginas. |
| SEO técnico | 7/10 | Títulos, descripciones, canónicas, hreflang, sitemap, robots y datos estructurados bien. Faltan favicon de verdad, imagen para compartir en las páginas internas y canónica en /juditos y /juditoads. |
| Google: qué muestra de nosotros | **2/10** | Google todavía enseña el sitio viejo ("A.I & Social Media Marketing Agency", /contact-judo que ya no existe). Bing no nos tiene. Buscar "Judo Marketing Miami" trae clubes de judo. |
| Presencia local (Maps y directorios) | **2/10** | Perfil de Google con dirección de buzón (PMB), que Google no permite. Cero fichas en Clutch, DesignRush, Sortlist, Yelp, BBB, Apple Maps, Bing Places. |
| Autoridad y confianza | **2/10** | Sin reseñas visibles de Google, testimonios sin rostro ni enlace, "Nosotros" sin una persona, portafolio con 5 de 15 sitios en subdominios de prueba, sin casos con números, casi sin enlaces entrantes. |
| Conversión y medición | 4/10 | El formulario abre la app de correo (mailto) en vez de enviar. Sin eventos de conversión en Analytics, sin píxel de Meta. Cuatro botones en el hero y el robot tapando uno en teléfono. |
| Mensaje y contenido | 5/10 | "Construye confianza, Crea valor" es un lema, no una promesa. 6 páginas. Ningún artículo, ninguna página por servicio o por ciudad. |
| Marca y redes | 3/10 | Dos páginas de Facebook (una con 1 me gusta), sin LinkedIn, sin YouTube. judomarketing.com está en venta en manos de otro. |
| Correo | 7/10 | SPF, DKIM y DMARC existen; DMARC en `p=none` no protege. La prospección sale del dominio principal. |
| Seguridad | 6/10 | HTTPS y HSTS bien. Faltan cinco cabeceras estándar. |
| Accesibilidad | 7/10 | 91 a 96 en todas las páginas. Contraste bajo en el pie, botones del robot demasiado pequeños, letras de 10 px en el portafolio en teléfono. |

**La conclusión honesta:** el sitio es mejor que el de la mayoría de los
prospectos a los que les escribimos (ellos no tienen ni canónicas ni datos
estructurados ni cita en línea). Pero Google, Bing, Maps y los directorios no
saben que existimos, y quien llega no encuentra pruebas: ni reseñas de
Google, ni una cara, ni números. Una agencia que vende "que te encuentren"
tiene que ser encontrable primero. Ese es el trabajo de los próximos 90 días.

## 1. Lo que ya está fuerte (para no tocarlo)

- Sitio propio, moderno, en dos idiomas con hreflang correcto por cabecera y
  sitemap; una sola canónica por página; robots y sitemap limpios.
- Datos estructurados ricos: `ProfessionalService` con dirección, teléfono,
  horario de precios, `Offer` por plan, `SoftwareApplication`, `WebSite` y
  `FAQPage` en Servicios.
- Precios públicos y claros (la mayoría de agencias de Miami los esconden),
  garantía de 30 días con devolución, código del cliente al cumplir el año,
  portal propio para cada cliente. Es una oferta distinta; hay que gritarla.
- Cita en línea con Google Meet, WhatsApp, chatbot, formulario, teléfono: seis
  formas de contacto.
- Google Analytics 4 y Search Console conectados y visibles en el portal.
- Correo con SPF, DKIM y DMARC; dominio vigente hasta 2027 en Vercel DNS.
- Una identidad visual con personalidad (la mascota, las ilustraciones de los
  tres servicios).
- Política de servicio completa, consentimiento de SMS listo para 10DLC.

## 2. Hallazgos, con evidencia

### 2.1 Velocidad en teléfono: 34/100 en la portada

Lighthouse 12, móvil simulado, medido el 25 de septiembre:

| Página | Rendimiento | LCP | TBT | Accesibilidad | SEO |
| --- | --- | --- | --- | --- | --- |
| Home (en) | **34** | 7,3 s | 97 s | 91 | 100 |
| Home (es) | 46 | 6,5 s | 105 s | 91 | 100 |
| Servicios | 46 | 6,5 s | 85 s | 91 | 100 |
| Portafolio | 36 | 6,3 s | 105 s | 91 | 100 |
| Contacto | 37 | 6,2 s | 71 s | 92 | 100 |
| Home escritorio | 53 | 1,7 s | 12,6 s | 95 | 100 |
| /juditos | **92** | 3,1 s | 0,05 s | 92 | 100 |
| /juditoads | **81** | 4,8 s | 0,04 s | 96 | 100 |

**Causa, comprobada:** el fondo de líneas de luz (`LightLines`) es un lienzo
a pantalla completa que dibuja 6 a 12 curvas con `shadowBlur` y modo
`lighter` 60 veces por segundo, en todas las páginas y aunque el visitante ya
esté leyendo el pie. La mascota corre otro bucle de animación permanente.
Medido en un teléfono sin acelerar: 47 cuadros por segundo y 6 tareas largas
en 8 segundos en el home; 61 cuadros y cero tareas largas en /juditos, que no
tiene el fondo. Con la CPU lenta que simula Google, ese bucle se come el hilo
principal y el LCP (el párrafo del pie, porque el texto grande del hero es
una animación) llega a los 7 segundos. Nada de esto lo ve un visitante con
un iPhone reciente; lo ve Google, y lo ve cualquier prospecto que nos
audite con la misma herramienta que usamos con él.

Además: Google Tag Manager bloquea 560 ms; el logo del header se sirve a 96
px cuando se muestra a 44 (23 KB de más); la imagen del hero se sirve más
grande de lo que se ve (42 KB de más); faltan `preconnect` a Supabase y a
Google; tres scripts de analítica a la vez (GA4, Vercel Analytics, Speed
Insights); el `<html lang>` está bien y no hay CLS (0 en todas).

**Estrategia:** el fondo solo se anima mientras la primera pantalla está a la
vista y a 30 cuadros en teléfono **[hecho]**; se pausa al hacer scroll, al
cambiar de pestaña y con "reducir movimiento". Preconnect a Supabase y GA
**[hecho]**. Logo del header al tamaño real **[hecho]**. Meta: 85 o más en
móvil en las seis páginas. Después de eso, y solo si hace falta, quitar el
brillo del canvas en teléfono y dejar un solo proveedor de analítica.

### 2.2 Google enseña el sitio viejo

- `site:judomarketing.net` en Google devuelve: "A.I & Social Media Marketing
  Agency | JuDo Marketing" (título del sitio anterior), `/contact-judo`
  (responde 404 hoy) y `/services` con título viejo.
- El fragmento que Google muestra para la marca habla de "asistentes
  virtuales y redes sociales", no de websites por suscripción.
- Bing: buscar "Judo Marketing" Miami FL no devuelve ningún resultado de la
  agencia. Bing alimenta a Copilot, DuckDuckGo y ChatGPT.
- URLs viejas sin redirección: `/contact-judo`, `/about-us`, `/web-design`,
  `/social-media-marketing`, `/ai-marketing`, `/pricing`, `/home`, `/blog`.

**Estrategia:** redirecciones permanentes de las URLs viejas a las nuevas
**[hecho]**; en Search Console, "Inspección de URL → Solicitar indexación"
para las 12 URLs del sitemap y las dos de producto **[Junior, 15 minutos]**;
dar de alta el sitio en Bing Webmaster Tools importando desde Search Console
**[Junior, 5 minutos]**. En dos semanas Google reemplaza el índice viejo.

### 2.3 El nombre compite con un deporte

"Judo Marketing Miami" en Google y en Yelp devuelve clubes de judo: Judo
Miami, Miami Judo Club, Baragua Judo Kai. No tenemos ninguna señal de entidad
que le diga a Google que somos una empresa: ni perfil de LinkedIn, ni fichas
en directorios, ni menciones en prensa, ni Wikipedia/Crunchbase, ni una
página "Nosotros" con una persona.

**Estrategia:** construir la entidad. Siempre el mismo nombre y la misma
descripción corta en todos lados: "Judo Marketing · websites, apps y
publicidad para negocios de Miami". `sameAs` en los datos estructurados
apuntando a LinkedIn, Instagram, Facebook, Crunchbase, Clutch **[hecho para
los que existen]**. Página de LinkedIn de la empresa **[Junior]** y perfil
personal de Junior con el cargo **[Junior]**. Ficha en Crunchbase y en los
directorios de la sección 2.4. Títulos de página que empiecen por lo que
hacemos, no por el nombre, para que Google asocie "Judo Marketing" con
"diseño web Miami" **[hecho en el home]**.

### 2.4 Maps y directorios: invisibles, y con un riesgo

- El Perfil de Empresa de Google existe (enlace en el pie), pero la
  dirección es un buzón (PMB 11674 en 66 W Flagler). Las reglas de Google
  prohíben buzones y oficinas virtuales como dirección de la ficha; una
  revisión puede suspenderla. Lo correcto es marcarla como "negocio de área
  de servicio", ocultar la dirección y declarar el área (Miami-Dade y
  Broward). No pude leer cuántas reseñas tiene: Google no lo entrega sin
  navegador.
- Cero fichas en Clutch, DesignRush, Sortlist, Yelp, BBB, Apple Business
  Connect, Bing Places. Son las fuentes que Google y los modelos de IA usan
  para "mejores agencias en Miami"; nuestros competidores están en todas.
- Datos inconsistentes: Google muestra `info@judomarketing.net`; el sitio
  muestra `admin@judomarketing.net`. Dos páginas de Facebook
  (`/Judomarketi`, con 1 me gusta, y `/JudoMarketing`).

**Estrategia (mes 1):** arreglar la ficha de Google (área de servicio,
categorías "Diseñador de sitios web", "Agencia de marketing", "Servicio de
marketing por internet"; servicios con precio; 10 fotos reales; una
publicación por semana; preguntas y respuestas) **[Junior]**. Elegir un
correo público (`info@` o `admin@`) y usarlo en todo **[Junior decide,
yo cambio el sitio]**. Fusionar o eliminar la página de Facebook sin uso
**[Junior]**. Crear las fichas: Bing Places (importa de Google), Apple
Business Connect, Yelp, BBB, Clutch, DesignRush, Sortlist, Crunchbase, con
el mismo nombre, teléfono, correo y descripción **[Junior, 2 horas; yo
redacto los textos]**.

### 2.5 Confianza: no hay pruebas

- Reseñas: en el sitio hay 4 testimonios fijos ("María G.", "Luis R.",
  "Carolina P.", "Sarah K."), sin foto, sin negocio, sin enlace; dos son de
  Venezuela. No se muestran reseñas de Google. Un prospecto no puede
  verificarlos.
- Nosotros: 260 palabras de filosofía, sin nombre, sin foto, sin años, sin
  cantidad de proyectos, sin certificaciones.
- Portafolio: 15 trabajos, 5 en `vercel.app` o `github.io` y 2 marcados "en
  desarrollo". Se lee como demos. Ningún caso dice qué pasó después: cuántas
  citas, cuántos pedidos, cuánto subió en Maps.
- Enlaces entrantes: los únicos que encuentra la búsqueda son GitHub,
  Facebook e Instagram. El dominio tiene 16 meses.

**Estrategia:** (1) 25 reseñas de Google en 60 días: pedirlas hoy a los 15
clientes del portafolio con el enlace directo de reseña (está en el pie) y un
mensaje de WhatsApp que yo redacto **[Junior envía]**; después, pedirla
automáticamente al mes de cada entrega (lo programo en el portal). (2)
Mostrar las reseñas de Google en vivo en el home con su estrella y su
enlace, y `aggregateRating` en los datos estructurados cuando haya cinco o
más **[yo, cuando existan]**. (3) Nosotros con Junior: foto, dos párrafos
de historia, números reales ("15 websites y 3 apps en tiendas desde 2025",
"2 productos propios"), y un video de un minuto **[Junior manda foto y
video; yo armo la página]**. (4) Tres casos con números: Delivery Rush,
VanVenture y Denali (antes/después de velocidad, puesto en Maps, citas o
pedidos del primer mes) **[yo saco los números con el portal y Search
Console de cada cliente; Junior aprueba]**. (5) Sacar del portafolio o
marcar como "demo" lo que vive en subdominios hasta que tenga dominio.

### 2.6 Conversión: se pierden clientes que ya llegaron

- El formulario de contacto abre la app de correo del visitante (`mailto`).
  En escritorio muchas veces no pasa nada; en teléfono manda al Mail. No
  queda registro, no hay respuesta automática, no hay seguimiento.
- El hero tiene cuatro botones (Hablemos, Ver servicios, Ver portafolio,
  Lanza tu publicidad) y, en teléfono, la burbuja del robot tapa el cuarto.
  Cuatro puertas es ninguna.
- Sin eventos de conversión: Analytics no sabe cuántos agendan, cuántos
  tocan WhatsApp, cuántos llaman, cuántos entran a JuditoADS. Sin píxel de
  Meta no hay públicos para retargeting. Vendemos JuditoADS sin usarlo con
  nosotros mismos.
- Sin captura de correo ni imán de prospectos. Tenemos la herramienta más
  fuerte posible y no está en el sitio: el informe de presencia en línea que
  mandamos a los prospectos.
- Portafolio en teléfono: tres columnas en 390 px; el 67 % del texto queda
  en 10 px (Lighthouse) y los títulos se cortan.

**Estrategia:** formulario que envía al servidor (queda en Supabase, avisa
por correo y responde al visitante en un minuto) **[yo, semana 2]**. Un
solo botón principal en el hero ("Agenda 20 minutos") y uno secundario
("Ver precios"), con una franja de prueba debajo: estrellas de Google,
"15 websites en Miami", "Garantía de 30 días" **[yo, cuando haya
reseñas que mostrar; el texto ya se puede cambiar]**. La burbuja del robot
espera 8 segundos y nunca tapa un botón **[yo]**. Eventos de GA4 (cita
agendada, clic en WhatsApp, llamada, entrada a JuditoADS, chat abierto) y
píxel de Meta con eventos **[yo, semana 2; Junior crea el píxel en Meta y
me da el ID]**. Página `/auditoria`: el visitante pone su dominio y recibe
por correo el PDF que ya generamos para prospectos; es un imán de
prospectos y de enlaces **[yo, semanas 3 y 4]**. Portafolio a una columna
en teléfono **[hecho]**.

### 2.7 Mensaje y contenido: 6 páginas y un lema

- "Construye confianza, Crea valor" no dice qué hacemos ni para quién ni
  dónde. La competencia dice "Diseño de páginas web en Miami desde $299",
  "200 sitios creados", "12 años".
- Ninguna página habla de Miami más allá del pie. Ninguna apunta a las
  búsquedas que la gente hace: "diseño de páginas web Miami", "web design
  Miami", "cuánto cuesta una página web", "app de delivery para
  restaurante", "asistente de WhatsApp para negocio".
- Sin blog ni guías. Las agencias que salen arriba tienen artículos como
  "¿Cuánto cuesta una página web en Miami en 2026?" y los renuevan cada año.
- Lo bueno: la sección de FAQ en Servicios (con datos estructurados) y las
  descripciones cortas de cada servicio.

**Estrategia de contenido (90 días):**

1. Hero nuevo, en los dos idiomas: "Websites por suscripción desde $99 al
   mes para negocios de Miami. Listo en 30 días o te devolvemos el dinero."
   El lema se queda como firma, no como título **[yo redacto; Junior
   aprueba]**.
2. Seis páginas de aterrizaje, una por servicio y búsqueda: diseño de
   páginas web en Miami (es/en), tienda online, página de citas, app de
   delivery propia, asistente de WhatsApp (Juditos), anuncios en Facebook
   sin agencia (JuditoADS). Cada una con precio, tres ejemplos del
   portafolio, FAQ y cita **[yo]**.
3. Páginas por zona solo donde ya hay clientes o prospectos: Doral,
   Hialeah, Kendall, Brickell, Homestead, Fort Lauderdale. Pocas y buenas,
   no cien iguales **[yo, mes 2]**.
4. Un artículo por semana durante 12 semanas, con datos propios de la
   prospección (esa es la ventaja: nadie más audita 300 negocios por
   semana): "Auditamos 300 negocios de Brickell: 7 de cada 10 no tienen
   pedidos en línea", "Cuánto cuesta una página web en Miami en 2026",
   "DoorDash cobra 30 %: cuánto vale una app propia", "Cómo aparecer en
   Google Maps siendo nuevo". Cada uno con una llamada a la auditoría
   gratis **[yo escribo; Junior aprueba en el portal]**.
5. Un video de un minuto por producto (JuditoADS, Juditos, un website de
   cliente) en YouTube, incrustado en su página **[Junior graba con el
   teléfono; yo edito los textos y subtítulos]**.

### 2.8 Marca y redes

- Instagram `@judo.marketing` y dos páginas de Facebook; no pude leer
  seguidores ni frecuencia (Instagram bloquea la lectura automática).
- Sin página de LinkedIn. Los dueños de negocio y los referidos B2B están
  ahí; es el canal más barato para una agencia.
- Sin YouTube de la empresa. Hay un canal personal de Junior (mayo de 2026).
- `judomarketing.com` está registrado por otro desde diciembre de 2024 y en
  venta en Spaceship. Quien lo compre recibe nuestro tráfico por error o
  puede hacerse pasar por nosotros.

**Estrategia:** LinkedIn de empresa hoy y dos publicaciones por semana
(casos, capturas de reseñas, un dato de la prospección) **[Junior; yo
escribo los textos]**. Una sola página de Facebook. YouTube con los tres
videos. Preguntar el precio de judomarketing.com; si está por debajo de lo
que cuesta un cliente, comprarlo y redirigirlo **[Junior decide]**.

### 2.9 Correo y entregabilidad

- SPF `~all` con Google, DKIM (`google`) y DMARC existen. DMARC está en
  `p=none`: solo observa; cualquiera puede mandar correos "de"
  judomarketing.net y llegan.
- La prospección (hasta 20 correos diarios) sale del mismo dominio que los
  contratos y las facturas de clientes.

**Estrategia:** subir DMARC a `p=quarantine; rua=mailto:dmarc@judomarketing.net`
ahora y a `p=reject` en 30 días si los reportes salen limpios **[Junior,
en el DNS de Vercel; yo le doy el registro exacto]**. Comprar un dominio
hermano para prospectar (`judomarketing.co` o `judomarketing.email`),
configurarle SPF, DKIM y DMARC, calentarlo dos semanas y ponerlo en
`LEADS_FROM` **[Junior compra; yo configuro]**.

### 2.10 Seguridad

- Bien: HTTPS forzado, HSTS de dos años, redirecciones de `http` y de
  `judomarketing.net` a `www` con 308, CAA limitando quién emite
  certificados, claves de servicio solo en el servidor.
- Faltaban: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` **[hecho]**. `Content-Security-Policy` queda para
  después porque el sitio carga Stripe, Turnstile, Meta y Google y hay que
  probarla en modo reporte antes de imponerla.
- Recordatorio de sesiones anteriores: rotar el secreto de Turnstile que se
  pegó en un chat y sacar la firma de Junior del repositorio público.

### 2.11 Accesibilidad y detalles de pantalla

- Contraste insuficiente en los títulos del pie ("Navegación", "Contacto",
  "Síguenos") y en el aviso de derechos: `text-judo-fog/40` **[hecho: 60]**.
- Los dos botones de la burbuja del robot miden menos de 24 px de alto
  **[hecho: 36 px]**.
- El logo del header repite el texto "Judo Marketing" en el `alt` junto al
  nombre visible **[hecho: alt vacío]**.
- Favicon: es un JPG (`/brand/logo-black.jpg`); `/favicon.ico` da 404, no
  hay `apple-touch-icon` ni `manifest`. Google puede no mostrar icono en
  los resultados y el iPhone no tiene icono al "añadir a inicio" **[hecho:
  ico, png, apple-touch-icon y manifest generados del logo]**.
- Las páginas internas no tienen imagen para compartir (`og:image`): al
  pegar el enlace de Servicios en WhatsApp no sale vista previa **[hecho:
  imagen por defecto en todas]**.
- `/juditos` y `/juditoads` no tienen canónica ni datos estructurados y
  `/juditos` no tiene imagen para compartir; no estaban en el sitemap
  **[sitemap hecho; el resto es de los chats de JuditoADS y Juditos]**.
- `/juditos` tiene un recurso que responde 404 en consola.
- Las redirecciones `/en/*` son temporales (307); mejor permanentes.

## 3. La competencia, en una tabla

| Quién | Qué muestra que nosotros no | Qué tenemos que ellos no |
| --- | --- | --- |
| HacemosSuWeb (Miami, en español) | "Más de 200 sitios creados", "velocidad 95+ en PageSpeed" en la portada | Precio público y suscripción; portal del cliente; asistente de IA |
| AMD / Agencia Digital Miami | Dominio con la palabra clave, páginas por servicio, blog, reseñas | Producto propio (JuditoADS, Juditos), código para el cliente al año |
| Publitek (Miami) | "Más de 10 años", tienda virtual y SEO como páginas propias | Garantía de 30 días con devolución |
| Thrive (nacional) | Cientos de reseñas, casos con cifras, oficina en Miami | Precio accesible y trato directo con el dueño |
| Worldwide Web Designs ($99 al mes) | Mismo modelo que el nuestro: "sin contrato, cambios ilimitados, cancela cuando quieras, listo en 3 a 4 semanas" | Portal de administración propio, tienda y citas incluidas, dos idiomas, apps |

El último es el que hay que vigilar: vende exactamente nuestro precio con
"sin contrato". Nuestra respuesta no es quitar el contrato sino explicar
qué compra el cliente con él: al cumplir el año, el código es suyo; con
ellos, nunca.

## 4. Plan de 90 días

**Semana 1 (esta):**
- [hecho] Fondo animado solo en la primera pantalla y a 30 cuadros en
  teléfono; preconnect; logo a tamaño; portafolio a una columna en
  teléfono; contraste del pie; botones del robot; favicon e iconos;
  imagen para compartir en todas las páginas; cabeceras de seguridad;
  redirecciones de las URLs viejas; /juditos y /juditoads en el sitemap;
  `sameAs` con las redes.
- [Junior] Search Console: solicitar indexación de las 14 URLs. Bing
  Webmaster Tools: importar desde Search Console.
- [Junior] Perfil de Google: cambiar a área de servicio, categorías,
  servicios con precio, 10 fotos. Pedir reseña a los 15 clientes (mensaje
  listo abajo).
- [Junior] LinkedIn de empresa. Elegir el correo público. Una sola página
  de Facebook. DMARC a `quarantine`.

**Semanas 2 a 4:**
- [yo] Formulario al servidor con respuesta automática; eventos de GA4 y
  píxel de Meta; hero nuevo con franja de prueba; burbuja del robot sin
  tapar botones; reseñas de Google en vivo cuando haya cinco.
- [yo] Nosotros con Junior (con su foto y video); tres casos con números;
  seis páginas de aterrizaje por servicio.
- [yo] `/auditoria`: el informe de presencia en línea como regalo público.
- [Junior] Fichas en Bing Places, Apple, Yelp, BBB, Clutch, DesignRush,
  Sortlist, Crunchbase (textos míos). Foto y video de un minuto.

**Mes 2:**
- [yo] Un artículo por semana con datos de la prospección; páginas por
  zona donde ya hay clientes; YouTube con tres videos incrustados.
- [Junior] Dominio hermano para prospectar; comprar judomarketing.com si
  vale la pena; DMARC a `reject`.
- [yo] Campaña de retargeting con JuditoADS a quien visitó precios y no
  agendó (nuestro propio caso de éxito).

**Mes 3:** medir y ajustar. Metas al día 90:

| Métrica | Hoy | Meta |
| --- | --- | --- |
| Lighthouse móvil, home | 34 | 85 o más en las seis páginas |
| URLs indexadas por Google | 12 (y viejas) | 40, todas nuevas |
| Clics desde Google al mes (Search Console) | casi cero | 300 |
| "diseño web Miami" / "web design Miami" | fuera del top 100 | top 20 |
| Reseñas en Google | ? | 25, promedio 4,9 |
| Fichas en directorios | 0 | 8 |
| Citas agendadas desde el sitio al mes | sin medir | 15, medidas en GA4 |
| Seguidores de LinkedIn de empresa | 0 | 300 |

## 5. Lo que no pude medir desde aquí

- Cuántas reseñas y qué nota tiene el Perfil de Google (Google no lo da sin
  navegador). Se ve entrando al perfil.
- Seguidores y frecuencia de Instagram y Facebook.
- Clics e impresiones reales de Search Console (están en la pestaña Google
  del portal).
- Enlaces entrantes con una herramienta como Ahrefs o Semrush (no tenemos
  cuenta). La búsqueda pública solo encuentra tres.
- Datos de campo de Core Web Vitals (Google todavía no tiene suficientes
  visitas para mostrarlos, lo que confirma el problema de tráfico).

## 6. Textos listos para usar

**Mensaje de WhatsApp para pedir la reseña (a los 15 clientes):**

> Hola, [nombre]. Soy Junior, de Judo Marketing. Estamos poniendo nuestra
> casa en orden en Google y tu opinión es la que más pesa. ¿Me regalas una
> reseña de dos líneas sobre cómo te ha ido con tu website? Este es el
> enlace directo, toma un minuto: https://g.page/r/[código]/review
> Gracias por confiar en nosotros.

(El enlace corto se saca del Perfil de Google → "Pedir reseñas".)

**Descripción única para todos los directorios (es):**

> Judo Marketing es una agencia de Miami que construye websites, tiendas
> online, páginas de citas y apps para negocios pequeños y medianos, por
> suscripción desde $99 al mes y con el código del cliente al cumplir el
> año. Incluye JuditoADS, para lanzar anuncios en Facebook e Instagram sin
> agencia, y Juditos, asistentes de inteligencia artificial que atienden por
> WhatsApp. En español e inglés. 66 W Flagler St, Miami, FL 33130 ·
> +1 305 934 9981.

**Descripción única (en):**

> Judo Marketing is a Miami agency that builds websites, online stores,
> booking pages and mobile apps for small and mid-size businesses on a
> subscription from $99 a month, with the client owning the code after one
> year. It includes JuditoADS, to launch Facebook and Instagram ads without
> an agency, and Juditos, AI assistants that answer on WhatsApp. English
> and Spanish. 66 W Flagler St, Miami, FL 33130 · +1 305 934 9981.

**Registro DMARC (para el DNS de Vercel, host `_dmarc`):**

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@judomarketing.net; pct=100; adkim=s; aspf=s
```

(`dmarc@judomarketing.net` tiene que existir como alias en Google Workspace
para recibir los reportes.)
