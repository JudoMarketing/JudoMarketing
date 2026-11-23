# Cobros de suscripciones (Stripe de Judo Marketing)

Pedido de Junior, 23 de noviembre de 2026: correos automáticos al cliente
cuando su pago no pasa, y una revisión en Stripe un día después de que vence
cada suscripción; si no pagó, se le avisa con el enlace para completar el
pago. The Notes tiene su propia cuenta de Stripe y no entra aquí.

## Cómo funciona

| Cuándo | Qué pasa | Dónde |
| --- | --- | --- |
| Un cobro falla (primer intento) | Al cliente: «Tu pago no pasó», con el botón **Completar mi pago** (la factura de Stripe, donde paga con la misma tarjeta o con otra). A admin: el aviso de siempre. | `src/app/api/stripe/webhook/route.ts` |
| Un día antes de cada renovación | **Lo que no se pagó se suma al mes siguiente:** cada factura sin pagar de esa suscripción pasa como una línea «Mes pendiente» a la próxima factura y la vieja se anula. El cliente paga los dos meses juntos. A admin, en amarillo. | `acumular` en `src/lib/cobros.ts`, desde la revisión diaria |
| Un día después de cada vencimiento | Revisa la última factura de cada suscripción cuyo pago venció hace 1 a 3 días. **El pago vence el día de la renovación**, también en quien paga por factura (aunque Stripe le dé días para pagar). Si no está pagada: al cliente, «Tu pago sigue pendiente», con el mismo botón. A admin: el resumen (pagadas y sin pagar). | `src/app/api/cobros/revision/route.ts`, cron diario 14:07 UTC (9:07 a. m. en Miami) |
| Cada lunes | A admin: cada cliente con su próxima fecha de pago. **En amarillo** los que tienen algo: lo que deben y desde cuándo, cuántos meses, tarjeta rechazada, sin tarjeta guardada, días para pagar de más o una cancelación programada. | la misma ruta |

- **Cada aviso sale una sola vez por factura:** queda anotado en la metadata
  de la factura (`judo_aviso_fallo`, `judo_aviso_revision`).
- **El idioma** es el que el cliente tiene en Stripe (Customer → Language).
  Si no tiene, el correo va en español y en inglés.
- **El website de cada suscripción:** el anotado en el cliente de Stripe
  (metadata `website`), el de `COBROS_WEBSITES` en Vercel o el del portal por
  el correo del cliente, en ese orden.
- **Los textos** están en `src/lib/cobros.ts` (función `textos`).

## La regla de Junior (23 de noviembre de 2026)

«Es un servicio mensual: si un mes no pagan, ese mes se acumula para el otro;
el siguiente mes deben pagar doble.» El pago vence el día de la renovación y
no se espera al mes siguiente. Ejemplo: si el mes que empieza el 16 de
noviembre no se paga, el 16 de diciembre la factura trae noviembre y
diciembre juntos.

Para que funcione, en Stripe:
- **Settings → Billing → Subscriptions and emails → Manage failed
  payments:** cuando se acaban los reintentos, la suscripción queda
  **past due** (no cancelada). Si se cancela, no hay mes siguiente donde
  sumar la deuda.
- **Quien paga por factura** (send_invoice) tiene 1 día para pagar, no 30.

## Quién recibe los correos

Desde el 23 de noviembre de 2026, **el cliente** (con copia oculta a admin).
`ENVIAR_A_CLIENTES` en `src/lib/cobros.ts`; en `false`, le llegan solo a
admin con un aviso arriba de a quién le llegarían: sirve para probar textos
nuevos.

## Qué clientes pagan por Stripe

Al 23 de noviembre de 2026, según Junior:
- **Por Stripe:** HR Gutters, RBT Corner, Johan Moreno Tailor (por factura,
  con días para pagar) y Paradise Ranch 22.
- **Pachy Pinchos:** su suscripción todavía no empieza. Junior avisa cuando
  pague para sumarlo.
- **El resto de los clientes no paga mensualidad.**

El website de cada cliente de Stripe está en la variable `COBROS_WEBSITES`
de Vercel (proyecto judo-marketing, producción): un JSON
`{"cus_…": "dominio"}`. No va en el repositorio, que es público. Un cliente
nuevo se agrega ahí y se vuelve a publicar el sitio para que lo tome.

## A mano

```bash
# El inventario de suscripciones, ya (le llega a admin):
curl -H "Authorization: Bearer $LEADS_SECRET" "https://www.judomarketing.net/api/cobros/revision?inventario=1"
```

La respuesta trae solo conteos; los datos de los clientes van por correo.

## Correos que no lleguen a spam

- **Cada correo sale con versión en texto plano** además del HTML
  (`textoDeHtml` en `src/lib/email.ts`): un correo solo en HTML suma puntos de
  spam en Gmail y Outlook.
- **El dominio está bien configurado** (revisado el 23 de noviembre de 2026):
  SPF de Google (`include:_spf.google.com`), DKIM `google._domainkey` y DMARC
  `p=quarantine`.

## En Stripe

- **Acceso de Vendito:** el conector de Stripe en claude.ai, cuenta Judo
  Marketing, solo lectura.
- **Webhook:** `https://www.judomarketing.net/api/stripe/webhook` con los
  eventos `invoice.payment_failed` y `customer.subscription.deleted`.
- **Correos de Stripe al cliente** (Settings → Billing → Subscriptions and
  emails → «Send emails when card payments fail»): **se quedan prendidos.**
  Junior quiere que lleguen los dos, el de Stripe y el nuestro.
- **Reintentos:** Stripe reintenta el cobro solo (Smart Retries). Nuestros
  correos no cambian eso.
