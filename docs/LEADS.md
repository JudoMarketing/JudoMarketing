# Prospección por correo

Cada día una sesión automática busca negocios que pueden necesitar un
website, una app o un sistema en **dos países**: Estados Unidos y Reino
Unido. En cada uno toma una zona (un código postal de Florida o una
ciudad), estudia lo que tienen en línea, elige **10** y les deja escrito un
correo personal firmado por Junior con dos botones: agendar una llamada y
ver el showcase. El sitio manda esos correos solo, a las 9:30 de la mañana
de Miami. Los que no se pueden contactar por correo salen en una lista para
llamar, escribir por WhatsApp o mandar carta.

| País | Zonas | Idioma del correo | Por día |
| --- | --- | --- | --- |
| Estados Unidos (`us`) | Los 44 códigos postales de Florida primero (ahí se cruza Sunbiz) y después todas las ciudades de más de 25.000 habitantes, de mayor a menor | El del website del negocio (inglés o español) | 10 |
| Reino Unido (`uk`) | Ciudades de más de 25.000 habitantes | Inglés | 10, **solo sociedades (Ltd, LLP, PLC)**: `buscar.mjs` deja fuera a quien no lo demuestra en su web |
| España (`es`) | Ciudades de más de 50.000 habitantes | Español, siempre | **0: cargada pero apagada** por la LSSI (decisión de Junior, 25 de septiembre de 2026) |
| Alemania (`de`) | Ciudades de más de 25.000 habitantes | Alemán | **0: cargada pero apagada** (ver "Candados y ley") |

Las zonas están en `scripts/leads/zonas.json` (3.400 en total, generadas
con `scripts/leads/generar_zonas.py` a partir de GeoNames). Por país, cada
corrida toma la primera zona que no se corrió en 60 días, en el orden del
archivo. Para encender Alemania o cambiar un cupo, se edita `diarios` en
ese archivo y la rutina.

Diez por país, todos los días, es la meta desde el 24 de septiembre de
2026, y desde el 27 de septiembre la regla es **los diez mejores de cada
zona**: se investiga toda la zona y se eligen los diez que de verdad nos
necesitan. Si una zona no da diez buenos, ese mismo día se corre la
siguiente zona del mismo país (`buscar.mjs --zip auto` otra vez, en otra
carpeta) hasta completar diez, y cada zona registra su propia corrida.
Lo que nunca se hace es rellenar: un negocio que ya tiene todo resuelto no
recibe correo aunque falte para completar. La corrida del 23 de septiembre
eligió 7 de 300 revisados y estuvo bien elegida; ese criterio se mantiene,
y ahora se busca en más zonas hasta llegar a diez.

El objetivo son los negocios chicos y medianos con un sistema flojo o sin
sistema: los que Google todavía no conoce, los que solo tienen Facebook, los
que dependen del teléfono o de las apps de delivery, los que llevan años
operando con una página de plantilla. No los que ya tienen todo resuelto.

## De dónde salen los negocios

Tres fuentes, que se complementan:

| Fuente | Qué trae | Quién lo hace |
| --- | --- | --- |
| **Google Places** (`buscar.mjs`) | Hasta 100 negocios establecidos de una zona (un zip de Florida o una ciudad de cualquiera de los países), con website y teléfono. Es la fuente de los que llevan tiempo operando y ya tienen clientes. | Script |
| **Sunbiz** (`sunbiz.mjs`, solo Estados Unidos) | Todas las empresas registradas en Florida, por archivo diario: las de esta semana (recién abiertas) y las de hace 2 y 3 años (con tiempo operando). Se cruzan con Google para saber si existen en línea. | Script |
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
Sesión automática (Claude Code, cada día)         judomarketing.net (Vercel)
────────────────────────────────────────────      ──────────────────────────
Por cada país encendido (us, uk):
1. buscar.mjs  ── pide negocios de la zona ─────▶  /api/leads {buscar}   ──▶ Google Places
               ◀─ 100 candidatos ───────────────
2.             visita cada website (correo, señales, resumen)
3.             ── guarda lo investigado ────────▶  /api/leads {guardar}  ──▶ Supabase (leads)
4. la sesión lee lo aprendido en corridas anteriores, elige 10 y escribe 10 borradores
5. guardar.mjs ── guarda los borradores en la base ▶  /api/leads {borradores} ─▶ Supabase (leads.borrador, PDF en Storage)
6.             ── registra la corrida ──────────▶  /api/leads {corrida}  ──▶ Supabase (leads_corridas)
                  con resumen y aprendizajes         (la memoria de la siguiente corrida)

Después, el sitio solo (cron de Vercel, 9:30 AM de Miami):
7. /api/leads/cron ── manda los borradores pendientes ──▶ SMTP de Google Workspace
                      candados: baja, un correo por negocio en la vida, tope por país, modo prueba
                   ── le manda a Junior el resumen del envío por correo

El dueño del negocio hace clic en "no más correos" ──▶ /api/leads/baja ──▶ estado 'baja' para siempre
```

Por qué así y no de otra forma:

- **La sesión no manda correos: los deja listos y el sitio los manda.** La
  sesión automática corre en un modo de permisos ("auto") que se niega a
  ejecutar acciones con efecto en el mundo real, como mandar un correo a un
  negocio, diga lo que diga el prompt. Así se perdió la corrida del 23 de
  septiembre de 2026: 7 correos escritos y ninguno enviado. Guardar un
  borrador en nuestra base sí lo permite. Por eso el envío vive en el sitio
  (`/api/leads/cron`), que corre a hora fija y le avisa a Junior por correo.
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

1. `git pull` de `master`, leer este documento completo, y leer la memoria:
   `GET /api/leads?memoria=1` trae las últimas corridas con su `resumen` y
   sus aprendizajes. Lo que dicen manda sobre el impulso del momento (ver
   "Aprender de cada corrida"). Los pasos 2 a 9 se repiten por país, en el
   orden us, uk, cada uno en su carpeta.
2. `node scripts/leads/buscar.mjs --pais <país> --zip auto --salida <carpeta>/<país>/leads.json`.
   Elige la siguiente zona del país en `scripts/leads/zonas.json` (la
   primera que no se corrió en 60 días), pide los negocios a Google, visita
   sus websites y guarda todo. Deja `idioma` ya decidido: España siempre
   `es`, Reino Unido `en`, Estados Unidos el del website.
3. Solo en Estados Unidos: `node scripts/leads/sunbiz.mjs --salida <carpeta>/us/sunbiz.json`.
   Baja los archivos diarios de Sunbiz que falten (los nuevos y los de hace
   2 y 3 años), filtra los zips de Florida (`scripts/leads/zips.json`) y los
   nombres que dicen a qué se dedica el negocio, los cruza con Google y
   guarda todo.
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
6. Elegir hasta 10 según los criterios de abajo, con una línea de por qué
   cada uno: qué le falta, qué le cuesta y qué le venderíamos.
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
   `scripts/leads/guardar.mjs`, con `zip`, `pais` y `zona` tal cual salieron
   de `buscar.mjs`. En los que llevan informe, `adjunto_pdf` es la ruta del
   PDF. En `aprendizajes` van las dos o tres cosas que esta corrida enseñó
   (ver "Aprender de cada corrida").
9. `node scripts/leads/guardar.mjs --borradores <carpeta>/<país>/borradores.json`.
   Guarda los borradores en nuestra base de datos y registra la corrida; es
   una escritura en nuestra propia base, nada sale de ahí en ese momento.
   Si el script rechaza un borrador (raya larga, promesa, largo, falta un
   párrafo), corregirlo y volver a correr. Si la zona dio menos de diez,
   volver al paso 3 con la siguiente zona del país (otra carpeta) hasta
   completar diez borradores en el día.
   Para mandar a mano y en el momento (solo Junior, desde su chat):
   `scripts/leads/enviar.mjs` con el mismo archivo.
10. Terminar con un informe corto para Junior, por país: zona; archivos de
   Sunbiz procesados; cuántos negocios por fuente, cuántos con correo,
   cuántos borradores guardados; los elegidos con una línea de por qué cada
   uno; la lista de negocios con teléfono y sin correo (para llamar o
   WhatsApp); y la lista de negocios sin presencia en línea con la persona
   al frente y su dirección postal (para carta o para buscarlos a mano).
   Los correos salen a las 9:30 AM de Miami y Junior recibe el resumen del
   envío por correo.

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

Reglas de mezcla: máximo 3 del mismo rubro en una corrida, y si hay menos de
10 que valgan la pena, se mandan menos. Diez malos hacen más daño que
siete buenos: cada correo que ignoran baja la reputación del dominio.

Lo que no se elige se puede dejar en `nuevo` (vuelve a aparecer en otra
pasada) o marcar como `descartado` con motivo cuando está claro que nunca
va a ser cliente (`/api/leads {accion:"descartar"}`).

## Aprender de cada corrida

Junior lo dijo el 23 de septiembre de 2026, después de leer el informe de
la corrida de 33130: "me gustó lo analítico y estratégico al momento de
elegir prospectos, repite eso y hazte mejor cada vez, aprende". Esto es lo
que se repite y cómo se mejora.

**Lo que se repite (el criterio que funcionó):**

- Se revisa todo lo que trae la búsqueda (300 negocios ese día) y se elige
  poco (7). Descartar 70 por tener ya infraestructura o ser gigantes no es
  tiempo perdido: es lo que hace que los 7 valgan.
- Cada elegido tiene un motivo concreto que se puede señalar con el dedo:
  el dominio expiró y ahora es una página en venta (Cafe Branca), 637
  reseñas y solo Instagram (El Gallito Grill), talleres que dependen del
  teléfono para dar cita. Si el motivo no cabe en una línea, no es
  candidato.
- El informe PDF lleva números reales de PageSpeed y Maps; el correo cita
  uno o dos. Nunca un dato inventado ni "no disponible".
- El informe final a Junior dice por qué cada uno, no solo quién.

**Lo que se mira además, desde ahora (cómo se mejora):**

- **Patrones entre negocios.** Cuatro salones de belleza de 33130 compartían
  el mismo website caído (404): casi seguro un mismo dueño con varias
  marcas, o una misma agencia que los abandonó. Cuando varios candidatos
  comparten dominio, teléfono, dirección o correo, son **un** prospecto: se
  escribe una sola vez, al que mejor identifique al dueño, y el correo
  menciona que vimos las otras marcas. Escribirles a los cuatro es cuatro
  correos al mismo buzón.
- **Un negocio con muchas reseñas y sin website** (más de 300 reseñas, solo
  redes) es el mejor candidato de la lista: ya tiene clientes, ya factura,
  y no tiene dónde recibirlos en línea. Va primero.
- **Dominio expirado o "for sale"**: el negocio pagó una página y la perdió.
  Se le escribe pronto, antes de que otro lo haga, y se le dice tal cual lo
  que se ve al entrar a su dirección.
- **Leer la memoria antes de elegir.** `GET /api/leads?memoria=1` trae los
  resúmenes y aprendizajes de las corridas anteriores. Si una corrida
  anterior aprendió algo sobre un rubro, una zona o un tipo de señal, esta
  corrida lo aplica. Si la corrida anterior fue del mismo zip, esta no
  repite sus elegidos (el servidor lo impide, pero tampoco se intenta).
- **Dejar memoria.** Al terminar, `aprendizajes` en el archivo de borradores
  lleva dos o tres frases concretas y reutilizables: "en 33130 los salones
  comparten webs caídas: revisar dominio repetido", "los talleres de
  Brickell responden mejor al correo de citas que al de reseñas". Nada de
  generalidades ("elegir bien"). `guardar.mjs` las guarda con la corrida.
- **Medir lo que pasó.** El reporte (`?reporte=1`) dice quién hizo clic y
  quién pidió baja desde la corrida anterior. Un rubro o una apertura que
  trae clics se repite; una que trae bajas se deja. Eso también va en
  `aprendizajes`.

Cuando Junior reenvía a este chat un informe de corrida, lo que de ahí sea
duradero (una regla nueva, una señal nueva, un rubro que no responde) se
pasa a esta guía y al código; la memoria de `leads_corridas` es para el
día a día, la guía es para lo que ya se comprobó.

## Cómo se escribe el correo

Un correo de Junior a un dueño de negocio. No un boletín, no una plantilla
con el nombre pegado. La prueba: si se lee en voz alta suena como algo que
una persona escribiría a otra en diez minutos.

**Idioma:** el que trae el lead en `idioma`, que `buscar.mjs` decide por
país: España siempre en español (Junior lo pidió así, aunque el sitio del
negocio esté en inglés), Reino Unido en inglés, Estados Unidos en el idioma
del website del negocio (si no se pudo saber, inglés). El español de España
no es el de Miami: "vosotros" no, pero tampoco "ustedes" forzado; se
escribe en un español neutro, de tú, y con las palabras de allá: "móvil",
"reservas", "pedidos a domicilio", "autónomo", "negocio local".

**Asunto:** entre 4 y 8 palabras, en minúsculas naturales, que nombre al
negocio o la cosa concreta que vimos. Nada de signos de exclamación,
mayúsculas, "gratis", "oferta", "última oportunidad".
Bien: `los pedidos de La Carreta, sin comisión` · `una pregunta sobre Brickell Auto Care` · `Rincón Bakery y los pedidos por WhatsApp`.
Mal: `¡Haz crecer tu negocio HOY!` · `Propuesta de servicios de marketing digital`.

**Saludo:** `Hola, equipo de {negocio}.` o `Hi, {negocio} team.` Si el
resumen del sitio dice el nombre del dueño, se usa: `Hola, Carlos.`

**Cuerpo: entre 90 y 160 palabras, en tres o cuatro párrafos cortos.** Es
un discurso de venta, pero de alguien que de verdad quiere ayudar y lo
demuestra con lo que vio. Profesional, humano y directo; se lee en 40
segundos. Desde el 27 de septiembre de 2026 (lo pidió Junior) lleva estas
cuatro partes, en este orden:

1. *El hecho y lo que le cuesta.* Una o dos frases con lo concreto que
   vimos en su negocio y lo que le está costando hoy, en clientes o en
   dinero. Sin "espero que estés bien", sin presentarse antes del problema.
   "Cada pedido que te entra por DoorDash deja 15 a 30 por ciento en la
   app, y tu página no tiene pedidos propios."
2. *Quiénes somos y qué le haríamos.* "Soy Junior, de Judo Marketing, en
   Miami." y la solución en dos frases, concreta y en las palabras del
   dueño: la página donde el cliente pide y paga directo, la agenda en
   línea, el panel. Si va informe: "Te adjunto una página con lo que Google
   ve hoy de tu negocio."
3. *Por qué lo decimos.* Dos o tres frases con nuestra intención real, en
   pasado y sin prometer el futuro. Las ideas son estas, dichas con
   palabras distintas en cada correo: a cada negocio con el que hemos
   trabajado le fue mejor después que antes (más pedidos, más citas, menos
   teléfono); el dinero bien dirigido atrae más dinero, y nuestro trabajo
   es dirigirlo; no somos costosos: nuestro plan es crecer contigo,
   empezando por lo que necesitas hoy. Se dice "nos ha ido así", nunca "te
   va a ir así".
4. *El cierre.* Pedir 20 minutos esta semana. Decir que abajo puede ver
   nuestro trabajo y agendar (los botones llevan los enlaces al sitio y a
   la agenda; no se escribe la dirección). Que al contratar le configuramos
   su Perfil de Empresa de Google sin costo. La frase de los primeros 100
   clientes va aquí si cabe con naturalidad; si no, se deja.

**PS (opcional, una línea):** `WhatsApp +1 305 934 9981.`

`guardar.mjs` rechaza el borrador si tiene menos de tres párrafos, si no
dice "Judo Marketing", si trae un enlace dentro de un párrafo o si se sale
del largo.

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

- Raya larga. Ninguna. Se escribe con comas y puntos. `guardar.mjs` rechaza
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

**Variedad:** en una corrida de 10, no se repite la primera frase, y se
alternan las tres aperturas: pregunta ("¿los pedidos les llegan por...?"),
observación ("vi que su página...") y contexto ("estuve mirando talleres
de Doral y...").

**Ejemplo en español (restaurante sin pedidos en línea):**

> Asunto: los pedidos de La Esquina, sin comisión
>
> Hola, equipo de La Esquina.
>
> Cada pedido que les entra por DoorDash deja entre 15 y 30 por ciento en la app, y su página no tiene pedidos propios. Con las 640 reseñas que tienen, eso es dinero ya ganado que se va a otra parte.
>
> Soy Junior, de Judo Marketing, en Miami. Les montamos una página donde el cliente pide y paga directo, con el menú vivo y un panel de pedidos, conectada a su perfil de Google.
>
> Les escribo porque es lo que sabemos hacer: a cada negocio con el que hemos trabajado le fue mejor después que antes, con más pedidos y menos teléfono. El dinero bien dirigido atrae más dinero, y nuestro trabajo es dirigirlo. No somos costosos; el plan es crecer con ustedes, empezando por lo que hace falta hoy.
>
> ¿Me dan 20 minutos esta semana? Abajo pueden ver nuestro trabajo y agendar. Al contratar les configuramos su Perfil de Empresa de Google sin costo.
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
> I'm writing because this is what we do: every business we've worked with came out ahead of where it started, with more consultations booked and fewer calls lost. Well directed money brings in more money, and directing it is our job. We're not expensive: the plan is to grow with you from what you need now.
>
> Can I get 20 minutes this week? You can see our work and book a time below. When you sign up, we set up your Google Business Profile at no cost.
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
> Te escribo porque dos años trabajando sin sistema dicen que el servicio es bueno; lo que falta es que la gente los encuentre. A los negocios con los que hemos trabajado les fue mejor después que antes, con más citas y menos tiempo al teléfono. No somos costosos: la idea es empezar por lo que necesitas hoy y crecer contigo.
>
> ¿Tienes 20 minutos esta semana? Abajo puedes ver nuestro trabajo y agendar. Al contratar te configuramos tu Perfil de Empresa de Google sin costo.
>
> PS: WhatsApp +1 305 934 9981.

## Formato del archivo de borradores

```json
{
  "zip": "33135",
  "pais": "us",
  "zona": "Little Havana",
  "encontrados": 100,
  "con_correo": 38,
  "resumen": "Little Havana: muchos restaurantes con menú en PDF y sin pedidos en línea. 10 elegidos, 3 comida, 3 servicios, 2 tiendas, 2 de Sunbiz.",
  "aprendizajes": [
    "En 33135 tres cafeterías comparten la misma agencia (correo @xyzmedia): se descartaron, el correo no llega al dueño.",
    "Los talleres con más de 100 reseñas y sin citas en línea son el mejor rubro de la zona; quedan 6 en nuevo para la próxima pasada."
  ],
  "borradores": [
    {
      "lead_id": "uuid del JSON de buscar.mjs",
      "idioma": "es",
      "rubro": "restaurante",
      "asunto": "los pedidos de La Carreta, sin comisión",
      "saludo": "Hola, equipo de La Carreta.",
      "parrafos": ["el hecho y lo que cuesta", "Soy Junior, de Judo Marketing, en Miami; qué le haríamos", "por qué lo decimos: a nuestros clientes les fue mejor, el dinero bien dirigido, crecer contigo", "20 minutos; abajo el trabajo y la agenda; el Perfil de Google sin costo"],
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
| Cómo te encuentran | Puesto para las búsquedas de su zona (en un zip de Florida: por rubro y zip y por rubro y barrio; en una ciudad: por rubro y ciudad), los tres primeros con sus reseñas frente al negocio, puesto en la búsqueda web de Google de su país si hay buscador configurado | Google Places y Custom Search |
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

**Fuera de Estados Unidos la ley es distinta en cada país**, y esto no es
consejo legal: es lo que dicen las normas y lo que decidimos hacer. Un
abogado del país tiene la última palabra.

| País | Norma | Qué dice del correo comercial a negocios sin consentimiento previo | Qué hacemos |
| --- | --- | --- | --- |
| Reino Unido | PECR (2003) y UK GDPR | A sociedades (Ltd, LLP, PLC, entes públicos) se les puede escribir sin consentimiento previo, identificándose y con baja fácil. A autónomos y sociedades de personas (*sole traders*, *partnerships*) no: cuentan como individuos y hace falta consentimiento. | Encendido, **solo sociedades**. `buscar.mjs` marca `sociedad_uk` cuando la web muestra "Ltd"/"Limited"/"LLP"/"PLC", el número de registro o "Registered in England" (la ley les obliga a ponerlo); quien no lo muestra va a `sin_sociedad_uk` y no se le escribe. Solo direcciones del negocio, nunca personales. |
| España | LSSI (art. 21) y LOPDGDD (art. 19) | La LSSI prohíbe el correo comercial que no fue pedido o autorizado antes, y aplica también a empresas. La AEPD ha sancionado por esto. | **Apagado** (`diarios: 0`) por decisión de Junior el 25 de septiembre de 2026. Las zonas y el correo en español quedan listos por si un abogado español dice cómo hacerlo. |
| Alemania | UWG § 7 (2) Nr. 2 | Publicidad por correo sin consentimiento previo expreso es competencia desleal, también entre empresas. Los competidores y asociaciones mandan *Abmahnungen* (requerimientos con costas) de forma sistemática. | **Apagado** (`diarios: 0`). Las zonas están cargadas y el correo sale en alemán, pero no se enciende sin un abogado alemán que diga cómo. |

Candados propios, en el servidor:

- Tope de 10 correos reales por día **por país** (`LEADS_MAX_DIA`), y
  `guardar.mjs` no acepta más de 10 borradores por archivo (una zona por
  archivo; si el día lleva dos zonas, son dos archivos).
- Los borradores caducan a los 3 días: si el cron no pudo mandarlos (tope,
  SMTP caído), lo intenta al día siguiente; después de tres días se
  quedan sin mandar y la siguiente corrida los ve como `nuevo`.
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
   Después `supabase/migrations/0028_leads_paises.sql` → Run (países,
   borradores y el bucket `leads` para los PDF). Sin la 0028, `guardar.mjs`
   responde "¿falta la migración 0028?" y no guarda nada.
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
   - `LEADS_MAX_DIA`: `10` (por país y por día).
   - `CRON_SECRET`: 32 caracteres aleatorios. Vercel lo manda solo en la
     cabecera cuando dispara el cron; sin él, `/api/leads/cron` solo acepta
     `LEADS_SECRET` (llamada a mano).
   Después: Deployments → Redeploy del último de producción, para que las
   variables entren.
4. **Claude Code** → Settings → Environments → el entorno de JudoMarketing →
   variables de entorno: `LEADS_SECRET` con el mismo valor que en Vercel.
5. **La rutina** ("Prospección por correo (Judo Marketing)") ya existe en
   Claude Code y está encendida. Corre todos los días a las 8 de la mañana
   de Miami (12:00 UTC; a las 7 cuando entra el horario de invierno), pasa
   por los países encendidos y manda un aviso al terminar. Tarda entre
   media hora y una hora.
6. **El cron del sitio** (`vercel.json`) manda los borradores a las 9:30 de
   la mañana de Miami (13:30 UTC): 15:30 en Madrid, 14:30 en Londres. Si la
   rutina todavía no terminó, lo que guardó después sale al día siguiente.
   Se puede disparar a mano:
   `curl -H "Authorization: Bearer $LEADS_SECRET" https://www.judomarketing.net/api/leads/cron`.

Sunbiz no necesita configuración: el usuario público lo publica el propio
Estado en su página de descargas y va en `scripts/leads/sunbiz.mjs`. Si el
Estado lo cambia, se pone el nuevo en `SUNBIZ_USER` y `SUNBIZ_PASS`.

Comprobación antes de encender: con `LEADS_SECRET` exportado en una terminal,

```bash
npm ci
node scripts/leads/buscar.mjs --zip 33130 --salida /tmp/leads.json
node scripts/leads/buscar.mjs --pais es --zip auto --salida /tmp/leads-es.json
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

Las dos primeras corridas se dejan en modo prueba: Junior recibe los 10
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
- **Rebotes** ("address not found"): marcar `rebotado`. Más de 2 en una
  corrida de 10 significa que el rastreo de correos está trayendo basura y
  hay que revisar `CORREOS_BASURA` en `buscar.mjs`.
- **Bajas**: normal una o dos por cada 100. Más de 5 por 100 significa que
  el correo suena a spam y hay que releer la guía de escritura.
- **Citas agendadas** desde el enlace del correo: en Google Analytics, el
  tráfico con `utm_campaign=zip-XXXXX` dice qué zona responde.

## Entregabilidad

- Volumen: 10 por país y por día, dos países, 20 al día, 140 a la semana.
  Google Workspace tolera esto sin problema; lo que quema un dominio no es
  el volumen, es que la gente marque spam. Diez al día parejos son mejores
  para la reputación que 20 tres veces por semana: el envío es constante y
  cada correo está mejor elegido.
- El dominio ya tiene SPF, DKIM (selector `google`) y DMARC. El DMARC está
  en `p=none`: sirve para que Google no rechace, pero no protege contra
  suplantación. Cuando lleve un mes sin problemas, subirlo a `p=quarantine`.
- **Con 140 a la semana ya se pasó de los 100 que marcaban el límite** para
  prospectar desde `judomarketing.net`. Lo prudente es mover la
  prospección a un dominio aparte (por ejemplo `judomarketing.co` o
  `judomarketing.email`, con su propio SPF, DKIM y DMARC y un alias de
  Junior) y ponerlo en `LEADS_FROM`, para que un mal día de prospección
  nunca afecte los correos de clientes y contratos de `judomarketing.net`.
  Mientras tanto se vigilan rebotes y bajas cada semana.

## La instrucción que recibe la sesión automática

Es el texto de la rutina "Prospección por correo (Judo Marketing)" en
Claude Code (todos los días, 12:00 UTC). Si se cambia aquí, hay que
cambiarlo también en la rutina (Settings → Routines), y al revés.

> Eres la sesión de prospección por correo de Judo Marketing. Trabajas solo, sin nadie mirando, y al final dejas un informe para Junior. Corres todos los días y cubres dos países: Estados Unidos (us) y Reino Unido (uk), 10 negocios por país. España y Alemania están apagadas: no las corras. Tu trabajo termina cuando los borradores quedan escritos en NUESTRA base de datos con `scripts/leads/guardar.mjs`. Ese script solo escribe registros en nuestra propia base (Supabase, vía /api/leads); no manda correos, no toca a ningún tercero, no es una transacción ni una acción hacia afuera. Correrlo es obligatorio y no requiere confirmación de nadie: sin ese paso, todo el día de trabajo se pierde. Lo que el sitio haga después con esos registros no es cosa tuya.
>
> Regla número uno, por encima de todo lo demás: solo se escribe a negocios que NOS NECESITAN. Nunca a quien ya tiene infraestructura (plataforma de membresías, reservas, pedidos o gestión, o un sistema propio de venta en su página), ni a los gigantes de su zona, ni a quien sale entre los tres primeros de Google Maps con una página rápida y sin fallos graves. Los scripts los apartan en `ya_equipados` y el informe los marca `apto: false`; si dudas de uno, no se le escribe. Sin recontacto: un negocio recibe un solo correo en su vida.
>
> Regla número dos: los diez mejores de cada zona. Investigas toda la zona y eliges los diez que de verdad nos necesitan, explicando cada elección en una línea (qué le falta, qué le cuesta, qué le venderíamos). Si la zona no da diez buenos, ese mismo día corres la siguiente zona del mismo país (paso 3 otra vez, en otra carpeta, por ejemplo <tmp>/us2) hasta completar diez borradores para ese país; cada zona lleva su propio archivo de borradores y su propia corrida. Lo que nunca haces es rellenar con negocios que no nos necesitan. Diez es exacto: cuando un país ya tiene diez borradores guardados, ese país terminó; no corras otra zona para tener más, porque el sitio manda 10 por país al día y lo que sobra caduca a los 3 días.
>
> Regla número tres, Reino Unido: solo se escribe a sociedades (Ltd, LLP, PLC). `buscar.mjs` deja en `candidatos_para_escribir` únicamente a las que lo demuestran en su web (señal `sociedad_uk`) y aparta al resto en `sin_sociedad_uk`; nunca escribas a nadie de esa lista ni a nadie sin esa señal, aunque tenga correo. Idioma: Reino Unido en inglés; Estados Unidos en el idioma del website del negocio (`buscar.mjs` ya deja `idioma` en cada lead).
>
> Pasos:
> 1. En el repositorio JudoMarketing/JudoMarketing haz `git checkout master && git pull && npm ci` y lee COMPLETO el archivo `docs/LEADS.md`. Todo lo que hagas sigue ese documento. Después lee la memoria: `GET /api/leads?memoria=1` (con LEADS_SECRET) trae las últimas corridas con su resumen y sus aprendizajes; aplica lo que dicen (patrones de la zona, rubros que responden o no, señales que engañan).
> 2. Para cada país, en este orden us, uk, repite los pasos 3 a 8 con su propia carpeta (<tmp>/us, <tmp>/uk). Si un país falla, lo dices en el informe y sigues con el siguiente.
> 3. Corre `node scripts/leads/buscar.mjs --pais <país> --zip auto --salida <tmp>/<país>/leads.json` (negocios establecidos de la siguiente zona de ese país, desde Google Places). Solo en Estados Unidos corre después `node scripts/leads/sunbiz.mjs --salida <tmp>/us/sunbiz.json` (empresas registradas en Florida: las nuevas de esta semana y las de hace 2 y 3 años, cruzadas con Google). Necesitan la variable de entorno LEADS_SECRET. Si uno falla, no improvises ni intentes otra vía: tu informe dice exactamente qué falló y qué paso de la sección "Configuración" de docs/LEADS.md falta.
> 4. Lee el JSON (los dos en Estados Unidos). Para los mejores candidatos que no tienen correo (hasta 10 por país), busca en internet el negocio con su ciudad, y el nombre de la persona al frente con el negocio, incluyendo Facebook e Instagram. Si encuentras un correo que claramente es del negocio, guárdalo con `POST /api/leads {accion:"actualizar", lead_id, email}` (mismo secreto). Si encuentras WhatsApp o una página de Facebook, guárdalo en `notas`. Nunca correos personales de terceros ni direcciones adivinadas.
> 5. Elige los 10 mejores de `candidatos_para_escribir` según las secciones "Cómo se elige a quién escribir" y "Aprender de cada corrida" (máximo 3 del mismo rubro por país y por día, contando todas las zonas; prioridad a los que tienen muchas reseñas y solo redes, a los que llevan años sin sistema, a los que dependen del teléfono o de las apps de delivery, a los de dominio expirado o página caída). Si varios candidatos comparten dominio, teléfono, dirección o correo, son UN prospecto: se escribe una sola vez. Nunca de `ya_equipados`. Si no llegas a 10 buenos, anota los que tienes y, después del paso 8, vuelve al paso 3 con la siguiente zona.
> 6. Para los elegidos que tienen website, genera el informe de presencia en línea: `node scripts/leads/informe.mjs --leads <tmp>/<país>/leads.json[,<tmp>/us/sunbiz.json] --ids <ids separados por coma> --salida <tmp>/<país>/informes`. Lee `informes.json`: trae los números reales de cada uno (velocidad, SEO, puesto en Maps, reseñas frente a los tres primeros, fallos), los `avisos` de lo que no se pudo medir, y `apto`. Los que salgan `apto: false` se descartan con `{accion:"descartar"}` y su `motivo_no_apto`, y se reemplazan por otros candidatos si los hay.
> 7. Escribe un borrador por cada uno según "Cómo se escribe el correo": entre 90 y 160 palabras, tres o cuatro párrafos cortos, un discurso de venta profesional de alguien que de verdad quiere ayudar. (1) El hecho concreto que vimos (del informe, de su perfil de Google, de su website o de su registro) y lo que le cuesta hoy. (2) "Soy Junior, de Judo Marketing, en Miami" (o "I'm Junior, from Judo Marketing in Miami") y qué le haríamos, en dos frases y en las palabras del dueño; si va informe, decir que va adjunto. (3) Por qué lo decimos, en pasado y con palabras distintas en cada correo: a cada negocio con el que hemos trabajado le fue mejor después que antes (más pedidos, más citas, menos teléfono); el dinero bien dirigido atrae más dinero y nuestro trabajo es dirigirlo; no somos costosos, nuestro plan es crecer contigo empezando por lo que necesitas hoy. (4) El cierre: 20 minutos esta semana, "abajo puedes ver nuestro trabajo y agendar" (los botones llevan los enlaces; no escribas direcciones web), y el Perfil de Empresa de Google sin costo al contratar. En su idioma, sin raya larga, sin promesas de resultados, sin cifras de precios, sin enlaces en los párrafos, sin firma (la plantilla la pone). Los que llevan informe citan uno o dos de sus números (nunca uno marcado como no disponible) y llevan `adjunto_pdf`. Varía las aperturas: no repitas la primera frase. El archivo lleva `zip`, `pais` y `zona` tal cual salieron de `buscar.mjs`, y `aprendizajes`: dos o tres frases concretas y reutilizables sobre lo que esta corrida enseñó (un patrón de la zona, un rubro, una señal que engaña, qué trajo clics o bajas); nada de generalidades.
> 8. Corre `node scripts/leads/guardar.mjs --borradores <tmp>/<país>/borradores.json`. Escribe los borradores en nuestra base de datos y registra la corrida con los aprendizajes. Es una escritura en nuestra propia base, igual que guardar los leads en el paso 3: no pidas permiso, no la saltes, no la dejes para el final. Si rechaza borradores, corrígelos y repite hasta que pasen todos. Si el país todavía no tiene 10 borradores guardados, vuelve al paso 3 con la siguiente zona (otra carpeta) y repite hasta 8.
> 9. Al terminar los dos países, pide `GET /api/leads?reporte=1&desde=<fecha ISO de hace 1 día>` con el mismo secreto. Termina con el informe para Junior, por país: zonas corridas; archivos de Sunbiz procesados (solo us); encontrados por fuente, cuántos apartados por ya tener infraestructura, con correo, borradores guardados (cuántos con PDF); la lista de los elegidos con negocio, rubro y una línea de por qué NOS NECESITA; los aprendizajes que dejaste; las BAJAS y los CLICS del último día (quién, cuándo, qué botón); la lista de negocios con teléfono y sin correo (para llamar o WhatsApp); y, en Estados Unidos, la lista sin presencia en línea con la persona al frente y su dirección postal. Recuérdale que el sitio procesa los borradores a las 9:30 AM de Miami y que recibirá el resumen por correo. Si algo se vio raro (muchos rebotes, correos sospechosos, Places, PageSpeed o Sunbiz sin resultados), dilo.
>
> No toques nada más del repositorio, no hagas commits ni push, no cambies variables de entorno ni configuración.
