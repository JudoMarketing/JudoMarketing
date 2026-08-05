# Pólizas de Judo Marketing — Índice y Análisis

Los PDF originales viven en `docs/legal/pdf/`. Todas tienen fecha efectiva 07/06/2026,
se rigen por la ley de Florida (Miami-Dade) y usan admin@judomarketing.net como contacto.
En la web (Fase 2) cada una se publicará como página HTML bilingüe + link de descarga al PDF.

## Resumen de cada póliza

| Documento | Qué cubre | Puntos clave |
|---|---|---|
| **Terms and Conditions** | Marco general de todos los servicios | Aceptación por uso/pago/firma; el acuerdo más específico prevalece; **no garantiza resultados** (§7); suspensión por falta de pago (§14); responsabilidad limitada a 3 meses de pagos (§15); firmas electrónicas válidas (§17) |
| **Privacy Policy** | Datos de visitantes, prospectos y clientes | No se vende información; **regla de eliminación de datos sensibles a 90 días**; notificación de brechas según ley de Florida; B2B, no menores de 13 |
| **Refund and Cancellation** | Reembolsos y cancelaciones | No-reembolso general una vez iniciado el trabajo; cancelación detiene facturación futura; cancelación online disponible si la ley lo exige; chargebacks = posible terminación |
| **Subscription & Website Ownership** | Propiedad de website/dominio | **Transferencia de propiedad tras el 3er mes pagado** (ver conflicto abajo); actualizaciones menores incluidas definidas; opción de buyout discrecional; uso de portafolio permitido salvo pedido de confidencialidad |
| **Acceptable Use Policy** | Usos prohibidos | Prohíbe fraude, phishing, **testimonios falsos/reseñas fabricadas**, contenido de odio; industrias reguladas responsables de su propio cumplimiento |
| **Advertising & Marketing Disclaimer** | Publicidad y resultados | **Sin resultados garantizados** (ventas, leads, ranking, ROAS); plataformas de terceros fuera de nuestro control; testimonios deben ser veraces y con divulgación de incentivos |
| **Communication Consent & Opt-Out** | Consentimiento de contacto | Consentimiento por contacto/formulario; opt-out con "unsubscribe"/"stop"; mensajes transaccionales continúan tras opt-out; cubre SMS y llamadas |
| **HIPAA & Data Security Notice** | Clientes de salud/ABA | Plataformas HIPAA-compliant cuando aplique; BAA obligatorio antes de procesar PHI; mínimo necesario; regla de 90 días |

## ✅ Conflictos detectados — RESUELTOS con la Enmienda No. 1 (08/05/2026)

El dueño decidió el 08/05/2026 que la identidad verdadera del proyecto es el **modelo de
12 meses**. La **[Policy Amendment No. 1](AMENDMENT-1.md)** (PDF en
`pdf/Policy_Amendment_1.pdf`) es el documento oficial que corrige las pólizas:

1. ~~3 meses vs 12 meses~~ → **Resuelto (Enmienda §1):** el código, diseño, portales y
   dominio son de Judo Marketing durante los primeros 12 meses; con 12 pagos completos y
   cuenta al día, el cliente puede solicitar la entrega por escrito. Toda referencia al
   "tercer mes" en las pólizas queda reemplazada.
2. ~~Garantía de entrega de 30 días~~ → **Resuelto (Enmienda §3):** garantía explícita —
   única excepción al no-reembolso.
3. ~~Página de suspensión~~ → **Resuelto (Enmienda §2):** autorización expresa de la
   página "Temporalmente deshabilitado" con marca de Judo, sin publicidad, sin recargos.
4. **"20% de tráfico asegurado"** — sigue vigente como regla de redacción: contradice
   Terms §7 y Advertising Disclaimer §3. El paquete de redes sociales debe expresarse
   como garantía con remedio ("si no se logra en 90 días, trabajamos gratis hasta
   lograrlo"), nunca como resultado asegurado.
5. **Reseñas del home** — sigue vigente: la Acceptable Use Policy prohíbe reseñas
   fabricadas (aplica también a nosotros). Deben ser de clientes reales con permiso, o
   marcarse claramente como ilustrativas.

## 📄 Contratos y documentos

- ✅ **Contrato de Cliente** — creado: `contracts/acuerdo-de-servicio-cliente.md`
  (maestro ES) y `contracts/Acuerdo_de_Servicio_Cliente.pdf` (descargable, 2 páginas).
  Es el contrato que los vendedores llevan en su portal para firma del cliente y
  contrafirma de Administración. Regenerar con `python scripts/generate_legal_pdfs.py`.
  *Pendiente: versión EN (Fase 2).*
- ✅ **Policy Amendment No. 1** — `AMENDMENT-1.md` + `pdf/Policy_Amendment_1.pdf`.

## 📄 Documentos que FALTAN (a crear en Fase 2)

1. **Seller / Vendedor Program Agreement** — registro y aprobación manual del vendedor,
   foto de perfil obligatoria, estatus de contratista independiente (no empleado),
   compensación "por comisión según acuerdo individual" (sin cifras ni promesas de
   ingreso), pago solo mientras el cliente referido mantenga contrato activo, método de
   pago internacional acordado por escrito, programa de referidos de un nivel,
   responsabilidad sobre los datos de visitas que registran, terminación, impuestos por
   cuenta del vendedor.
2. **Términos de los Portales** — cuentas de usuario, seguridad de claves, uso aceptable
   de los portales de admin/vendedor/cliente.
3. **Política de Cookies / Consentimiento** — el sitio usará analytics y chatbot; falta
   banner y política de cookies.
4. **Términos del Chatbot** — aviso de que es un asistente automatizado, no consejo
   profesional, y que las conversaciones pueden guardarse para mejorar el servicio.

## Correcciones menores

- El email de solicitudes formales en el contrato borrador del dueño decía
  `admin@denalibehaviorcrt.com` — en todos los documentos nuevos es
  `admin@judomarketing.net`. (Los 8 PDF actuales ya están correctos.)
