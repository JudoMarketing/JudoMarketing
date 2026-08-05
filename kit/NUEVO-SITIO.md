# Protocolo: "Vamos a crear un website nuevo"

Cuando el dueño diga esa frase (en este chat o en uno nuevo de Claude Code),
este es el procedimiento estándar para que cada sitio de cliente nazca
conectado al panel central de judomarketing.net.

## Datos que Claude debe pedirle al dueño ANTES de empezar

1. **Nombre del proyecto** (ej. "Barbería El Patrón")
2. **Nombre del cliente** y su email
3. **Dominio deseado** (ej. barberiaelpatron.com)
4. **Plan y precio acordado** ($50 / $100 / $150 o personalizado)
5. **Vendedor asignado** (o "yo" si es venta directa del dueño)
6. **Fecha del primer cobro**
7. Qué debe hacer el sitio (tienda, citas, delivery, etc.)

## Pasos del procedimiento

1. El dueño (o Claude con acceso al admin) crea el sitio en
   judomarketing.net/admin → pestaña Websites → "Nuevo website" con los
   datos de arriba, y copia la **clave del kit** (botón 🔑 Kit).
2. Crear el repositorio nuevo del cliente (GitHub del dueño) y el proyecto
   en Vercel.
3. Construir el sitio con la misma base de Judo (Next.js + Tailwind, estética
   según la marca DEL CLIENTE, no la de Judo).
4. Copiar los archivos de `kit/` (middleware, página judo-suspendido, lib) y
   configurar las variables de entorno del kit con la clave copiada
   (ver kit/README.md).
5. Conectar telemetría: llamar `reportMetrics({ sales: 1 })` en cada venta
   del sitio, y un cron diario con `reportMetrics({ traffic, live: true })`.
6. Crear el portal de administrador DEL CLIENTE dentro de su propio sitio
   (ahí es donde el cliente ve el comportamiento de su website).
7. Dominio: registrarlo en la cuenta de registrar de Judo, anotar la fecha de
   expiración en el portal de admin (campo "Dominio expira").
8. Probar el kill switch: Deshabilitar → verificar la página de la mascota
   triste → Reactivar.

## Reglas fijas

- El código, el diseño y el dominio son de Judo Marketing durante los
  primeros 12 meses (Service Policy §7).
- El sitio del cliente NUNCA depende del panel central para funcionar
  (fail-open del kit).
- El portal de clientes de judomarketing.net mostrará SOLO métricas de
  inversión publicitaria (alcance, presupuesto, gasto, seguidores) cuando se
  conecte Meta/Google en la fase de ads; el comportamiento del website se ve
  en el portal propio de cada sitio.
