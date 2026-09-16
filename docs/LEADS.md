# Prospección por correo

Cada lunes, miércoles y viernes una sesión automática toma un código postal
de Miami, encuentra hasta 100 negocios, estudia sus websites, elige hasta 20
que pueden necesitar un website o una app, y les escribe un correo personal
firmado por Junior con dos botones: agendar una llamada y ver el showcase.

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
   corrió en 60 días), pide los negocios, visita sus websites y guarda todo.
3. Leer el JSON. Trae `candidatos_para_escribir` (con correo, ordenados por
   puntaje) y `para_llamar_o_whatsapp` (sin correo pero con teléfono).
4. Elegir hasta 20 según los criterios de abajo y escribir un borrador por
   cada uno, en un JSON con el formato de `scripts/leads/enviar.mjs`.
5. `node scripts/leads/enviar.mjs --borradores <carpeta temporal>/borradores.json`.
   Si el script rechaza un borrador (raya larga, promesa, largo), corregirlo
   y volver a correr. No se manda nada hasta que los 20 pasen.
6. Terminar con un informe corto para Junior: zip y zona, cuántos negocios,
   cuántos con correo, cuántos enviados y en qué modo, los 20 con una línea
   de por qué cada uno, y la lista de negocios sin website con teléfono
   (esos son los mejores clientes y hay que llamarlos o escribirles por
   WhatsApp a mano).

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

No se escribe a:

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

**Cuerpo, tres párrafos, entre 90 y 180 palabras en total:**

1. *Lo que vimos.* Una observación concreta y verificable de su negocio (del
   resumen del sitio o de las señales) y el problema que eso le trae. Sin
   halagos vacíos y sin inventar: si no lo vimos, no se dice.
2. *Quiénes somos y qué haríamos.* Junior, Judo Marketing, Miami. La solución
   concreta para ese problema, en una o dos frases, y que ya lo hicimos para
   negocios de su rubro (el showcase tiene comida, servicios, tiendas,
   industria, educación, automotriz y construcción). Que el botón de abajo
   enseña ese trabajo.
3. *El siguiente paso.* 20 minutos de llamada para entender cómo operan y
   decirles con honestidad qué les conviene. Que para los primeros 100
   clientes el precio es bastante accesible y nos gustaría que fueran uno.

**PS (opcional, una línea):** el WhatsApp, `+1 305 934 9981`, para quien
prefiere escribir a agendar.

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

> Asunto: los pedidos de La Carreta, sin comisión
>
> Hola, equipo de La Carreta.
>
> Vi su página buscando restaurantes en Little Havana y me quedé con una duda: ¿los pedidos a domicilio les llegan por apps como DoorDash? Cada una se queda con entre 15 y 30 por ciento, y ese margen suele ser justo el que falta a fin de mes.
>
> Me llamo Junior y dirijo Judo Marketing, aquí en Miami. Hacemos websites y apps para negocios como el suyo: una página propia donde el cliente pide y paga directo, con el menú, los horarios y un panel desde el que ustedes controlan todo. Ya lo hicimos para otros restaurantes de la ciudad y en el botón de abajo pueden ver ese trabajo.
>
> Me gustaría tomar 20 minutos con ustedes para entender cómo operan hoy y decirles con honestidad qué les conviene. Para nuestros primeros 100 clientes el precio es bastante accesible, y me gustaría que fueran uno de ellos.
>
> PS: Si prefieren WhatsApp, escríbanme al +1 305 934 9981 y coordinamos por ahí.

**Ejemplo en inglés (taller sin citas en línea):**

> Subject: a question about Brickell Auto Care
>
> Hi, Brickell Auto Care team.
>
> I came across your shop while looking at auto repair businesses in Brickell. Your reviews are strong, but I noticed there's no way to book an appointment online, so every new customer still has to call during business hours.
>
> My name is Junior and I run Judo Marketing here in Miami. We build websites and apps for businesses like yours: online booking, quote requests, reminders by text, and an admin panel where you see the whole week at a glance. You can see what we've built for other service businesses with the button below.
>
> I'd like to take 20 minutes to understand how you handle jobs today and tell you honestly what would help. For our first 100 clients the pricing is very accessible, and I'd like you to be one of them.
>
> PS: If WhatsApp is easier, message me at +1 305 934 9981.

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
      "ps": "Si prefieren WhatsApp, escríbanme al +1 305 934 9981."
    }
  ]
}
```

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
| Decir por qué recibe el correo | El pie dice que su negocio aparece en Google en esa zona |

Candados propios, en el servidor:

- Tope de 20 correos reales por día (`LEADS_MAX_DIA`).
- Nunca dos correos al mismo negocio en 120 días.
- Nunca a `baja`, `rebotado`, `respondio`, `cliente` ni `descartado`.
- Modo prueba por defecto: hasta que `LEADS_MODO=real`, todo va al correo de
  prueba con el destinatario real en el asunto.

## Configuración (lo que hace Junior una sola vez)

1. **Supabase:** SQL Editor → pegar `supabase/migrations/0027_leads.sql` → Run.
2. **Google Cloud** (el mismo proyecto de la cuenta de servicio): APIs y
   servicios → Biblioteca → "Places API (New)" → Habilitar. Credenciales →
   Crear credencial → Clave de API → restringirla a "Places API (New)".
3. **Vercel** → judo-marketing → Settings → Environment Variables, solo en
   Production:
   - `LEADS_SECRET`: 32 caracteres aleatorios (`openssl rand -base64 32`).
   - `GOOGLE_PLACES_API_KEY`: la clave del paso 2.
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

Comprobación antes de encender: con `LEADS_SECRET` exportado en una terminal,

```bash
node scripts/leads/buscar.mjs --zip 33130 --salida /tmp/leads.json
```

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
> sin nadie mirando, y al final dejas un informe. Pasos: (1) `git pull` en
> `master` y lee completo `docs/LEADS.md`; todo lo que hagas sigue ese
> documento. (2) Corre `node scripts/leads/buscar.mjs --zip auto --salida
> <tu carpeta temporal>/leads.json`. Si falla, no improvises: el informe dice
> qué falló y qué paso de configuración falta. (3) Lee el JSON, elige hasta
> 20 negocios según la sección "Cómo se elige" y escribe un borrador por
> cada uno según "Cómo se escribe", en el formato de "Formato del archivo de
> borradores". Cada correo habla de ese negocio en concreto, con lo que se
> vio en su website, en su idioma, sin raya larga y sin promesas. (4) Corre
> `node scripts/leads/enviar.mjs --borradores <archivo>`. Si rechaza
> borradores, corrígelos y repite hasta que pasen. (5) Termina con el informe
> para Junior: zip y zona, encontrados, con correo, enviados y modo, la lista
> de los 20 con negocio, rubro y una línea de por qué, y la lista de negocios
> sin website con teléfono para llamar o escribir por WhatsApp. No toques
> nada más del repositorio ni hagas commits.
