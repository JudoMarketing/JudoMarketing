# Prospección por correo

Cada lunes, miércoles y viernes una sesión automática busca negocios de
Miami y Broward que pueden necesitar un website, una app o un sistema,
estudia lo que tienen en línea, elige hasta 20 y les escribe un correo
personal firmado por Junior con dos botones: agendar una llamada y ver el
showcase. Los que no se pueden contactar por correo salen en una lista para
llamar, escribir por WhatsApp o mandar carta.

El objetivo son los negocios chicos y medianos con un sistema flojo o sin
sistema: los que Google todavía no conoce, los que solo tienen Facebook, los
que dependen del teléfono o de las apps de delivery, los que llevan años
operando con una página de plantilla. No los que ya tienen todo resuelto.

## De dónde salen los negocios

Tres fuentes, que se complementan:

| Fuente | Qué trae | Quién lo hace |
| --- | --- | --- |
| **Google Places** (`buscar.mjs`) | Hasta 100 negocios establecidos de un código postal, con website y teléfono. Es la fuente de los que llevan tiempo operando y ya tienen clientes. | Script |
| **Sunbiz** (`sunbiz.mjs`) | Todas las empresas registradas en Florida, por archivo diario: las de esta semana (recién abiertas) y las de hace 2 y 3 años (con tiempo operando). Se cruzan con Google para saber si existen en línea. | Script |
| **Internet** | Para los candidatos buenos sin correo: buscar en la web el negocio o su dueño (Facebook, Instagram, Yelp, directorios) para encontrar correo o WhatsApp, y para entender mejor qué hacen. | La sesión, con su herramienta de búsqueda web |

Sunbiz no publica correos ni teléfonos: da el nombre del negocio, su
dirección, quién lo registró y a dónde le llega el correo postal. Por eso
cada registro se busca en Google por nombre: si tiene website se estudia
como cualquier otro; si tiene perfil sin website queda con teléfono; si no
existe en Google queda como **sin presencia**, que es el cliente ideal y el
más difícil de contactar. Esos van en el informe con el nombre de la persona
y la dirección postal.

Los negocios recién registrados llegan con la señal `registrado_hace_dias`;
los de hace años, con `registrado_hace_2_años` o `_3_años`. Un negocio con
tres años y sin website no es un descuido: es alguien que factura sin sistema
y ya sabe lo que le cuesta.

Este documento es tres cosas: el manual de Junior, la guía que sigue la
sesión automática para elegir y escribir, y el registro de por qué está
montado así.

## Cómo está montado

```
Sesión automática (Claude Code, cada 2 días)      judomarketing.net (Vercel)
────────────────────────────────────────────      ──────────────────────────
1. buscar.mjs  ── pide negocios del zip ────────▶  /api/leads {buscar}   ──▶ Google Places
               ◀─ 100 candidatos ───────────────
2.             visita cada website (correo, señales, resumen)
3.             ── guarda lo investigado ────────▶  /api/leads {guardar}  ──▶ Supabase (leads)
4. la sesión elige 20 y escribe 20 borradores
5. enviar.mjs  ── manda los borradores ─────────▶  /api/leads {enviar}   ──▶ SMTP de Google Workspace
                                                   candados: baja, 120 días, tope diario, modo prueba
6.             ── registra la corrida ──────────▶  /api/leads {corrida}  ──▶ Supabase (leads_corridas)

El dueño del negocio hace clic en "no más correos" ──▶ /api/leads/baja ──▶ estado 'baja' para siempre
```

Por qué así y no de otra forma:

- **La sesión no tiene SMTP ni base de datos.** Desde la nube de Claude no
  se abren los puertos de correo, y no queremos la llave de Supabase en más
  sitios de los necesarios. La sesión conoce un solo secreto (`LEADS_SECRET`)
  y el sitio hace todo lo demás con las llaves que ya tiene.
- **Los datos de prospectos viven en Supabase, no en el repo.** El repo es
  público. Una lista de negocios con correos en un repo público es un regalo
  para la competencia y un problema de privacidad.
- **El sitio decide si un correo sale.** Los candados (baja, repetición,
  tope) están en el servidor, no en la sesión, para que ningún error de
  redacción pueda saltárselos.

## Lo que hace cada corrida

1. `git pull` de `master`, leer este documento completo.
2. `node scripts/leads/buscar.mjs --zip auto --salida <carpeta temporal>/leads.json`.
   Elige el siguiente zip de `scripts/leads/zips.json` (el primero que no se
   corrió en 60 días), pide los negocios a Google, visita sus websites y
   guarda todo.
3. `node scripts/leads/sunbiz.mjs --salida <carpeta temporal>/sunbiz.json`.
   Baja los archivos diarios de Sunbiz que falten (los nuevos y los de hace
   2 y 3 años), filtra nuestra zona y los nombres que dicen a qué se dedica
   el negocio, los cruza con Google y guarda todo.
4. Leer los dos JSON. Traen `candidatos_para_escribir` (con correo, por
   puntaje), `para_llamar_o_whatsapp` / `con_google_sin_website` (teléfono
   sin correo), `sin_presencia` (solo Sunbiz: persona y dirección postal) y
   `sin_verificar` (Sunbiz: no se pudo preguntar a Google; no cuentan como
   sin presencia).
5. **Buscar en internet** los mejores candidatos sin correo (hasta 15 por
   corrida): el nombre del negocio con la ciudad, el nombre de la persona con
   el negocio, `site:facebook.com` o `site:instagram.com` con el nombre. Si
   aparece un correo del negocio, guardarlo con
   `POST /api/leads {accion:"actualizar", lead_id, email}` y ya cuenta como
   candidato. Si aparece un WhatsApp o una página de Facebook, anotarlo con
   `notas` para el informe. Solo correos que claramente son del negocio;
   nunca correos personales de terceros ni direcciones adivinadas.
6. Elegir hasta 20 según los criterios de abajo.
7. **Informe de presencia en línea** para los elegidos que tienen website:
   `node scripts/leads/informe.mjs --leads <carpeta>/leads.json,<carpeta>/sunbiz.json --ids <ids separados por coma> --salida <carpeta>/informes`.
   Genera un PDF de una página por negocio con datos públicos y reales:
   velocidad y SEO técnico según PageSpeed de Google, puesto en Google Maps
   para dos búsquedas de su zona y quiénes van delante (con sus reseñas),
   puesto en la búsqueda web (si está configurado), y lo que se ve en su
   propio sitio (título, descripción, celular, candado, datos estructurados,
   sitemap, botón de llamada, redes, pedidos en línea, antigüedad del
   dominio). Cierra con tres recomendaciones y el regalo del Perfil de
   Empresa de Google. Deja `informes.json` con los números de cada uno.
   Lo que no se pudo medir sale como "no disponible"; nunca se inventa. Si
   `informes.json` trae `avisos` (PageSpeed sin llave, por ejemplo), el
   correo no cita ese dato. Si trae `apto: false`, ese negocio no se
   escribe: se descarta con `{accion:"descartar"}` y el `motivo_no_apto`.
8. Escribir un borrador por cada uno, en un JSON con el formato de
   `scripts/leads/enviar.mjs`. En los que llevan informe, `adjunto_pdf` es la
   ruta del PDF.
9. `node scripts/leads/enviar.mjs --borradores <carpeta temporal>/borradores.json`.
   Si el script rechaza un borrador (raya larga, promesa, largo), corregirlo
   y volver a correr. No se manda nada hasta que todos pasen.
10. Terminar con un informe corto para Junior: zip y zona; archivos de Sunbiz
   procesados; cuántos negocios por fuente, cuántos con correo, cuántos
   enviados y en qué modo; los enviados con una línea de por qué cada uno; la
   lista de negocios con teléfono y sin correo (para llamar o WhatsApp); y la
   lista de negocios sin presencia en línea con la persona al frente y su
   dirección postal (para carta o para buscarlos a mano).

## Cómo se elige a quién escribir

Se escribe a quien tiene un problema que nosotros resolvemos y se nota
desde fuera. El puntaje del JSON ayuda, pero la decisión la toma la sesión
leyendo `senales` y `resumen_sitio`.

Señales fuertes (casi siempre se escribe):

- `website_caido_*`, `website_responde_4xx/5xx`, `en_construccion`: paga un
  dominio y no tiene nada. Se le ofrece tenerlo vivo en semanas.
- `website_es_red_social`: su "website" es Facebook o Instagram. No lo
  encuentran en Google y no controla nada.
- `comida_sin_pedidos_ni_reservas_en_linea`: restaurante que depende de las
  apps de delivery (15 a 30 por ciento de comisión) o del teléfono.
- `servicio_sin_citas_en_linea`: taller, salón, clínica o contratista al que
  hay que llamar en horario para pedir cita.
- `tienda_sin_venta_en_linea`: tienda con catálogo pero sin carrito.
- `constructor_basico` junto con `no_se_adapta_a_celular` o `copyright_20xx`
  viejo: página de plantilla abandonada.

Señales de contexto (no deciden solas): `sin_https`, `titulo_generico`,
`casi_sin_contenido`, `sin_whatsapp`.

Señales de Sunbiz:

- `sin_presencia_en_google` con `registrado_hace_2_años` o `_3_años`: lleva
  años facturando sin existir en internet. Si se le encuentra correo o
  WhatsApp buscando en la web, es el primero de la lista.
- `sin_presencia_en_google` con `registrado_hace_dias`: acaba de abrir. Vale
  escribirle solo si el nombre deja claro el rubro y se encontró un contacto
  del negocio; el correo habla de arrancar bien, no de arreglar nada.
- `sin_website` (tiene perfil de Google, no website): buen candidato; el
  correo se apoya en lo que dice su perfil (reseñas, rubro, zona).

No se escribe a:

- **Quien ya tiene infraestructura.** Es la regla que más importa: no se
  gasta tiempo ni dinero en negocios que ya tienen plataforma de membresías,
  reservas, pedidos o gestión (Mindbody, Glofox, Vagaro, Booksy, Toast,
  ChowNow, Shopify, Zocdoc, Clio, Jobber y las demás que detecta
  `buscar.mjs`, señal `ya_tiene_plataforma`), ni en los que venden,
  cobran membresías o reservan desde su propia página (señal
  `ya_tiene_sistema`: dos o más rutas propias de membresía, tienda,
  reservas, pedidos o portal), ni en los gigantes de su zona (más de 800
  reseñas, `muy_establecido`). Los scripts los sacan de
  `candidatos_para_escribir` y los dejan en `ya_equipados`; el informe los
  marca `apto: false`. Nunca se les escribe, aunque a su página le falte
  algo. Comprobado con casos reales: Gallo 8 Gym (membresías y tienda
  propias) y La Carreta (pedidos por Toast) quedan fuera.
- Negocios que salen entre los tres primeros de Maps con página rápida y sin
  fallos graves: `apto: false` en `informes.json`. Están bien; que
  Gallo 8 Gym sea el número uno de Little Havana con 146 reseñas y un sitio
  de 94 puntos no es una oportunidad, es un cliente de otro.
- Cadenas, franquicias, gobierno, iglesias, escuelas públicas, hospitales,
  bancos (el sitio ya filtra la mayoría; si uno se cuela, se descarta).
- Negocios con website propio, moderno, con pedidos o citas en línea y sin
  ninguna señal. Ya tienen quien se lo haga.
- Correos que son de una agencia de diseño o marketing (el dominio del correo
  no es el del negocio y dice "design", "media", "agency", "marketing").
- Nadie con `estado` distinto de `nuevo`.

Reglas de mezcla: máximo 5 del mismo rubro en una corrida, y si hay menos de
20 que valgan la pena, se mandan menos. Veinte malos hacen más daño que
ocho buenos: cada correo que ignoran baja la reputación del dominio.

Lo que no se elige se puede dejar en `nuevo` (vuelve a aparecer en otra
pasada) o marcar como `descartado` con motivo cuando está claro que nunca
va a ser cliente (`/api/leads {accion:"descartar"}`).

## Cómo se escribe el correo

Un correo de Junior a un dueño de negocio. No un boletín, no una plantilla
con el nombre pegado. La prueba: si se lee en voz alta suena como algo que
una persona escribiría a otra en diez minutos.

**Idioma:** el del website del negocio (`idioma`). Si no se pudo saber, inglés.

**Asunto:** entre 4 y 8 palabras, en minúsculas naturales, que nombre al
negocio o la cosa concreta que vimos. Nada de signos de exclamación,
mayúsculas, "gratis", "oferta", "última oportunidad".
Bien: `los pedidos de La Carreta, sin comisión` · `una pregunta sobre Brickell Auto Care` · `Rincón Bakery y los pedidos por WhatsApp`.
Mal: `¡Haz crecer tu negocio HOY!` · `Propuesta de servicios de marketing digital`.

**Saludo:** `Hola, equipo de {negocio}.` o `Hi, {negocio} team.` Si el
resumen del sitio dice el nombre del dueño, se usa: `Hola, Carlos.`

**Cuerpo: entre 60 y 110 palabras, en dos o tres párrafos cortos.** Corto,
humano y directo. Se ataca el dolor y se vende la solución; nada más.

1. *El dolor, de entrada.* Una o dos frases con el hecho concreto que vimos
   y lo que le cuesta. Sin "espero que estés bien", sin presentarse antes
   del problema. "Cada pedido que te entra por DoorDash deja 15 a 30 por
   ciento en la app, y tu página no tiene pedidos propios."
2. *La solución, en dos frases.* "Soy Junior, de Judo Marketing, en Miami."
   y lo que le haríamos, concreto y en sus palabras: la página donde el
   cliente pide y paga directo, la agenda en línea, el panel. Si va
   informe, una frase: "Te adjunto una página con lo que Google ve hoy de
   tu negocio."
3. *El cierre, en una frase o dos.* Pedir 20 minutos esta semana. Que para
   los primeros 100 clientes el precio es accesible y que al contratar le
   configuramos su Perfil de Empresa de Google sin costo.

**PS (opcional, una línea):** `WhatsApp +1 305 934 9981.`

**Cuando lleva informe adjunto:** el dolor del párrafo 1 sale de
`informes.json` con uno o dos números, los que más duelen y sean ciertos
(puesto en Maps, segundos de carga en celular, reseñas frente a los tres
primeros). Nunca un dato marcado como no disponible.

**Lo que ofrece Judo Marketing, por rubro** (para elegir la solución, no para
listarla en el correo; en el correo va una sola):

| Rubro | Problema típico | Lo que ofrecemos |
| --- | --- | --- |
| Restaurantes, cafeterías, panaderías | Comisión de las apps de delivery; reservas por teléfono; menú en PDF | Pedidos y reservas en su propia página, menú vivo, panel de pedidos, app propia de delivery sin comisión |
| Talleres, reparaciones, contratistas, plomeros, electricistas | Citas y presupuestos por llamada; se pierden trabajos fuera de horario | Citas en línea, solicitud de presupuesto con fotos, recordatorios por texto, asistente que contesta de noche |
| Salones, barberías, spas, estética | Agenda en papel o en una app que cobra por cita; no-shows | Reservas con depósito, recordatorios, panel de la semana, fidelización |
| Clínicas, dentistas, terapias | Teléfono ocupado; formularios en papel; recordatorios a mano | Citas en línea, formularios de ingreso digitales, recordatorios, portal del paciente |
| Tiendas, boutiques, ferreterías | Venden solo en local o por Instagram; inventario a mano | Tienda en línea con inventario, pagos, envíos y punto de venta conectado |
| Almacenes, mayoristas, distribuidores | Pedidos por WhatsApp y Excel; nadie sabe qué hay en stock | Portal B2B de pedidos, control de inventario, facturación y contabilidad conectada |
| Gimnasios, academias, tutorías | Cobros mensuales a mano; clases por mensaje | Membresías con cobro automático, horarios, clases virtuales, app para alumnos |
| Inmobiliarias, seguros, contadores, abogados | Los prospectos llegan por llamada y se pierden | Formulario de ingreso que califica, agenda, portal del cliente con sus documentos, seguimiento automático |
| Mudanzas, limpieza, jardinería, transporte | Cotizar toma horas; rutas y cuadrillas en papel | Cotizador en línea, agenda de cuadrillas, seguimiento del servicio, cobro al terminar |
| Cualquiera sin website o con Facebook como website | No aparece en Google; no controla nada | Website propio, con su Perfil de Empresa de Google conectado y panel de administración |

Además, para cualquiera: JuditoADS (sus anuncios en Facebook e Instagram,
lanzados por ellos mismos, 14 días gratis) y los Juditos (asistente de IA
que atiende por WhatsApp, Messenger e Instagram). Se mencionan solo cuando
encajan con el problema que vimos, nunca como lista.

**Lo que nunca va en un correo:**

- Raya larga. Ninguna. Se escribe con comas y puntos. `enviar.mjs` rechaza
  el borrador si la encuentra.
- Promesas de resultados: "garantizamos", "primer lugar en Google", "vas a
  vender el doble". Podemos decir a qué apuntamos, no lo que va a pasar.
- Precios con cifras. Los precios están en el sitio; en el correo solo va la
  frase de los primeros 100 clientes.
- Nada que no hayamos visto. Ni "sé que les está yendo mal" ni "vi sus malas
  reseñas". Si el negocio tiene buenas reseñas, se dice, porque es la mejor
  razón para tener mejor presencia.
- Palabras de agencia: SEO, ROI, embudo, sinergia, transformación digital,
  posicionamiento, branding. Se dice "que Google los encuentre", "que el
  cliente pida sin llamar", "que ustedes vean todo desde un panel".
- Frases de plantilla: "espero que este correo te encuentre bien", "me
  pongo en contacto contigo", "no dudes en", "quedo atento".
- Listas con viñetas, emojis, mayúsculas para gritar, más de un signo de
  exclamación en todo el correo.
- Enlaces dentro de los párrafos. Los dos botones ya llevan los enlaces.
- La firma. La plantilla la pone.

**Variedad:** en una corrida de 20, no se repite la primera frase, y se
alternan las tres aperturas: pregunta ("¿los pedidos les llegan por...?"),
observación ("vi que su página...") y contexto ("estuve mirando talleres
de Doral y...").

**Ejemplo en español (restaurante sin pedidos en línea):**

> Asunto: los pedidos de La Esquina, sin comisión
>
> Hola, equipo de La Esquina.
>
> Cada pedido que les entra por DoorDash deja entre 15 y 30 por ciento en la app, y su página no tiene pedidos propios. Hoy no hay otra puerta.
>
> Soy Junior, de Judo Marketing, en Miami. Les montamos una página donde el cliente pide y paga directo, con el menú vivo y un panel para controlarlo todo. Ya lo hicimos para otros restaurantes de la ciudad.
>
> ¿Me dan 20 minutos esta semana? Para nuestros primeros 100 clientes el precio es accesible, y al contratar les configuramos su Perfil de Empresa de Google sin costo.
>
> PS: WhatsApp +1 305 934 9981.

**Ejemplo en inglés (bufete con informe adjunto, datos reales):**

> Subject: NERO Immigration Law isn't on Maps
>
> Hi, NERO Immigration Law team.
>
> Search "lawyer Little Havana" on Google Maps and you're not in the top 20. Your site takes 6.7 seconds to load on a phone. With a 4.8 rating, those are clients going to firms with worse reviews than yours.
>
> I'm Junior, from Judo Marketing in Miami. We'd build you a fast site with online intake and scheduling, and fix what keeps you off Maps. The one page report attached shows what Google sees today.
>
> Can I get 20 minutes this week? For our first 100 clients pricing is accessible, and we set up your Google Business Profile at no cost when you sign up.
>
> PS: WhatsApp +1 305 934 9981.

**Ejemplo en español (negocio de Sunbiz con años operando, sin website, correo hallado en su Facebook):**

> Asunto: Family Circle Cleaning no aparece en Google
>
> Hola, Mirna.
>
> Family Circle Cleaning lleva dos años registrada y no existe en Google ni tiene página. Quien busca "limpieza en Weston" encuentra a otra empresa, y cada cliente nuevo les llega solo por recomendación.
>
> Soy Junior, de Judo Marketing, en Miami. Les hacemos una página que aparece en Google, con cotización y reserva en línea y un panel donde ven la semana de la cuadrilla.
>
> ¿Tienes 20 minutos esta semana? Para nuestros primeros 100 clientes el precio es accesible, y al contratar te configuramos tu Perfil de Empresa de Google sin costo.
>
> PS: WhatsApp +1 305 934 9981.

## Formato del archivo de borradores

```json
{
  "zip": "33135",
  "encontrados": 100,
  "con_correo": 38,
  "resumen": "Little Havana: muchos restaurantes con menú en PDF y sin pedidos en línea. 20 elegidos, 12 comida, 5 servicios, 3 tiendas.",
  "borradores": [
    {
      "lead_id": "uuid del JSON de buscar.mjs",
      "idioma": "es",
      "rubro": "restaurante",
      "asunto": "los pedidos de La Carreta, sin comisión",
      "saludo": "Hola, equipo de La Carreta.",
      "parrafos": ["...", "...", "..."],
      "ps": "Si prefieren WhatsApp, escríbanme al +1 305 934 9981.",
      "adjunto_pdf": "/carpeta/informes/informe-la-carreta.pdf"
    }
  ]
}
```

## El informe de presencia en línea

Una página, PDF, con la marca. Lo genera `scripts/leads/informe.mjs` para
cada negocio elegido que tiene website, y va adjunto al correo. Lo que
muestra, y de dónde sale cada dato:

| Bloque | Datos | Fuente |
| --- | --- | --- |
| Cuatro tarjetas | Velocidad en celular (0 a 100), SEO técnico (0 a 100), puesto en Google Maps, reseñas | PageSpeed Insights y Google Places |
| Cómo te encuentran | Puesto para dos búsquedas de su zona (por rubro y zip, por rubro y barrio), los tres primeros con sus reseñas frente al negocio, puesto en la búsqueda web si hay buscador configurado | Google Places y Custom Search |
| Tu página web | LCP, CLS, TBT, antigüedad del dominio y doce chequeos con ✓ o ✗ (título, descripción, encabezado, celular, candado, imágenes descritas, datos estructurados, sitemap, robots, llamada o WhatsApp, redes, pedidos en línea) | PageSpeed, el propio sitio, RDAP |
| Lo primero que haríamos | Tres recomendaciones generadas por reglas a partir de lo anterior | Reglas en `informe.mjs` |
| Regalo | Perfil de Empresa de Google configurado y optimizado sin costo al contratar cualquier servicio | Texto fijo |

Reglas: nada se inventa; lo que no se midió dice "no disponible". Los
puestos en Google se presentan como lo que son: el orden que Google
devuelve para esa búsqueda desde un servidor, que varía según desde dónde
busque cada persona. El pie del informe lo dice.

Google Business Profile como regalo: es la promesa que hacemos en el
correo y en el PDF. Al cerrar un cliente, lo primero que se entrega es el
perfil (categorías, fotos, horarios, servicios, publicaciones y respuesta
a reseñas), sin cargo aparte.

## Candados y ley

Correo comercial a negocios en Estados Unidos: aplica CAN-SPAM (federal) y
la ley de Florida de correo electrónico comercial, que dice lo mismo. Lo que
exigen y cómo lo cumplimos:

| Exigencia | Cómo se cumple |
| --- | --- |
| Remitente y asunto honestos | Sale como Junior Osorio, Judo Marketing; el asunto habla de lo que dice el correo |
| Dirección postal física | Va en el pie de cada correo |
| Forma clara de darse de baja | Enlace firmado en el pie, un clic, sin formulario, más cabecera `List-Unsubscribe` para el botón de Gmail y Yahoo |
| Honrar la baja en 10 días hábiles | Es inmediata: el lead queda `baja` y el servidor nunca vuelve a enviarle |
| Saber quién hizo clic | Los dos botones pasan por `/api/leads/clic` con el id del negocio firmado; el clic se anota en el lead y se redirige a la página real |
| Decir por qué recibe el correo | El pie dice que su negocio aparece en Google en esa zona |

Candados propios, en el servidor:

- Tope de 20 correos reales por día (`LEADS_MAX_DIA`).
- Copia oculta de cada correo que sale a `LEADS_COPIA`
  (admin@judomarketing.net): Junior ve exactamente lo que recibió cada
  negocio, con su PDF, para auditar.
- **Sin recontacto, nunca.** Un negocio recibe un solo correo en su vida.
  Ni seguimiento, ni segundo intento, ni aunque cambie de zip. Si contesta,
  la conversación la sigue Junior a mano.
- Nunca a `baja`, `rebotado`, `respondio`, `cliente` ni `descartado`.
- Modo prueba por defecto: hasta que `LEADS_MODO=real`, todo va al correo de
  prueba con el destinatario real en el asunto.

## Configuración (lo que hace Junior una sola vez)

1. **Supabase:** SQL Editor → pegar `supabase/migrations/0027_leads.sql` → Run.
2. **Google Cloud** (el mismo proyecto de la cuenta de servicio): APIs y
   servicios → Biblioteca → habilitar **"Places API (New)"** y **"PageSpeed
   Insights API"**. Credenciales → Crear credencial → Clave de API →
   restringirla a esas dos APIs. PageSpeed es gratis (25.000 consultas al
   día); Places cobra por consulta después del nivel gratuito.

   Opcional, para que el informe diga en qué puesto sale la página en la
   búsqueda web de Google (no solo en Maps): en
   programmablesearchengine.google.com crear un buscador que busque en
   **toda la web**, copiar su ID (`cx`), habilitar "Custom Search API" en la
   misma clave, y poner `GOOGLE_CSE_ID` en Vercel. 100 consultas gratis al
   día; cada informe usa una o dos. Sin esto, el informe omite esa línea.
3. **Vercel** → judo-marketing → Settings → Environment Variables, solo en
   Production:
   - `LEADS_SECRET`: 32 caracteres aleatorios (`openssl rand -base64 32`).
   - `GOOGLE_PLACES_API_KEY`: la clave del paso 2 (sirve también para
     PageSpeed; si se prefiere una clave aparte, `GOOGLE_PAGESPEED_API_KEY`).
   - `GOOGLE_CSE_ID` (opcional): el ID del buscador programable.
   - `LEADS_MODO`: `prueba`.
   - `LEADS_CORREO_PRUEBA`: el correo donde Junior quiere ver las pruebas.
   - `LEADS_FROM` (opcional): `"Junior Osorio" <junior@judomarketing.net>` si
     se crea ese alias en Google Workspace y se agrega en Gmail como "Send
     mail as" de la cuenta `SMTP_USER`. Sin esta variable sale como
     `"Junior Osorio, Judo Marketing" <info@judomarketing.net>`, que ya funciona.
   - `LEADS_REPLY_TO` (opcional): a dónde llegan las respuestas. Por defecto
     `admin@judomarketing.net`.
   Después: Deployments → Redeploy del último de producción, para que las
   variables entren.
4. **Claude Code** → Settings → Environments → el entorno de JudoMarketing →
   variables de entorno: `LEADS_SECRET` con el mismo valor que en Vercel.
5. **La rutina** ("Prospección por correo") ya existe en Claude Code,
   apagada. Cuando los pasos 1 a 4 estén, encenderla. Corre lunes, miércoles
   y viernes a las 10 de la mañana de Miami y manda un aviso al terminar.

Sunbiz no necesita configuración: el usuario público lo publica el propio
Estado en su página de descargas y va en `scripts/leads/sunbiz.mjs`. Si el
Estado lo cambia, se pone el nuevo en `SUNBIZ_USER` y `SUNBIZ_PASS`.

Comprobación antes de encender: con `LEADS_SECRET` exportado en una terminal,

```bash
npm ci
node scripts/leads/buscar.mjs --zip 33130 --salida /tmp/leads.json
node scripts/leads/sunbiz.mjs --sin-api --nuevos 1
node scripts/leads/informe.mjs --url https://www.judomarketing.net --nombre "Judo Marketing" --zip 33130 --salida /tmp/informes
```

El último genera un PDF del propio sitio de Judo con PageSpeed y Maps de
verdad: si sale con los cuatro números arriba, todo está conectado.

tiene que terminar con "Listo. N encontrados...". Si dice "falta aplicar la
migración" es el paso 1; si Places responde 403 o "API key not valid" es el
paso 2; si responde 401 es que el secreto no coincide entre Vercel y la
terminal.

## De prueba a real

Las dos primeras corridas se dejan en modo prueba: Junior recibe los 20
correos en su bandeja tal como los recibiría el negocio, con el destinatario
real en el asunto. Se lee cada uno con la pregunta "¿esto lo mandaría yo?".
Lo que no guste se corrige en este documento, en la sección de escritura, y
la siguiente corrida ya sale distinta. Cuando dos corridas seguidas salgan
bien, `LEADS_MODO=real` en Vercel y Redeploy.

## Auditoría: bajas, clics y respuestas

`GET /api/leads?reporte=1` (con el secreto) devuelve, y opcionalmente
desde una fecha (`&desde=2026-09-21`):

- `enviados`: cuántos salieron y por día.
- `bajas`: quién pidió no recibir más correos, con fecha.
- `clics`: quién hizo clic en "Agenda una llamada" o "Ver nuestro trabajo",
  cuántas veces y cuándo.
- `respondieron`: los marcados a mano como `respondio` o `cliente`.
- `rebotados`: cuántos correos no existían.

Cada corrida automática lo incluye al final de su informe (desde la
corrida anterior), y Junior puede pedirlo en el chat cuando quiera.
Además, cada correo que sale llega en copia oculta a `LEADS_COPIA`.

## Qué mirar cada semana

- **Respuestas** en el buzón de `LEADS_REPLY_TO`. Cada respuesta se contesta
  a mano y el lead se marca en Supabase: `estado = 'respondio'` (y `cliente`
  si contrata). Así nunca recibe otro correo automático.
- **Rebotes** ("address not found"): marcar `rebotado`. Más de 3 en una
  corrida de 20 significa que el rastreo de correos está trayendo basura y
  hay que revisar `CORREOS_BASURA` en `buscar.mjs`.
- **Bajas**: normal una o dos por cada 100. Más de 5 por 100 significa que
  el correo suena a spam y hay que releer la guía de escritura.
- **Citas agendadas** desde el enlace del correo: en Google Analytics, el
  tráfico con `utm_campaign=zip-XXXXX` dice qué zona responde.

## Entregabilidad

- Volumen: 20 por corrida, 3 corridas por semana, 60 a la semana. No subirlo
  las primeras 8 semanas. Google Workspace tolera esto sin problema; lo que
  quema un dominio no es el volumen, es que la gente marque spam.
- El dominio ya tiene SPF, DKIM (selector `google`) y DMARC. El DMARC está
  en `p=none`: sirve para que Google no rechace, pero no protege contra
  suplantación. Cuando lleve un mes sin problemas, subirlo a `p=quarantine`.
- Si algún día se pasa de 100 a la semana, mover la prospección a un dominio
  aparte (por ejemplo `judomarketing.co`) para que un mal día de prospección
  nunca afecte los correos de clientes y contratos de `judomarketing.net`.

## La instrucción que recibe la sesión automática

Es el texto de la rutina en Claude Code. Si se cambia aquí, hay que
cambiarlo también en la rutina (Settings → Routines).

> Eres la sesión de prospección por correo de Judo Marketing. Trabajas solo,
> sin nadie mirando, y al final dejas un informe. Regla número uno: solo se
> escribe a negocios que nos necesitan; nunca a quien ya tiene
> infraestructura (`ya_equipados`, `apto: false`), ni a los gigantes de su
> zona, ni a quien está arriba en Maps con página rápida y sin fallos
> graves. Pasos: (1) `git pull` en
> `master` y lee completo `docs/LEADS.md`; todo lo que hagas sigue ese
> documento. (2) Corre `node scripts/leads/buscar.mjs --zip auto --salida
> <tu carpeta temporal>/leads.json` y después `node scripts/leads/sunbiz.mjs
> --salida <tu carpeta temporal>/sunbiz.json`. Si uno falla, no improvises:
> sigue con el otro y el informe dice qué falló y qué paso de configuración
> falta. (3) Lee los dos JSON. Para los mejores candidatos sin correo (hasta
> 15), busca en internet el negocio o la persona al frente; si encuentras un
> correo del negocio, guárdalo con la acción `actualizar`. (4) Elige hasta 20
> según "Cómo se elige". (5) Para los elegidos con website, genera el
> informe PDF con `node scripts/leads/informe.mjs --leads <los dos json>
> --ids <ids> --salida <carpeta>/informes` y lee `informes.json`. (6)
> Escribe un borrador por cada uno según "Cómo se escribe"; los que llevan
> informe citan uno o dos de sus números, dicen que va adjunto y llevan
> `adjunto_pdf`. Cada correo habla de ese negocio en concreto, con lo que
> se vio, en su idioma, sin raya larga y sin promesas. (7) Corre `node
> scripts/leads/enviar.mjs --borradores <archivo>`. Si rechaza borradores,
> corrígelos y repite hasta que pasen. (8) Pide `GET /api/leads?reporte=1
> &desde=<fecha de la corrida anterior>` y termina con el informe para
> Junior: zip y zona, archivos de Sunbiz, encontrados por fuente, con correo,
> enviados (cuántos con PDF) y modo, los enviados con negocio, rubro y una
> línea de por qué, las bajas y los clics desde la corrida anterior, la
> lista de negocios con teléfono y sin correo, y la lista sin presencia con
> la persona y su dirección postal. No toques nada más del repositorio ni
> hagas commits.
