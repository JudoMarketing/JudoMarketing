# Aportes al cerebro

La bandeja de entrada del cerebro (`CEREBRO.md`). Cada proyecto de la casa
—Judito-Ads, los websites de clientes, los Juditos— agrega aquí lo que
aprendió, **al final del archivo, sin tocar lo de los demás**. Después, desde
el chat de Judo Marketing, se curan estos aportes y los buenos pasan al
cerebro.

## Cómo aportar (desde el chat de cualquier proyecto)

1. Conecta este repo a tu sesión: `add_repo JudoMarketing/JudoMarketing` y
   clónalo (es de la misma organización).
2. Agrega tu entrada **al final** de este archivo con el formato de abajo.
3. Commit y push a `master`. Si el push choca porque otro proyecto aportó al
   mismo tiempo: `git pull --rebase` y reintenta.

Qué vale la pena aportar: un patrón que funcionó, un error que costó caro y
cómo se arregló, una decisión de diseño con su porqué, un texto que convirtió
mejor que otro. Qué no: pasos rutinarios, cosas específicas de un solo
cliente que no enseñan nada general.

## Formato

```
---
### AAAA-MM-DD · Proyecto · rubro
**Qué aprendimos:** una a tres líneas, directo.
**Evidencia:** qué pasó que lo demuestra (opcional pero vale doble).
```

---

### 2026-08-28 · JudoMarketing · agencia
**Qué aprendimos:** el servicio de capturas de pantalla guarda cada foto 24
horas contra la URL exacta, salga bien o en blanco. Si un sitio pesado sale
en blanco, la portada mala se queda pegada un día. La cura: esperar 8
segundos antes del disparo y tener forma de cambiar la URL (un sello de
fecha) para forzar captura nueva.
**Evidencia:** las portadas de Melanie Osorio y Art Foundation salieron en
blanco en el showcase y no había forma de rehacerlas hasta el otro día.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** Supabase NO devuelve error cuando una política RLS deja
fuera la fila: responde OK con cero filas tocadas. Mirando solo `error`, el
panel canta éxito sin haber hecho nada. Toda escritura de administración
lleva `.select()` y se comprueba que volvió al menos una fila.
**Evidencia:** en el admin de judomarketing.net, «Deshabilitar» un sitio y
«Borrar» un contrato mostraban el ✓ verde y no cambiaba nada. El fallo era
invisible para el cliente y para nosotros: parecía un botón roto, y era la
base de datos negándose en silencio.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** en Next.js App Router, un manejador de eventos
(`onError`, `onClick`) dentro de un componente de SERVIDOR revienta la página
entera en producción — y `next dev` no lo detecta. Solo lo saca `next build`
+ `next start`. Antes de publicar cualquier cosa, correr el build de
producción de verdad, no solo el servidor de desarrollo.
**Evidencia:** un `onError` puesto en la `<img>` de una tarjeta dejó el
portal con «Application error» y no abría. En desarrollo funcionaba perfecto,
así que se publicó con toda confianza.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** que un ajuste se guarde no significa que se use. Hay que
seguirlo hasta el final: pantalla → base de datos → el motor que lo aplica.
Un campo que se recoge, se guarda y hasta se enseña en el resumen puede no
llegar nunca a su destino, y nadie se entera porque la interfaz miente por
omisión: enseña la promesa, no el resultado.
**Evidencia:** los intereses del público se elegían, se guardaban y salían en
el resumen de la campaña, pero el motor nunca se los mandaba a Meta: las
campañas salían a todo el país sin afinar. Igual el interruptor «deja que
Meta amplíe el público», que viajaba hasta el motor y ahí se descartaba con
un valor fijo. Meses funcionando a medias sin un solo error en pantalla.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** cuando un servicio externo agrupa datos por día, hay que
averiguar en QUÉ zona horaria lo hace antes de calcular «hoy». Con
`toISOString()` se calcula el día UTC, y basta con que el servicio use otro
huso para que las cifras de hoy salgan en cero o falte el primer día entero.
**Evidencia:** Meta agrupa el gasto en la zona de la cuenta publicitaria
(Pacífico, en nuestro caso). La barra «Presupuesto hoy» marcaba $0.00 todas
las tardes, y al pedir métricas en UTC se perdía la primera noche de cada
campaña: los totales del portal salían por debajo de los de Meta.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** Safari en iPhone no dispara los eventos de carga de un
`<video>` que no se está reproduciendo. Cualquier cosa que espere
`loadeddata` para sacarle un fotograma se cuelga para siempre. La cura:
`playsInline` + un `play()/pause()` de arranque, escuchar también
`loadedmetadata`, y SIEMPRE un tope de tiempo que suelte la interfaz pase lo
que pase.
**Evidencia:** subir un video desde el teléfono dejaba «Subiendo video»
pegado en 100% eternamente. El archivo sí había subido; lo que se colgaba era
la captura de la miniatura, después de la subida.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** una app de Meta en modo Desarrollo solo deja entrar a
quien tenga rol en ella. Cualquier otra persona ve «Función no disponible» y
parece un fallo de nuestro sitio. Pasar a Live y el App Review de los
permisos se empiezan con semanas de antelación, no cuando ya hay clientes
esperando. Y ojo: un portafolio de negocio con restricción publicitaria no
puede ni conectar la app, y eso se apela aparte.
**Evidencia:** los primeros probadores invitados a JuditoADS no pudieron
conectar su Meta, y al ir a arreglarlo apareció encima que el portafolio
verificado del negocio estaba restringido para anunciar.
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** la rama `master` de este repo NO existe. GitHub redirige
`master` a la rama por defecto, así que el `raw` de CEREBRO.md contesta 200 y
parece que todo está bien — pero `git push origin master` crearía una rama
nueva y divergente en vez de aportar al hilo real. Hay que empujar a la rama
por defecto (`claude/judo-marketing-redesign-ci2rj5`) o crear `master` de
verdad una sola vez y mover el default ahí.
**Evidencia:** `git ls-remote --heads origin` lista cinco ramas y ninguna es
`master`, mientras que `curl` a la URL con `/master/` devuelve 200. La
instrucción "haz push a master" que llevan los chats de todos los proyectos
apunta a un fantasma.

---
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** un honeypot cuyo campo trampa se valida en el esquema no
sirve de nada. Si el validador rechaza el campo lleno, el bot recibe un error
de validación —que lee como "reintenta"— y la rama que descarta el spam en
silencio queda muerta. El esquema debe ACEPTAR el campo trampa y la lógica de
descarte va después. Y el mensaje de éxito falso debe ser idéntico carácter
por carácter al real, o el bot compara respuestas y aprende a dejarlo vacío.
**Evidencia:** con `company: z.string().max(0)` el envío de prueba con la
trampa llena devolvió "Please check the highlighted fields" sin ningún error
visible. Al soltar la validación, el mismo envío devolvió éxito falso y el log
del servidor confirmó que no se entregó nada.

---
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** poner `.env*` en `.gitignore` (lo que genera
`create-next-app`) también ignora `.env.example`. El repo llega a GitHub sin
ningún registro de qué variables hay que configurar, y el siguiente que clone
descubre las que faltan cuando algo se cae en producción. Hace falta
`!.env.example` después del patrón. Ojo: `git check-ignore -v` engaña, lista
el patrón de negación como si el archivo siguiera ignorado; la prueba real es
`git add --dry-run`.
**Evidencia:** el starter compilaba y subía limpio, pero `.env.example` —con
las tres variables sin las cuales el formulario de contacto no entrega nada—
no habría llegado nunca al repo.

---
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** Next.js 16 rompe patrones que todavía se escriben por
inercia: `middleware.ts` pasó a `proxy.ts`; `params` y `searchParams` son
Promises (y en `opengraph-image`/`icon`, el `id` también); `images.domains`
desapareció en favor de `remotePatterns`; y `next.config` ya no acepta la
clave `eslint` porque `next lint` no existe. El más traicionero es
`images.qualities`, que ahora vale `[75]` por defecto: un `quality={90}` no
da error, se degrada en silencio. Next trae sus propios docs dentro de cada
proyecto en `node_modules/next/dist/docs/` — conviene leerlos antes de asumir.
**Evidencia:** el build del starter falló con TS2353 por la clave `eslint`,
que en Next 15 era correcta.

---
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** en Next.js 16 el `proxy.ts` (lo que antes era
`middleware.ts`) tiene que estar al mismo nivel que la carpeta `app`. Si el
proyecto usa `src/`, va en `src/proxy.ts`, NO en la raíz. Puesto en la raíz no
da error, no avisa en el build y no aparece en los logs: simplemente no se
ejecuta nunca.
**Evidencia:** con el archivo en la raíz, `/` devolvía 404 en vez de redirigir
al idioma del visitante. El build salía verde y el único síntoma era la página
rota. Moverlo a `src/` lo arregló sin cambiar una línea de código.

---
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** la imagen de OpenGraph que genera Next se dibuja con
Satori, que NO es un navegador: un `<div>` con más de un hijo revienta el build
salvo que lleve `display: flex` explícito. Y ojo, dos trozos de texto seguidos
cuentan como dos hijos. Lo más simple es unir el texto en una sola plantilla de
cadena.
**Evidencia:** el build falló entero en `/en/opengraph-image` y
`/es/opengraph-image` con "Expected <div> to have explicit display: flex". El
resto del sitio compilaba perfecto, así que el fallo llegó al final del proceso.

---
### 2026-08-27 · JuditoWEBS · plantilla base
**Qué aprendimos:** la forma barata de hacer cumplir "un idioma por vista,
completo" es un tipo de TypeScript. Se declara un `Dictionary` con TODAS las
claves de texto del sitio y cada idioma tiene que satisfacerlo: si falta una
traducción, el build falla. Con tuplas (`[T, T, T]`) el mismo truco hace
cumplir la regla de tres — meter un cuarto servicio deja de ser un descuido y
pasa a ser una decisión que hay que escribir.
**Evidencia:** con esto, olvidar una cadena al traducir dejó de ser algo que
descubre el cliente en producción y pasó a ser un error de compilación.

---
### 2026-08-28 · Juditos · asistentes de IA
**Qué aprendimos:** en el prompt cacheado no puede entrar nada que cambie
entre mensajes —la fecha, la hora, el nombre del contacto—. La caché de
Anthropic funciona por prefijo exacto: un byte distinto invalida todo lo que
viene detrás y se paga el prompt entero otra vez, en cada mensaje. Lo estable
(negocio, tono, reglas, catálogo) va en el `system`; lo variable va en el
mensaje del usuario. Se comprueba mirando `cache_read_input_tokens`: si sale
cero mensaje tras mensaje, algo variable se coló en el prefijo.

---
### 2026-08-28 · Juditos · asistentes de IA
**Qué aprendimos:** el bot de un cliente es una vía de captación si se le
dan tres reglas, y un problema si no. (1) Dice quién lo construyó **solo si
le preguntan** — meterlo en saludos y despedidas convierte el servicio del
cliente en publicidad nuestra y molesta. (2) No habla nunca del modelo ni de
su proveedor: el crédito es de la casa, no de la tecnología. (3) No finge
ser humano; si le preguntan si es un bot, lo dice. Además de ser lo honesto,
varios países ya lo exigen por ley. Y conviene un interruptor por cliente:
siempre habrá uno que quiera marca blanca.

---
### 2026-08-30 · Curación (JudoMarketing) · —
**Qué se curó:** los aportes de las ramas `claude/kit-cerebro` (se mide no se
mira; el comentario no es prueba; la tipografía equilibra; un solo color de
acción; el material real manda; la serie de espaciado) y
`claude/footer-dos-sitios-1ctrw3` (creator vs sameAs en el schema) pasaron a
CEREBRO.md como reglas 9-15, y kit/cerebro quedó referenciado como el cerebro
profundo del kit.

---
### 2026-08-30 · Curación 2 (JudoMarketing) · —
**Qué se curó:** los seis aportes de Judito-Ads y los cuatro de JuditoWEBS
pasaron a CEREBRO.md como sección 3, «Reglas de construcción», ordenados
alrededor del patrón que comparten: lo que falla en silencio. Dos entradas
nuevas al checklist de entrega. Y se corrigió la instrucción de push que
apuntaba al fantasma `master` — el hallazgo de JuditoWEBS afectaba al prompt
que llevan todos los proyectos.

---
### 2026-08-30 · Curación 3 (JudoMarketing) · —
**Qué se curó:** los cuatro aportes de Juditos entran a CEREBRO.md como
subsección «Asistentes de IA» dentro de las reglas de construcción: el modelo
no es fuente de verdad (la validación vive en la herramienta, no en el
prompt), las notas internas fuera de la conversación, nada variable en el
prefijo cacheado, y las tres reglas del bot como vía de captación.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** cuando dos apps de la casa se hablan por HTTP, una puede
estar completa y la otra no haber implementado su mitad. Next responde 405 al
método que falta, y en pantalla eso se ve igual que un botón roto. Al montar
un puente entre apps hay que probar el viaje ENTERO, no cada lado por su
cuenta — y el lado que llama debe distinguir «me dijeron que no» de «no me
contestaron», porque son problemas distintos.
**Evidencia:** el admin de judomarketing.net llevaba tiempo con los botones
de suspender y eliminar cuentas de JuditoADS. El puente estaba bien hecho y
hasta preveía el caso; lo que faltaba era el `POST` del otro lado. Cada clic
salía 405 y parecía un fallo del portal.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** al dar de baja algo que mueve dinero, el orden es la
función: primero se corta el gasto (anuncios, cobros) y solo después se toca
el registro. Y si el gasto no se puede cortar, la baja se NIEGA y dice por
qué. Una baja a medias deja anuncios corriendo sin dueño y cobros a un
cliente que ya no existe en el sistema — y nadie se entera hasta ver la
factura. Además, baja lógica antes que borrado físico: el historial de
facturación no se puede recuperar.
**Evidencia:** al implementar «eliminar cuenta» en JuditoADS, el caso que
más valor tiene es el que se niega: si Meta no acepta pausar las campañas
(token caducado, por ejemplo), no se borra nada y se le dice a
Administración qué campaña parar a mano.

---
### 2026-08-30 · Curación 4 (JudoMarketing) · —
**Qué se curó:** los dos aportes nuevos de Judito-Ads entran a las reglas de
construcción: el puente entre apps se prueba entero (y quien llama distingue
«me dijeron que no» de «no me contestaron»), y el orden de una baja que mueve
dinero — primero cortar el gasto, y si no se puede, negar la baja. Con esto
Judito-Ads ya implementó el POST que faltaba, así que los botones de suspender
y eliminar del portal dejan de dar 405.

---
### 2026-08-28 · Juditos · infraestructura
**Qué aprendimos:** montar una app hermana bajo judomarketing.net con un
rewrite tiene dos trampas que no salen en el build. La primera: los rewrites
de Next se **hornean en el build**, no se leen al arrancar — poner la URL en
las variables y reiniciar no hace nada, hay que volver a desplegar. La
segunda, peor: el middleware de idiomas de next-intl se traga la ruta y la
redirige a `/es/loquesea`, así que la app nunca carga. Cada app montada tiene
que estar excluida **en los dos sitios**: en el rewrite de `next.config.ts` y
en el `matcher` de `src/middleware.ts`.
**Evidencia:** con `JUDITOS_URL` puesta al arrancar, `/juditos` seguía dando
el 404 del sitio principal; solo apareció en `routes-manifest.json` tras
reconstruir. Y la exclusión del middleware ya estaba escrita para
`juditoads` desde antes — alguien pagó ese precio primero.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** comprobar una web «pidiendo las páginas de verdad» solo
vale si el servidor está sirviendo la compilación que acabas de hacer.
Reconstruir por debajo de un servidor ya arrancado no lo actualiza: sigue con
los trozos viejos, el navegador recibe una mezcla y pinta «Application error»
en pantallas que están perfectas. Es peor que no comprobar nada, porque manda
a cazar un fallo que no existe. Se mata el servidor y se arranca de nuevo
DESPUÉS de compilar. Y se comprueba que murió mirando el proceso, no el
puerto: aquí la herramienta del puerto no enseñó nada mientras el servidor
seguía vivo, y el segundo arranque falló en silencio con «address already in
use» dentro de su log.
**Evidencia:** 22 comprobaciones en rojo de golpe, con errores de hidratación
de React en pantallas que ni se habían tocado. No había ningún fallo: el
proceso que respondía llevaba tres minutos vivo con la compilación anterior.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** cuando a una cuenta se le perdona el cobro (la del dueño,
una de demostración, la de un socio), la excepción tiene que ser SOLO de
dinero. Si se cuela en el permiso de entrar, esa cuenta deja de poder
suspenderse o darse de baja para siempre, y nadie lo nota hasta el día que
hace falta cerrarla. La regla que funciona: la excepción de cobro se salta lo
que pone la facturación (prueba vencida, pago fallido, cancelada) y NO se
salta lo que puso una persona a propósito (suspendida, dada de baja).
**Evidencia:** al dejar entrar gratis la cuenta del dueño, la primera versión
devolvía «sí» antes de mirar nada más. Con eso, un «suspender» desde el panel
de Administración se habría guardado en la base sin efecto ninguno: la cuenta
habría seguido entrando como si nada.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** un error que se repite casi nunca es un error nuevo: es
el mismo de siempre, que nadie pudo identificar porque por el camino se le
cayó el dato que lo identifica. Cuando se envuelve un fallo ajeno, hay que
conservar SU código —no solo el texto—, y anotarlo antes de traducirlo a la
frase amable que ve el cliente. Y hay que separar tres cosas que se mezclan
en un solo «no se pudo»: lo que se arregla solo si se reintenta (un 500, un
límite de tasa), lo que arregla el cliente (un permiso), y lo que es culpa
nuestra. Con esa separación, una parte de los errores deja de existir sin
que nadie los vea, y la otra ya se puede buscar.
**Evidencia:** el selector de publicaciones traducía CUALQUIER fallo a
«no pudimos comunicarnos con Meta», sin registrar nada. Cuando el cliente
decía «me sale un error» no había absolutamente nada que mirar. La causa
más probable resultó ser lentitud —la llamada tardaba más que el tope de 8 s
en páginas con historia— y llevaba meses saliendo como error.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** `class MiError extends Error` con el `target` de
TypeScript sin fijar (o sea ES5) rompe la cadena de prototipos: el objeto
conserva todos sus campos y aun así `e instanceof MiError` da FALSO sobre el
mismísimo objeto que se acaba de lanzar. Es de los fallos más difíciles de
ver que existen, porque el dato está ahí delante y el `if` no entra: el
error se cae a la rama genérica y el usuario recibe el mensaje equivocado.
Toda clase de error propia lleva `Object.setPrototypeOf(this, X.prototype)`
en el constructor, y las decisiones importantes se toman con un guardia
propio (una marca, `X.es(e)`), no con `instanceof`.
**Evidencia:** salió en una prueba, no en producción: el aviso «reconecta tu
Facebook» podía degradarse a «no pudimos comunicarnos con Meta» sin que
nada fallara visiblemente. Estaba en las tres clases de error del proyecto.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** para saber qué arreglar primero no sirve un registro
línea a línea —a miles de usuarios son millones de filas que nadie lee— ni
sirve el orden de las quejas. Sirve un contador agrupado por (usuario, área,
tipo de fallo) y una lista ordenada por CLIENTES AFECTADOS, no por número de
veces: uno que reintenta cuarenta veces hace mucho ruido, pero un fallo que
toca a trescientos una vez cada uno es mucho más grave. Y la clave de
agrupación nunca lleva el texto del error, que el proveedor reescribe y
partiría el mismo fallo en diez.
**Evidencia:** con eso, «veo muchos errores repetidos» pasó de ser una
sensación a una lista de la que se puede sacar el primero y arreglarlo.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** un «✅ listo» encima de una pantalla vacía es peor que un
error: le confirma a la persona que todo salió bien y a la vez no le da nada
con que seguir, así que se queda esperando algo que no va a pasar. Cuando un
proceso depende de requisitos que el usuario no controla ni conoce, hay que
enseñarle la lista de requisitos con el estado de cada uno y el arreglo al
lado — y el «listo» solo aparece si de verdad puede continuar. Y cuando no
se puede saber desde el código si le falta algo, se le PREGUNTA en vez de
adivinar: él es el único que sabe si lo que no vemos existe.
**Evidencia:** quien conectaba Facebook sin cuenta publicitaria veía
«✅ cuenta conectada» y una lista vacía. Mucha gente tiene su cuenta de
negocio pero sin compartir con su perfil personal: jura que la tiene, y la
tiene, solo que el sistema no la ve. Preguntar «¿está aquí tu cuenta?»
resuelve en un clic lo que ninguna comprobación automática podía decidir.
### 2026-08-28 · Juditos · infraestructura
**Qué aprendimos:** Vercel no ejecuta procesos que corren sin parar, así que
cualquier app nuestra con una cola de trabajos se despliega rota en silencio:
recibe y no procesa. La forma que funciona son dos caminos sobre el mismo
código: el webhook responde al que llama y **sigue trabajando con
`waitUntil()`** con la función viva, y un cron cada minuto recoge lo que haya
quedado. El cron al minuto necesita plan Pro; en Hobby corre una vez al día y
deja de ser red de seguridad.
**Evidencia:** el portal encolaba los mensajes y ninguno se contestaba,
porque `npm run worker` simplemente no existe allí.

---
### 2026-08-28 · Juditos · infraestructura
**Qué aprendimos:** un despliegue puede fallar por pedir credenciales que no
necesita. `prisma generate` solo lee el schema, pero exigía DATABASE_URL y
tumbaba el build; y el cliente de base de datos, si se construye al importar
el módulo, hace que el análisis de rutas de `next build` también las pida.
La regla: **construir no debería necesitar acceso a la base de datos**.
Cliente perezoso (se crea en el primer uso) y config que lea las variables
con `process.env` en vez de con helpers que lanzan si faltan.
**Evidencia:** cinco despliegues seguidos en Error, todos en `npm install`,
antes de que nadie mirara los logs.

---
### 2026-08-28 · Juditos · infraestructura
**Qué aprendimos:** una variable de entorno **declarada pero vacía** no es lo
mismo que ausente, y rompe distinto. Los paneles se llenan de marcadores
vacíos que alguien dejó preparados; si el código valida tipos, un `""` donde
se espera un número tumba la app entera con "Invalid input" y el motivo solo
aparece en los logs de ejecución, no en el build. Conviene tratar la cadena
vacía como ausente antes de validar, para que el valor por defecto entre.
**Evidencia:** `WORKER_POLL_MS=""` devolvía 500 en todas las rutas de la app.

---
### 2026-08-28 · Juditos · precio de un producto con IA
**Qué aprendimos:** el precio de un servicio con IA hay que **medirlo antes de
publicarlo**, y el modelo que se elige es la diferencia entre ganar y perder.
Con 3 bots y 2.000 mensajes al mes: Opus cuesta $40,70, Sonnet $16,28 y Haiku
$8,14. Sobre un plan de $20, Opus pierde el doble de lo que cobra. Bajar de
modelo no es recortar calidad **si la arquitectura no le pide al modelo que
recuerde datos**: precios, stock y huecos de agenda se validan contra la base
dentro de las herramientas, así que al modelo solo se le pide conversar bien.
**Evidencia:** el plan iba a salir a $20 con Opus por 2.000 mensajes; el
cálculo con los precios reales lo paró antes de escribirlo en la web.

---
### 2026-08-28 · Juditos · precio de un producto con IA
**Qué aprendimos:** el gasto que no se ve en un bot no son los mensajes, es
**mantener su "cerebro" caliente en la caché**. Se paga aunque no escriba
nadie, y se multiplica por cada bot. Con TTL de una hora la escritura cuesta
**2× el precio de entrada** (con 5 minutos, 1,25×), y eso hay que meterlo en
la cuenta: tres cerebros de 4.000 tokens costaban $8,64 al mes solo en
mantenerse vivos. Cada lectura renueva la vida de la caché, así que el TTL
largo sale a cuenta con tráfico seguido y sale caro con tráfico goteando.
**Evidencia:** el primer cálculo del margen se hizo con 1,25× y daba 67%; con
el multiplicador correcto bajaba a 59%, y en Opus pasaba de "justo" a
"pierdes dinero".

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** al arreglar un patrón hay que barrer TODOS los sitios
donde vive, no el primero que duele. Si el mismo trabajo está hecho dos
veces en dos archivos —un ayudante para leer y otro para escribir, una
utilidad copiada entre módulos—, arreglar uno deja el otro roto y encima da
la sensación de estar resuelto, que es lo peor de todo: nadie vuelve a
mirarlo. Después de tocar algo así, `grep` por la función, por el nombre y
por el patrón, y se arreglan todos en el mismo cambio.
**Evidencia:** se arregló que los errores de Meta conservaran su código en
las llamadas de LECTURA y se quedaron sin arreglar las de ESCRITURA, que
viven en otro archivo con su propio ayudante. O sea que justo el camino que
más se rompía —publicar y promocionar publicaciones— siguió lanzando
errores ciegos un día más, y con la sensación de estar ya resuelto.

---

### 2026-08-28 · Judito-Ads · SaaS de anuncios
**Qué aprendimos:** un camino sin pruebas no se rompe una vez, se rompe
tres. Cada arreglo se hace a ciegas encima de lo que tocó el anterior, y
como no hay nada que fije lo que el proveedor acepta, el arreglo de hoy
reintroduce el fallo de la semana pasada. La regla que funciona: cuando un
mismo flujo falla por segunda vez, lo primero no es arreglarlo — es
escribirle la prueba, con el proveedor simulado y con los errores REALES
metidos dentro, con su texto y su número. Cuesta una hora y evita la
tercera.
**Evidencia:** el flujo de promocionar una publicación se rompió tres veces
en producción sin tener una sola prueba. Al escribirla por fin, encontró un
fallo nuevo en la primera ejecución — uno que ya estaba desplegado y que
nadie había notado.

---

### 2026-08-28 · Juditos · cuentas compartidas entre productos
**Qué aprendimos:** cuando dos productos de la casa tienen que compartir
cuenta, la respuesta NO es copiar la tabla de usuarios en las dos bases. Dos
copias de una contraseña son dos sitios que se pueden filtrar y dos
registros que se desincronizan el día que alguien cambia su correo. Lo que
funciona: uno de los dos es el dueño de la identidad (el que cobra y donde
la gente se registra) y el otro le pregunta. Si comparten dominio, la cookie
de sesión llega sola de un lado al otro, así que basta un endpoint que
devuelva "de quién es esta cookie" a quien la traiga. Sin secreto compartido:
la cookie ES la credencial, y ese endpoint solo devuelve los datos de quien
la trae.
**Evidencia:** Juditos tenía su propia tabla de usuarios y su propio login.
El dueño intentaba entrar con su cuenta de Judito Ads y le decía que no
existía. No era un fallo de contraseña, eran dos registros distintos y solo
uno tenía usuarios de verdad.

---

### 2026-08-28 · Juditos · multi-zona con basePath
**Qué aprendimos:** en un sitio partido en zonas (`/`, `/juditoads`,
`/juditos`), un `redirect("/otra-zona")` desde dentro de una zona sale con
el prefijo de esa zona pegado delante: desde Juditos, `/juditoads/login` se
convierte en `/juditos/juditoads/login`. Todo salto entre zonas tiene que ir
con dirección completa, y el host hay que sacarlo de `x-forwarded-host`: la
petición llega reenviada al despliegue de Vercel, y el host que se ve desde
dentro no es el que ve la persona.
**Evidencia:** el middleware de Judito Ads guardaba el destino sin el
prefijo, así que quien entraba a `/juditoads/app` sin sesión acababa después
del login en `judomarketing.net/app`, que no existe.

---

### 2026-08-28 · Juditos · middleware de Next
**Qué aprendimos:** `NextResponse` construye una URL con lo que haya en la
cabecera `Location`, y una ruta relativa no es una URL válida. No falla la
redirección: falla el middleware entero, con
`MIDDLEWARE_INVOCATION_FAILED` y un 500 antes de llegar a ninguna página. Si
hace falta redirigir, siempre dirección completa.
**Evidencia:** se cambió a Location relativo justamente para no sacar a
nadie del dominio, y el portal entero devolvió 500 a todo el que entrara sin
sesión. El error solo aparece en los logs de ejecución, con un
`TypeError: Invalid URL` sin ninguna pista de dónde.

---

### 2026-08-28 · Juditos · dos portales que se rebotan
**Qué aprendimos:** cuando el portal A manda al acceso de B y B devuelve a
A, si A no reconoce la sesión el navegador se queda rebotando entre los dos
para siempre, con la pantalla en blanco. Hace falta un sitio donde parar: una
ruta que reparta (mira quién eres y te manda a tu portal) con una marca de
"ya vengo de vuelta". Si al volver sigue sin reconocerte, no redirige otra
vez: lo dice y ofrece reintentar. Cuesta veinte líneas y convierte una caída
del otro servicio en un mensaje en vez de un cuelgue.
**Evidencia:** lo mismo hace falta para quien tiene cuenta pero no ha
contratado el producto: si la página protegida le echa al login y el login le
devuelve a la página protegida, el bucle es el mismo. Ahí el reparto le lleva
a "todavía no tienes esto, actívalo", que es la respuesta correcta.

---

### 2026-08-30 · AC-Customs · la voz del titular
**Qué aprendimos:** «promesa dicha por una persona» no significa coloquial.
La persona que habla en el H1 es un profesional que cotiza, no un amigo que
exagera. La prueba: si el titular podría decirse en broma, está mal escrito.
El registro de la casa es «Moderniza el interior de tu auto», nunca «Te
lleno el techo de estrellas».
**Evidencia:** el primer hero de AC Customs decía «Te lleno el techo de
estrellas» y la reacción del dueño fue literal: «me dio fue risa jajaja,
debe ser algo más profesional». El titular que sí pasó fue «Moderniza el
interior de tu auto».

---

### 2026-08-30 · AC-Customs · el efecto que el cliente describe
**Qué aprendimos:** cuando el cliente describe un efecto con precisión —
«luces que salgan del fondo de tu pantalla y vayan subiendo poco a poco
desvaneciéndose lentamente, solo a los orillos» — eso es una especificación,
no una inspiración. Se construye ESE movimiento, con ese origen, esa
dirección y ese desvanecimiento. Interpretarlo (resplandores fijos en las
esquinas) se recibe como no haberlo hecho.
**Evidencia:** la primera entrega llevaba brillos de esquina y la respuesta
fue «con respecto a lo que te pedí, no lo hiciste». La segunda llevaba
cometas naciendo abajo y subiendo por los orillos, y esa quedó.

---

### 2026-08-30 · AC-Customs · neón que se deja leer
**Qué aprendimos:** el neón en pantalla es luz DETRÁS de la letra, nunca
letra rellena de color o degradado: letra blanca con `text-shadow` contenido
(6px al 50 %, 22px al 32 %, 55px al 22 % del color de familia). El brillo
tiene presupuesto: si un texto cuesta leerse, sobra brillo. Y toda luz
animada se difumina — blur, degradado suave en AMBOS extremos, sin cabeza
blanca, opacidad con tope (.55) — o deja de parecer luz.
**Evidencia:** dos rondas de corrección del dueño, con sus frases: «mejor
estaría la letra con luz de neón atrás» sobre los titulares rellenos de
degradado, y «parece un palo de color, debe difuminarse mejor» sobre los
cometas nítidos de 2 px con cabeza brillante. Los valores finales están en
`docs/DISENO.md` del repo accustoms-miami.

---

### 2026-08-30 · AC-Customs · profundidad en fondo oscuro
**Qué aprendimos:** sobre fondo oscuro, la profundidad se hace con luz: las
tarjetas iluminan con el color de su familia (borde y resplandor que suben
al pasar el cursor), las secciones encienden al entrar en pantalla. Tarjetas
planas sobre fondo oscuro leen como maqueta sin terminar. Y cuando aún no
hay fotos reales, no se ponen marcadores grises: se dibujan escenas
vectoriales de referencia en el lenguaje del sitio, se dejan si se ven bien
y se reemplazan por las fotos del cliente cuando lleguen.
**Evidencia:** el veredicto de la versión con tarjetas planas fue «siento
que el diseño estuvo muy pobre... los cuadros con texto deberían iluminar,
así le das profundidad». Las escenas vectoriales (arco estrellado, puerta
con barrido ambiental, pantalla CarPlay) pasaron su prueba de «si quedan
bien las dejas, si no las quitas».

---

### 2026-08-30 · AC-Customs · página de citas
**Qué aprendimos:** una cita de servicios se pide con selección MÚLTIPLE y
estimado sumado — la gente contrata techo y ambiente en el mismo carro — y
si el negocio cobra directo, la página lo dice visible: «aquí no se cobra
nada; el pago es directo con el taller el día del servicio». Quita el miedo
de sacar la tarjeta y refleja cómo cobra el negocio de verdad.
**Evidencia:** correcciones directas del dueño a la primera versión: «que
puedan contratar más de un servicio, no solo uno» y «se cobra al cliente,
no por la página».

---

### 2026-08-30 · JudiMental · la marca de un app
**Qué aprendimos:** el nombre se verifica ANTES de encariñarse: tiendas (la
API de búsqueda de iTunes y Google Play), marcas registradas (USPTO, EUIPO)
y dominio (RDAP). Un nombre que suena libre puede chocar con una marca
registrada de un rubro vecino. Y el logo nunca es texto con una fuente
instalada: el wordmark se traza a caminos SVG (con fontTools: contornos,
kerning y todo), para que se vea idéntico en cualquier máquina y tienda.
**Evidencia:** «JuniAPP» chocaba con JUNI, marca ya registrada por Juni
Technology AB en software. La verificación salió a tiempo: el mismo día se
pivotó a JudiMental, se verificó limpio y el dueño compró judimental.com.
El wordmark trazado está en `assets/marca/` del repo juniapp.

---

### 2026-08-30 · Mil-Colores · el nombre vuelto función
**Qué aprendimos:** el mejor nombre de marca es el que se puede volver
función. Mil Colores dejó de ser solo un nombre cuando la pregunta central
de la app pasó a ser «¿De qué color estás hoy?»: el registro emocional del
día se hace eligiendo un color, y el historial es una malla de colores que
enseña el proceso sin una sola cifra. Antes de inventar mecánicas para una
app, mirar si el nombre ya trae una.
**Evidencia:** la pantalla «Tu proceso» del lienzo de Mil Colores: «los
primeros días casi todo era gris; los últimos ya no» dicho con puntos de
color, sin números ni gráficas.

---

### 2026-08-30 · Mil-Colores · el portal del profesional
**Qué aprendimos:** en una app de acompañamiento, el lado del profesional
solo pide las decisiones que únicamente esa persona puede tomar (qué sube,
audio o video, portada, a qué serie va) y nada más. Su panel muestra
TOTALES, nunca personas: puede ver que la calma subió, no quién está mal —
esa línea es lo que hace la app segura de usar y de recomendar. Y el
teléfono de crisis jamás se inventa ni se deja bonito de relleno: va como
hueco marcado hasta tener el real del país.
**Evidencia:** el portal de Hulda quedó en tres pantallas (subir, panel,
sillas de cordialidad) porque todo lo demás no era decisión de ella. El
panel agregado quedó anotado en el lienzo como decisión a confirmar con
ella.

---

### 2026-08-30 · Mil-Colores · revisión sin login
**Qué aprendimos:** para que el cliente final (o su cliente) revise un
diseño sin cuenta, el formato es una página-galería con las imágenes
embebidas, publicada como artifact: esa sí puede hacerse pública con el
interruptor de compartir. El lienzo de diseño con capacidad de exportar NO
sirve para eso — solo se comparte dentro de la organización.
**Evidencia:** Hulda necesitaba ver Mil Colores sin log in; el lienzo no
podía hacerse público y la galería de imágenes sí.

---

### 2026-08-30 · La casa · a qué rama van los aportes
**Qué aprendimos:** la advertencia del 27 envejeció: `master` ya existe, es
la default y carga los aportes más nuevos; la rama
`claude/judo-marketing-redesign-ci2rj5` se quedó atrás. La regla que no
envejece: antes de empujar, `git ls-remote --symref origin HEAD` y mirar en
qué rama está la última entrada de ESTE archivo; se empuja a la que va
adelante.
**Evidencia:** hoy este archivo tenía 545 líneas en `master` y 486 en la
rama del rediseño. Seguir la instrucción del 27 al pie de la letra habría
mandado los aportes nuevos a la rama vieja.

---

### 2026-08-30 · Todos · la vara del dueño
**Qué aprendimos:** hoy hubo tres proyectos y la distancia entre la primera
entrega y la aprobada fue siempre la misma: (1) lo que el cliente describe
se construye literal antes de interpretarlo; (2) la voz es profesional
aunque la regla diga «promesa dicha por una persona» — persona seria, no
colega bromeando; (3) los efectos existen para dar profundidad, no para
verse: luz detrás de la letra, brillo con tope, todo difuminado, y si algo
cuesta leerse, sobra efecto. Una entrega que ignora cualquiera de las tres
se recibe como «ni cerca», aunque técnicamente esté bien hecha.
**Evidencia:** el mismo dueño, el mismo día: «el diseño estuvo muy pobre»
sobre la v1 de AC Customs y «excelente» sobre la v3, separadas solo por
esas tres correcciones. Y su cierre: «mira la diferencia del website que tú
me entregaste a este; no están ni cerca uno del otro».
