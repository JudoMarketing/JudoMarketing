# Estrategia de crecimiento de Judo Marketing

Junior delegó la estrategia de internet el 2 de octubre de 2026: él hace el
trabajo con los clientes y los chats de Claude cuidan lo de internet. Este
documento es el mapa común. Lo leen el chat de Judo Marketing, la auditoría
de los lunes y cualquier sesión que toque ventas.

**La meta:** $10,000 al mes. **La meta de fondo:** que Judo Marketing sea
un referente, no un proveedor más (Junior, 25 de septiembre de 2026).

**Cómo se usa:** cada parte tiene estado, dueño y cómo se mide. Una parte se
cierra cuando está en producción y medida, no cuando está escrita. Lo que
dependa de una decisión de Junior lo dice arriba, con la pregunta exacta.

---

## Las cuentas

Con los precios de hoy (`src/content/pricing.json`), una mezcla que llega:

| Fuente | Cuántos | Al mes |
| --- | --- | --- |
| Websites de suscripción, promedio $150 | 30 | $4,500 |
| Asistente o JuditoADS como extra | 15 | $900 |
| Cuota de inicio de $130 | 3 a 4 Esenciales nuevos | $400 a $520 |
| Anuncios manejados por nosotros, si se aprueba (parte 6) | 6 a $400 | $2,400 |
| Websites Complejos y apps, cotizados | 3 a 4 | $1,500 a $2,000 |
| **Total** | | **cerca de $10,000** |

La prospección por correo sola trae 1 o 2 clientes al mes: hacen falta las
llamadas, los referidos y el nicho para cerrar más rápido.

**Punto de partida:** lo que entra hoy al mes se ve en la pestaña Dinero del
portal (`/admin`). Junior lo anota aquí la primera vez: `$____ al mes, ___
clientes activos, fecha ____`.

---

## Las partes

| # | Parte | Estado | Dueño |
| --- | --- | --- | --- |
| 1 | Cuota de inicio y precios claros | ✅ En producción (2 oct 2026) | Hecho |
| 2 | Prospección que encuentra a quien no rankea, con precios en el correo | ✅ En producción (2 oct 2026) | Rutina diaria |
| 3 | Nicho de salud mental: página, keywords y prospección | ✅ En producción (2 oct 2026) | Rutina diaria |
| 4 | Llamadas diarias a la lista de la rutina | ⏳ Empieza Junior | Junior |
| 5 | Programa de referidos | ❓ Espera decisión | Junior decide, Claude construye |
| 6 | Anuncios manejados por nosotros | ❓ Espera decisión de precio | Junior decide, Claude construye |
| 7 | Casos de éxito con números | ❓ Espera datos de 3 clientes | Junior entrega, Claude escribe |
| 8 | Socios que ven negocios nuevos | ❓ Espera decisión | Junior decide |
| 9 | Presencia propia: Google, reseñas, directorios | ⏳ Pendiente de Junior | Junior, con la auditoría |
| 10 | Dominio aparte para la prospección | 🕒 Cuando el volumen suba | Junior compra, Claude configura |

### 1. Cuota de inicio y precios claros ✅

Website Esencial: $130 de inicio, una sola vez, con el primer mes. Websites
Complejos y Apps: sin cuota; los Complejos se cotizan y todo va dentro de
la mensualidad. En el sitio, el pago (Stripe lo cobra solo en la primera
factura), los contratos, la política, el chatbot y el guion de ventas.
**Se mide:** cuántas suscripciones Esenciales nuevas pagan la cuota (Stripe).

### 2. Prospección que encuentra a quien no rankea ✅

Regla de Junior: buscamos negocios que están en internet pero no hacen
ranking. Se guarda el puesto real de cada negocio en Google Maps y se aparta
a quien ya sale entre los 5 primeros con una página que funciona. Cada correo
dice la cifra real del precio y trae el bloque "Precios claros, sin
sorpresas". Detalle en `LEADS.md`.
**Se mide:** clics y respuestas por cada 100 correos (`GET
/api/leads?reporte=1`), comparando antes y después del 2 de octubre.

### 3. Nicho de salud mental ✅

Es donde ya tenemos pruebas: Denali CRT, RBT Corner y The Notes. Página
`/es/salud-mental` y `/mental-health` con esas tres referencias, precios y
preguntas de directores de clínica; 24 keywords en `SEO.md`; la rutina de
Estados Unidos corre primero este nicho (hasta 5 de los 10 del día) y esos
correos llevan "Ver nuestro trabajo" a la página del nicho.
**Se mide:** visitas a la página (GA4, `utm_content=salud_mental`), citas
agendadas que vienen de ahí, y puesto en Google de las keywords del nicho.
**Siguiente paso posible:** ABA for Happiness como cuarta referencia, si
Junior confirma que se puede mostrar.

### 4. Llamadas diarias ⏳

Cada informe de la rutina trae "negocios con teléfono y sin correo". Diez
llamadas al día, de lunes a viernes, con el guion de ventas
(`scripts/generate_guion_ventas.py`). Una llamada cierra mucho más que un
correo frío.
**Se mide:** llamadas hechas, conversaciones, citas. Junior lo anota una vez
por semana; si quiere, se arma una pestaña "Llamar hoy" en el portal.

### 5. Programa de referidos ❓

**Propuesta:** un mes gratis por cada cliente que un cliente nos traiga, con
un enlace propio por cliente en el portal y el registro automático.
**Decisión de Junior:** ¿un mes gratis está bien, o prefieres otro premio?

### 6. Anuncios manejados por nosotros ❓

JuditoADS ($20) es para quien hace sus anuncios solo. Un plan donde
nosotros manejamos la campaña cubre a los que no tienen tiempo.
**Decisión de Junior:** el precio mensual (propuesta: $300 a $500, aparte del
presupuesto que se le paga a Meta) y cuántas campañas incluye.

### 7. Casos de éxito con números ❓

Tres páginas con antes y después medidos (visitas, citas, pedidos, puesto en
Google). Es lo que más falta en la auditoría para ser referente.
**Lo que necesitamos de Junior:** permiso de 3 clientes y acceso a sus
números (Search Console, Analytics o su panel).

### 8. Socios que ven negocios nuevos ❓

Contadores, agentes de seguros y gestores de Sunbiz conocen dueños antes que
nosotros. **Propuesta:** 10 por ciento recurrente mientras el cliente siga.
**Decisión de Junior:** el porcentaje y si se firma con un contrato corto.

### 9. Presencia propia ⏳

Lo que la auditoría pide cada lunes y solo Junior puede hacer: Perfil de
Empresa de Google como negocio de área de servicio, 15 reseñas de clientes
actuales, LinkedIn, directorios, DMARC en `quarantine`. Una agencia que
critica la presencia de otros tiene que tener la suya en orden.

### 10. Dominio aparte para la prospección 🕒

Con 20 correos al día no hace falta. Si se sube el volumen, la prospección
se muda a un dominio aparte para que un mal día no afecte los correos de
clientes. Detalle en `LEADS.md`, "Entregabilidad".

---

## El marcador (se llena cada lunes)

| Semana | Ingreso mensual | Clientes activos | Correos enviados | Clics | Respuestas | Llamadas | Citas | Clientes nuevos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-05 | | | | | | | | |

La auditoría de los lunes llena lo que puede medir sola (correos, clics,
bajas, visitas) y deja en blanco lo que solo Junior sabe (ingreso, llamadas,
citas, clientes nuevos). Junior lo completa cuando quiera, o lo dice en el
chat y se anota.
