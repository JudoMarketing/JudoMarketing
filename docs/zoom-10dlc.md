# Campaña de SMS en Zoom Phone (10DLC) — qué pegar en cada campo

Lo que exigen las operadoras en EE. UU. para mandar textos desde un número de
empresa. Zoom solo es el intermediario; quien aprueba o rechaza es el registro
de campañas (TCR) y las operadoras. Fuentes: artículos de Zoom KB0010208
(checklist), KB0058681 (buenas prácticas) y KB0059576 (registro).

Lo que YA está en el sitio: aviso con la redacción exacta de Zoom en los dos
formularios que reciben teléfono (`/contact` y la cita), casilla de
consentimiento sin marcar por defecto, enlace a la política, y la política
con la sección 13 (programa de SMS) y la frase de no compartir datos con
terceros (sección 12).

## Rechazo 3107 (Direct Lending)

Fue un clic equivocado en el formulario: *Direct Lending or Loan Arrangement*
estaba en **Yes**. Judo Marketing no presta dinero. Va en **No**.

## Campos, tal cual

**Campaign name**
`Judo Marketing customer care campaign`

**Use case**
`Customer Care` (citas, respuestas a consultas, avisos de servicio). Si algún
día se mandan ofertas, se cambia a `Mixed` y se declara.

**Campaign description** (quién envía, a quién, qué sí, qué no, cuánto)
```
Judo Marketing (judomarketing.net), a web design and digital marketing agency
in Miami, FL, sends SMS to customers and prospects who opted in on our website
or texted us first. Content: appointment confirmations and reminders for video
calls booked at judomarketing.net/contact, replies to customer inquiries, and
service or billing notices for active clients. We do not send marketing blasts,
lending or financial offers, age-gated content, or third-party promotions.
Volume: about 1 to 4 messages per customer per month; under 200 messages per
month in total.
```

**Call to action / Message flow** (cómo da permiso el cliente)
```
Customers opt in on our website form at https://www.judomarketing.net/contact.
Next to the phone field there is an unchecked SMS consent checkbox with this
disclosure: "By providing a telephone number and submitting the form, you are
consenting to be contacted by SMS text message and agreeing to our Privacy
Policy. Message frequency may vary. Message and data rates may apply. Reply
STOP to opt out of further messaging. Reply HELP for more information. Consent
is not required to book." The form links to the privacy policy at
https://www.judomarketing.net/legal (Section 13, SMS Program). Customers may
also opt in by texting us first. Consent is recorded with date and time.
```

**Consent / opt-in mechanisms**: marcar *Web form* y *Inbound text*.

**Privacy policy URL**: `https://www.judomarketing.net/legal`
**Terms and conditions URL**: `https://www.judomarketing.net/legal#seccion-13`
**Website**: `https://www.judomarketing.net`

**Sample messages** (cada uno lleva la marca, el asunto y la frase de STOP)
```
Judo Marketing: your video call is confirmed for Mon, Sep 28 at 3:00 PM ET.
Join here: https://meet.google.com/xxx. Reply with STOP to stop receiving messages.
```
```
Judo Marketing: reminder, your call with us starts in 1 hour. Join here:
https://meet.google.com/xxx. Reply with STOP to stop receiving messages.
```
```
Judo Marketing: we received your inquiry and will reply today during business
hours. Questions? Call +1 305 934 9981. Reply with STOP to stop receiving messages.
```
```
Judo Marketing: your monthly invoice is ready in your portal. Thank you for
being with us. Reply with STOP to stop receiving messages.
```

**Campaign attributes**
| Atributo | Valor | Por qué |
| --- | --- | --- |
| Direct lending / loan arrangement | **No** | No prestamos dinero |
| Embedded links | **Yes** | Los mensajes llevan el enlace de Meet |
| Embedded phone number | **Yes** | Va nuestro teléfono en HELP |
| Age-gated content | No | |
| Affiliate marketing | No | |
| Subscriber opt-in / opt-out / help | Yes / Yes / Yes | |
| Number pooling | No | Un solo número |

**Opt-in keywords**: (vacío; el consentimiento es por web) — si Zoom obliga a
poner uno: `START`
**Opt-in message**:
`Judo Marketing: you are now subscribed to appointment and service texts. Msg freq varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel.`
**Opt-out keywords**: `STOP, END, CANCEL, UNSUBSCRIBE, QUIT`
**Opt-out message**:
`Judo Marketing: you have been unsubscribed and will not receive more texts. Reply START to resubscribe.`
**Help keywords**: `HELP, INFO`
**Help message**:
`Judo Marketing: for help contact admin@judomarketing.net or +1 305 934 9981. Msg & data rates may apply. Reply STOP to cancel.`

**SMS disclosure proof**: la captura del formulario de cita con el teléfono
escrito y la casilla a la vista (`judomarketing.net/contact`).

## Si vuelve rechazada

Mandar el texto exacto del rechazo. Cada código apunta a un campo:
- 3107 → atributos (lending, age-gated, links) no cuadran con la descripción
- descripción "vaga" → copiar la de arriba completa
- CTA → la captura no muestra la casilla o falta la frase exacta
- privacidad → falta la frase de no compartir con terceros (ya está en §12)
