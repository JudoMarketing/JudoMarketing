# Protocolo: "Vamos a crear un website nuevo"

Cuando el dueño diga esa frase (en este chat o en uno nuevo de Claude Code),
este es el procedimiento estándar para que cada sitio de cliente nazca
conectado al panel central de judomarketing.net.

**Regla de oro:** casi nada de lo que está aquí se consigue barato después.
Pedirle a un cliente el acceso a su Google a los tres meses te hace ver
desorganizado y muchas veces ya no responde igual. Se pide TODO el día 1,
en el mismo correo del contrato.

---

## Parte 1 · Los datos que Claude debe pedirle al dueño ANTES de empezar

### Del negocio

1. **Nombre del proyecto** (ej. "Barbería El Patrón")
2. **A qué se dedica** y quiénes son sus clientes
3. **Qué debe hacer el sitio**: tienda, citas, catálogo, cotizador, delivery…
4. **Marca**: logo, colores, tipografía. El **archivo original** del logo, no
   una captura de su web vieja: hace falta para muestrear la paleta y para
   recortar el motivo de la miniatura. El diseño va con la identidad DEL
   CLIENTE, no con el morado de Judo.
4b. **Material audiovisual en su MÁXIMA resolución** (fotos y video). Un clip
   de 720p se ve bien en una caja pequeña y se deshace en un hero a todo el
   ancho, y eso no se arregla codificando: es el techo del máster. Pedir 1440p
   o 4K cuando exista. Es de las cosas que "no se consiguen baratas después":
   a los tres meses el video ya no está o nadie sabe dónde.

### Del contrato y el dinero

5. **Plan y precio acordado** (el vigente en judomarketing.net/servicios, o personalizado)
6. **Moneda** y **día de cobro** (1 al 28)
7. **Método de pago** (Stripe, Zelle, transferencia, cripto)
8. **Días de gracia** antes de apagar por falta de pago (por defecto 7)
9. **Vendedor asignado** (o "yo" si es venta directa del dueño)
10. **Costos** que va a tener el sitio: dominio al año, hosting al mes,
    inversión en ads, servicios de terceros. **Sin esto el panel muestra
    facturación, nunca ganancia.**

### De las personas

11. **Contacto principal**: nombre, cargo, correo, WhatsApp, idioma
12. **Contacto de respaldo** (el día que el principal no conteste)
13. **Quién decide** y **quién paga** — con frecuencia no son la misma
    persona, y el día que haya que cobrar eso importa
14. **Zona horaria** del cliente

### Los accesos (lo más importante)

15. **Search Console** — que agregue a Judo como propietario de la propiedad
16. **Google Analytics 4** — ID de propiedad + acceso de lectura
17. **Perfil de Empresa de Google** — rol de administrador, si tiene local
18. **Meta Business** — acceso a la página y al pixel
19. **Procesador de pagos** — lectura, o mejor un webhook hacia el panel: así
    el ingreso llega del banco y no del sitio auto-reportándose
20. **Registrar del dominio** y **correo del negocio**

> En el portal, cada website trae la lista de accesos ya creada, con su
> estado: pendiente → solicitado → otorgado. No se cierra un alta con
> accesos en "pendiente" sin haberlos pedido por escrito.

---

## Parte 2 · Pasos del procedimiento

1. **Dar de alta el sitio** en judomarketing.net/admin → Websites → "Nuevo
   website". Elegir el estado correcto: "en desarrollo" o "ya está listo".
2. **Llenar el expediente** del sitio (botón por sección, dentro de la ficha):
   accesos, costos, dónde vive cada cosa, medición, cobro, contactos.
3. **Copiar la clave del kit** (🔐 Clave del kit → Copiar).
4. **Crear el repositorio** del cliente bajo el dueño `JudoMarketing` y el
   proyecto en Vercel. Anotar ambos en el expediente. Las variables que el
   build necesita van en `production` **y en `preview`**: si sólo están en
   production, la primera rama de trabajo que se abra rompe el despliegue con
   un error que no tiene nada que ver con el código (ver
   `cerebro/ERRORES.md` §13).
5. **Construir el sitio** con la base de Judo (Next.js + Tailwind), estética
   de la marca del cliente. El cómo está en [`cerebro/`](cerebro/README.md):
   `METODO.md` antes de la primera decisión de diseño, `VERIFICACION.md` antes
   de darlo por terminado. No se maqueta sin haber decidido —y justificado—
   qué mitad del logo manda y cuál es el material que prueba el servicio.
6. **Copiar los archivos de `kit/`** (middleware, página judo-suspendido, lib,
   componente JudoFooter) y configurar las variables (ver `kit/README.md`).
   `JUDO_KIT_KEY` va SIN el prefijo `NEXT_PUBLIC`: si la clave llega al
   navegador, cualquiera puede inyectar métricas falsas para siempre.
7. **Conectar la telemetría** con el contrato fijo de `reportMetrics`:
   - en cada venta: `reportMetrics({ orders: 1, revenueCents, currency })`
   - cron diario: `reportMetrics({ live: true, sessions, traffic, conversions, uptimePct })`
   El ingreso SIEMPRE en centavos enteros y con su moneda.
8. **Crear el portal del cliente** dentro de su propio sitio. Ahí ve el detalle;
   en judomarketing.net el dueño ve lo mismo pero resumido. Los dos tienen que
   calcular del MISMO número: si cada uno saca su cuenta, tarde o temprano hay
   una discusión con el cliente que no se puede ganar.
9. **Dominio**: registrarlo en la cuenta de registrar de Judo y anotar la
   fecha de expiración en el expediente.
10. **Probar el kill switch**: Deshabilitar → ver la página de la mascota
    triste → Reactivar. Queda escrito solo en la bitácora.
11. **Pasarle al cliente la lista de afirmaciones** antes de publicar: qué
    servicios, en qué sitios, con qué seguros, cuántos años, qué
    certificaciones y qué zona. Como lista, no enterradas en la maqueta. Lo
    que no confirme por escrito, fuera del sitio. Un dato de relleno que
    afirma algo del negocio se paga con la familia al teléfono.
12. **Anotar la entrega** en la bitácora del sitio.

---

## Parte 3 · Reglas fijas

- El código, el diseño y el dominio son de Judo Marketing durante los
  primeros 12 meses (Service Policy §7).
- El sitio del cliente **NUNCA** depende del panel central para funcionar
  (fail-open del kit).
- El pie SIEMPRE lleva "Website por Judo Marketing" con enlace y **sin
  `nofollow`**: es la red de enlaces del negocio.
- La lista `red` (sitios hermanos) solo se llena cuando el dueño de ese sitio
  es el mismo dueño de los otros.
- El portal de clientes de judomarketing.net mostrará SOLO métricas de
  inversión publicitaria cuando se conecte Meta/Google en la fase de ads; el
  comportamiento del website se ve en el portal propio de cada sitio.

### Antes de apagar un sitio por incumplimiento

La bitácora del expediente es la prueba. No se apaga nada sin que estén
anotados, en este orden:

1. `contrato_firmado`
2. `factura_enviada`
3. `recordatorio` (al menos uno)
4. `aviso_de_corte`
5. y que hayan pasado los **días de gracia** acordados

Suspender y reactivar se escriben solos en la bitácora. Lo demás se anota a
mano y es lo que respalda la decisión el día que alguien reclame.

### Si una clave del kit se filtra

Rotarla desde el expediente (🔐 → Rotar clave) y pegar la nueva en la
variable `JUDO_KIT_KEY` del Vercel de ese sitio. El sitio sigue funcionando
mientras tanto: solo deja de reportar hasta que se actualice.
