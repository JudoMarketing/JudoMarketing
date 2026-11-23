# Cobros de suscripciones (Stripe de Judo Marketing)

Pedido de Junior, 23 de noviembre de 2026: correos automáticos al cliente
cuando su pago no pasa, y una revisión en Stripe un día después de que vence
cada suscripción; si no pagó, se le avisa con el enlace para completar el
pago. The Notes tiene su propia cuenta de Stripe y no entra aquí.

## Cómo funciona

| Cuándo | Qué pasa | Dónde |
| --- | --- | --- |
| Un cobro falla (primer intento) | Al cliente: «Tu pago no pasó», con el botón **Completar mi pago** (la factura de Stripe, donde paga con la misma tarjeta o con otra). A admin: el aviso de siempre. | `src/app/api/stripe/webhook/route.ts` |
| Un día después de cada vencimiento | Revisa la última factura de cada suscripción que se renovó hace 1 a 3 días. Si no está pagada: al cliente, «Tu pago sigue pendiente», con el mismo botón. A admin: el resumen (pagadas y sin pagar). | `src/app/api/cobros/revision/route.ts`, cron diario 14:07 UTC (9:07 a. m. en Miami) |
| Cada lunes | A admin: todas las suscripciones con su cliente, su website, el monto y el próximo cobro. Las que no se emparejan con un website salen con «¿de quién es?». | la misma ruta |

- **Cada aviso sale una sola vez por factura:** queda anotado en la metadata
  de la factura (`judo_aviso_fallo`, `judo_aviso_revision`).
- **El idioma** es el que el cliente tiene en Stripe (Customer → Language).
  Si no tiene, el correo va en español y en inglés.
- **El website de cada suscripción** sale del portal: el correo del cliente
  en Stripe tiene que ser el mismo que el del cliente en el portal.
- **Los textos** están en `src/lib/cobros.ts` (función `textos`).

## Modo prueba (así empieza)

`ENVIAR_A_CLIENTES = false` en `src/lib/cobros.ts`: el correo que le tocaría
al cliente le llega a admin@judomarketing.net, con un aviso arriba que dice a
quién le llegaría. Se pasa a `true` cuando Junior:
1. aprueba los textos;
2. confirma qué suscripción es de qué cliente (el inventario de los lunes).

## A mano

```bash
# El inventario de suscripciones, ya (le llega a admin):
curl -H "Authorization: Bearer $LEADS_SECRET" "https://www.judomarketing.net/api/cobros/revision?inventario=1"
```

La respuesta trae solo conteos; los datos de los clientes van por correo.

## En Stripe

- **Webhook:** `https://www.judomarketing.net/api/stripe/webhook` con los
  eventos `invoice.payment_failed` y `customer.subscription.deleted`.
- **Correos de Stripe al cliente** (Settings → Billing → Subscriptions and
  emails → «Send emails when card payments fail»): si están prendidos, el
  cliente recibe dos correos por el mismo fallo. Se apagan cuando los
  nuestros salgan a clientes.
- **Reintentos:** Stripe reintenta el cobro solo (Smart Retries). Nuestros
  correos no cambian eso.
