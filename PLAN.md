# Judo Marketing — Plan Maestro del Proyecto

> Documento vivo. Este es el esqueleto completo del rediseño de judomarketing.net y de la
> plataforma de gestión (portales de admin, vendedores y clientes). Se actualiza al final
> de cada fase. Última actualización: 2026-08-05.

---

## 1. Visión

Judo Marketing es una agencia que crea websites y apps por suscripción mensual
($50 / $100 / $150 desde), con IA integrada, código propio ("código madre"), control total
para el cliente y contrato de 1 año. La nueva plataforma tiene tres caras:

1. **Sitio público bilingüe (ES/EN)** — moderno, oscuro, morado/azul, con la mascota robot,
   vitrina de servicios, paquetes, contacto y chatbot vendedor.
2. **Red de sitios de clientes** — cada website creado para un cliente se conecta al panel
   central: métricas, uptime, SEO, estado de pago, y suspensión remota ("kill switch").
3. **Portales** — Admin (dueño), Vendedores (Venezuela, offline-first) y Clientes.

Identidad: prosperidad, honestidad, bajo riesgo para el cliente, "la estrategia judo":
usar el impulso del mercado a favor del cliente pequeño.

---

## 2. Decisiones de stack (propuestas)

| Área | Elección | Por qué |
|---|---|---|
| Framework | Next.js (App Router) en **Vercel** | Preferencia del dueño; SSR para SEO; middleware para kill-switch |
| Base de datos | **Supabase** (Postgres) | Auth + Storage (fotos de perfil) + Postgres + Row Level Security en un solo servicio gratuito al inicio |
| Auth | Supabase Auth + roles (`admin`, `vendedor`, `cliente`) | 2FA para admin, magic link opcional |
| Anti-bot | **Cloudflare Turnstile** + rate limiting | Gratis, sin fricción, mejor UX que reCAPTCHA |
| Emails | **Resend** (o Gmail API con Google Workspace) enviando como admin@judomarketing.net | Requiere DNS (SPF/DKIM) |
| Pagos | **Stripe** (suscripciones) + pagos manuales marcables | Fase de pagos |
| Chatbot | Claude API (Haiku para costo bajo) | La mascota que vende |
| Offline vendedores | PWA + IndexedDB + cola de sincronización | Señal mala en Venezuela: guardar local, subir al reconectar |
| i18n | next-intl, rutas `/es` y `/en` + hreflang | Mejor para SEO que un modal |
| Mascota | Rive o Lottie (vector, liviano) | Sigue el cursor/dedo, burbuja de chat, apagable en `prefers-reduced-motion` |

**"Judo Site Kit"** (pieza clave de la logística): un paquete npm privado que se incluye en
*cada* website de cliente que creemos. Contiene:
- Middleware de estado: consulta la API central (con caché); si el sitio está `disabled`,
  muestra la pantalla "Temporalmente deshabilitado" con la mascota triste sentada sobre el
  link a www.judomarketing.net. **Fail-open**: si la API central no responde, el sitio del
  cliente sigue vivo (nunca tumbamos un cliente solvente por un fallo nuestro).
- Telemetría: reporta uptime/versión y expone endpoint autenticado de métricas
  (ventas, tráfico, SEO checks) que el panel central consume.
- Así, "crear un website nuevo" = nuevo chat de Claude Code + plantilla con el Kit +
  registrarlo en el portal admin (nombre, dominio, cliente, vendedor asignado, fechas).

---

## 3. Banderas críticas (huecos que encontré en la idea original)

Estas son las cosas que me pediste que te señalara. Ninguna mata el proyecto; todas tienen
solución, pero hay que decidirlas conscientemente:

1. **Contradicción de reembolsos.** El onboarding promete "reembolsable si no terminamos tu
   proyecto en menos de un mes", pero la póliza dice "no hay reembolsos". Solución: política
   unificada — *no hay reembolsos, con UNA excepción explícita: la Garantía de Entrega de 30
   días* (si Judo no entrega, se devuelve el 100% del primer pago). Eso es un diferenciador
   de venta, no una debilidad.

2. **"20% de incremento en tráfico asegurado".** Garantizar resultados de marketing en
   términos absolutos es publicidad engañosa si no se cumple (exposición legal real, FTC).
   Reformular como garantía con remedio definido: *"Si en 90 días no aumentamos tu tráfico
   20%, trabajamos gratis hasta lograrlo"* (o un mes gratis). Misma fuerza de venta, riesgo
   controlado.

3. **"Grandes cantidades de dinero" en las pólizas de vendedores.** Prometer ingresos en un
   documento oficial es un *income claim* — es legalmente PEOR que hablar de comisiones. Y
   con códigos de referido entre vendedores, la estructura se parece a multinivel, que está
   muy vigilado. Propuesta: las pólizas dicen solo "compensación por comisión según acuerdo
   individual, pagada mientras el cliente referido mantenga su contrato activo". El mensaje
   de prosperidad va en la página de reclutamiento como aspiración, sin cifras ni promesas.
   Los montos exactos ($10 de cada $50, o el % que negocies) viven solo dentro del portal
   privado de cada vendedor.

4. **Las 3 reseñas "que se vean venezolanas".** Reseñas inventadas presentadas como reales
   violan la regla de la FTC contra fake reviews (multas por reseña). Dos salidas honestas:
   (a) pedirles a tus clientes reales (la del bot, el de las citas, el del portal admin —
   parece que existen) permiso para citarlos, o (b) marcarlas visualmente como "casos de
   ejemplo". Recomiendo (a): es gratis y es verdad.

5. **Email equivocado en el contrato.** Las solicitudes formales van a
   `admin@denalibehaviorcrt.com` — eso es de otro negocio (¿copy-paste?). Debe ser
   `admin@judomarketing.net`.

6. **Kill switch y reputación.** Apagar el sitio de un cliente moroso está bien SOLO si el
   contrato lo autoriza expresamente (lo hace: "sin penalidad, simplemente se desactiva").
   Pero la mascota triste redirigiendo tráfico del cliente hacia Judo debe estar también en
   el contrato ("página de suspensión con marca de Judo Marketing"), o un cliente molesto
   podría alegar daño. Una línea en el contrato lo resuelve.

7. **Pago de comisiones a Venezuela.** Stripe no hace payouts a Venezuela. Hay que definir
   el método (Zelle, Binance/USDT, transferencia) aunque el proceso sea manual, y decirlo
   en el acuerdo del vendedor ("los pagos se realizan por el método acordado, mensualmente,
   mínimo de retiro $X").

8. **Datos personales que suben los vendedores.** Nombres de clientes visitados + empresa +
   fecha = datos personales de terceros guardados offline en teléfonos. La política de
   privacidad debe cubrirlo y el portal debe permitir borrar registros.

9. **Modal de idioma al entrar.** Un modal bloqueante castiga el SEO y molesta en móvil.
   Mejor: detección automática por navegador + selector visible ES/EN + recordar la
   elección. Primera visita puede mostrar una burbuja de la mascota preguntando el idioma
   (misma idea tuya, sin bloquear la página).

10. **Propiedad del dominio el primer año.** Legal y operativamente hay que registrar los
    dominios en NUESTRA cuenta de registrar para poder controlarlos y medir expiraciones.
    Definir en qué registrar (recomiendo Cloudflare o Namecheap, una sola cuenta).

---

## 4. Fases (reorganizadas)

### Fase 0 — Fundaciones *(sin esto nada avanza)*
- Repo, Next.js, Tailwind, sistema de diseño (paleta morada/negra del flyer, tipografía).
- Supabase: esquema inicial de DB (ver §5), auth con roles.
- i18n ES/EN con rutas.
- Assets de marca: logo, mascota, imágenes.
- Deploy base en Vercel + dominio apuntado.

### Fase 1 — Sitio público
- **Home**: hero "Hacemos todo tipo de websites…", "Build Trust, Create Value", fondo de
  luces moradas/azules entrelazadas (canvas/WebGL liviano, respetando reduced-motion),
  mascota que sigue el cursor/dedo con burbuja de pensamiento estilo anime, onboarding en
  4 pasos, vitrina de servicios (título + descripción corta), reseñas, dirección con mapa.
- **Servicios**: los 3 planes del flyer ($50 esenciales, $100 complejos, $150 apps) con sus
  checklists, más los 5 diferenciadores (IA integrada, código madre, tu código tu
  propiedad, control total, seguridad y respaldos). Al final: **Paquetes** (marketing en
  redes sociales, garantía de tráfico reformulada, budget lo decide el usuario → lleva a
  contacto).
- **About Us / Estrategia Judo**: la filosofía judo aplicada al marketing (base del SEO).
- **Contacto**: WhatsApp, llamada (305-934-9981), formulario → admin@judomarketing.net,
  dirección + perfil de Google, links a Instagram @judo.marketing.
- SEO base: metadata, sitemap, hreflang, schema.org LocalBusiness.

### Fase 2 — Legal y confianza ✅ COMPLETA (08/05/2026)
- [x] Póliza única publicada en /legal (bilingüe, PDF descargables, link en footer).
- [x] Acuerdo del Programa de Vendedores creado (md + PDF, sin cifras de comisión).
- [x] Contrato de Cliente y póliza descargables desde el sitio.
- [ ] Checkbox de aceptación de términos en TODO registro (con fecha/versión aceptada)
  → se implementa con el registro en Fase 3 (tabla `terms_acceptances` ya existe).

> **Aclaración del dueño (08/05/2026) sobre los portales:**
> - El **portal de administrador de cada cliente vive en SU propio website** (lo crea el
>   dueño desde el sitio del cliente), NO en judomarketing.net.
> - El **Portal de Clientes de judomarketing.net** es para las estadísticas de su cuenta
>   de publicidad: reportes de gastos de ads, progreso en redes sociales y Google,
>   cuando Judo maneja su publicidad paga. Al iniciar un cliente, desde su propio portal
>   se conecta Meta y esa información se manda al panel de judomarketing. (Los stats de
>   presupuesto de negocio se definirán más adelante.)
> - El servidor tiene conexión al MCP de Facebook/Meta Ads disponible para esta
>   integración en la fase correspondiente.

### Fase 3 — Auth y Portal de Vendedores 🔨 EN CURSO (core entregado 08/05/2026)

**Hecho:** registro de vendedores (nombre obligatorio, email+clave, código de referido
opcional, checkbox de aceptación con versión/fecha guardada como evidencia vía trigger),
login real con Supabase Auth, portal del vendedor (estado pendiente/aprobado, subida de
foto de perfil obligatoria para aprobación, registro de visitas **offline-first** con
cola en localStorage + sincronización al volver la señal + UUID antiduplicados, lista de
visitas con indicador de sincronización, stats en $0 hasta que Admin asigne comisión,
descargas de contratos), y **pago por Zelle** en Servicios (instrucciones con
admin@judomarketing.net, solo USD, subida de captura + nombre + código de referido +
"¿dónde supiste de nosotros?"; el comprobante queda en Supabase para verificación).
Migración `0002_portal.sql` con RLS, buckets y trigger de registro.

**Pendiente de esta fase:** Turnstile anti-bot (requiere cuenta Cloudflare del dueño),
gráficas de proyecciones de ganancias (cuando haya datos de comisiones), flujo de firma
digital del contrato (vendedor firma + recoge firma del cliente), aprobación de
vendedores desde el portal de admin (Fase 4 — mientras tanto se aprueba cambiando
`sellers.status` a `aprobado` en el Table Editor de Supabase).
- Registro: email + clave + código de referido opcional. Turnstile anti-bot.
- Estado "pendiente de aprobación" → el admin aprueba y en ese momento fija su comisión
  (% o monto fijo por cada $50).
- Perfil: foto obligatoria (Storage), nombre obligatorio, resto opcional.
- Registro de visitas: nombre del cliente, empresa, fecha — **offline-first** (se guarda en
  el teléfono, sincroniza al volver la señal, indicador de "pendiente de subir").
- Dashboard: gráfica de ganancias mensuales, ejes ventas vs ganancia, proyecciones.
  Nunca se le muestra la fórmula de otros; si no ha vendido, muestra $0.
- **Flujo de firma del contrato de cliente** (documento ya creado en
  `docs/legal/contracts/`, con TRES firmantes): el vendedor genera el contrato desde su
  teléfono con los datos pre-llenados, **firma él mismo y recoge la firma del cliente en
  pantalla (touch) desde su app**, Administración recibe email para contrafirmar desde
  su bandeja, y el PDF firmado por los tres se archiva automáticamente en el portal de
  admin. También descargable en blanco para firma en papel.
- Referidos entre vendedores (un solo nivel).

### Fase 4 — Portal de Admin (`/admin`)
- Seguridad alta: 2FA obligatorio, rate limiting, Turnstile, sesiones cortas, audit log de
  cada acción (quién apagó qué sitio y cuándo).
- Pestañas: **Clientes** | **Vendedores** | **Websites** | **Pagos**.
- Clientes/Websites: alta de sitio (nombre, dominio, cliente, vendedor asignado o "yo"),
  fechas de expiración de dominio y de pago editables, marcar pagos manuales, estado
  Activo / **Deshabilitado** (kill switch), vista espejo de lo que ve cada vendedor.
- Vendedores: aprobar/rechazar, fijar comisión individual, ver visitas y ventas, exportar
  emails para campañas.
- Pagos: calendario de cobros ("a quién colectar y cuándo"), historial.

### Fase 5 — Red multi-sitio (Judo Site Kit)
- Paquete compartido con middleware de suspensión (pantalla "Temporalmente deshabilitado" +
  mascota triste sobre el link a judomarketing.net, sin publicidad) y telemetría.
- API central de estado + integración con Vercel API (deploys, dominios, uptime).
- Flujo "nuevo website": plantilla lista para arrancar cada nuevo chat de Claude Code, con
  el Kit incluido y registro automático en el portal.
- Chequeos SEO básicos automatizados por sitio.

### Fase 6 — Pagos y comunicaciones
- Stripe: suscripciones, webhooks → actualizan solvencia automáticamente; convive con
  pagos manuales.
- Emails automáticos como admin@judomarketing.net: recordatorio "ya viene tu pago",
  aviso de suspensión, bienvenida, resumen mensual al vendedor con lo que le corresponde,
  promociones (lista de emails de vendedores).

### Fase 7 — Chatbot IA
- La mascota chatea: responde sobre servicios y contenido del sitio, en tono cercano,
  vendiendo sin presión; escala a WhatsApp/formulario cuando detecta intención de compra.
- Claude API con presupuesto mensual definido y límites por sesión.

### Fase 8 — SEO y Google
- Google Search Console, Analytics, Google Business Profile (verificación de dirección).
- Contenido "estrategia judo en marketing" para competir por la keyword "judo marketing".
  Expectativa honesta: escalar posiciones toma semanas/meses; nadie puede garantizar el #1,
  pero con contenido + schema + perfil de negocio local se compite en serio.

---

## 5. Esquema de datos (borrador)

- `users` (rol: admin/vendedor/cliente, estado, foto, idioma)
- `sellers` (user_id, aprobado_por, comisión_tipo [%|fijo], comisión_valor, referido_por,
  método_pago, total_vendido)
- `clients` (contacto, empresa, fecha_contrato, fecha_fin_año)
- `sites` (nombre, dominio, cliente_id, vendedor_id, estado [activo|deshabilitado],
  vercel_project, dominio_expira, próximo_pago, precio_mensual, kit_api_key)
- `payments` (site_id, monto, método [stripe|manual], fecha, marcado_por)
- `commissions` (seller_id, payment_id, monto, estado [pendiente|pagada])
- `visits` (seller_id, cliente_nombre, empresa, fecha_visita, synced_at) ← offline queue
- `terms_acceptances` (user_id, doc, versión, fecha, ip)
- `audit_log` (actor, acción, objetivo, fecha)
- `site_metrics` (site_id, uptime, ventas, tráfico, seo_score, fecha)

---

## 6. Estado

- [x] Esqueleto del proyecto definido
- [x] Pólizas recibidas, leídas y organizadas → `docs/legal/` (análisis y huecos en `docs/legal/README.md`)
- [x] Guía de marca documentada → `docs/BRAND.md` (paleta #7B2DFF/#A855F7/#0B0B12, Poppins, dirección Miami)
- [x] Supabase creado: https://ajsuskyeatgatbubctzl.supabase.co — migración 0001 aplicada ✓ (verificado 08/05); falta aplicar 0002
- [x] **DECISIÓN TOMADA (08/05/2026): modelo de 12 meses.** Como no hay clientes bajo
  las pólizas viejas, se creó UNA póliza única nueva: `docs/legal/service-policy.md` →
  `Service_Policy_and_Terms.pdf`. Las 8 pólizas originales quedaron en
  `docs/legal/archive/` (referencia, no se publican)
- [x] Contrato de Cliente creado (ES, 2 páginas): `docs/legal/contracts/` — para el
  portal de vendedores, con firma de cliente y contrafirma de Administración
- [x] Assets de marca subidos y organizados en `assets/brand/` (logos alta resolución en
  blanco y negro transparentes, OG thumbnail, brand sheet, flyer de servicios)
- [x] **Fase 0 COMPLETA (08/05/2026):** Next.js 15 + Tailwind 4 + next-intl (ES/EN),
  sistema de diseño con paleta y Poppins, home provisional con hero/planes/footer,
  esquema inicial de Supabase (`supabase/migrations/0001_init.sql`), build verificado
  en desktop y móvil
- [ ] **PENDIENTE DEL DUEÑO:** conectar el repo a Vercel (importar proyecto, preset
  Next.js) y aplicar la migración SQL en el editor de Supabase — ver README.md
- [ ] Fase 1 (sitio público completo: mascota, luces, onboarding, reseñas, servicios,
  about, contacto) — siguiente
