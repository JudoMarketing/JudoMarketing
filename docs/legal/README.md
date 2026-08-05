# Documentos Legales de Judo Marketing

Estamos comenzando desde cero: **no hay clientes bajo pólizas anteriores**, así que la
base legal es UNA sola póliza unificada + el contrato de cliente. Las 8 pólizas viejas
quedaron archivadas como referencia histórica y no se publican.

## Documentos vigentes

| Documento | Archivos | Uso |
|---|---|---|
| **Service Policy & Terms** (póliza única, EN) | `service-policy.md` (maestro) → `Service_Policy_and_Terms.pdf` (3 págs) | Se publica en www.judomarketing.net; todos la aceptan al registrarse. Versión ES para la web en Fase 2 |
| **Acuerdo de Servicio — Cliente** (ES) | `contracts/acuerdo-de-servicio-cliente.md` → `contracts/Acuerdo_de_Servicio_Cliente.pdf` (2 págs) | El contrato que los vendedores llevan en su portal: firma del cliente + contrafirma de Administración. Versión EN en Fase 2 |

Regenerar ambos PDF: `python scripts/generate_legal_pdfs.py`
(el PDF de la póliza se genera automáticamente desde `service-policy.md` — editar el
markdown y regenerar).

## Qué resuelve la póliza única (decisiones del dueño, 08/05/2026)

- **Modelo de 12 meses** (§7): código, diseño, portales y dominio son de Judo durante el
  primer año; con 12 pagos completos y cuenta al día, entrega por solicitud formal
  escrita a admin@judomarketing.net.
- **Garantía de Entrega de 30 días** (§6): única excepción al no-reembolso.
- **Página de suspensión** (§8): "Temporalmente deshabilitado" con marca de Judo y link a
  www.judomarketing.net, sin publicidad, autorizada expresamente; sin recargos ni multas
  por mora — la suspensión es la única consecuencia.
- **Canal de comunicación** (§14): el contacto del cliente es su vendedor asignado;
  administración solo por la página de contacto; solicitudes formales por escrito.
- **Sin resultados garantizados** (§9): toda garantía promocional se define solo por su
  remedio escrito (ej. "trabajamos gratis hasta lograrlo"), nunca como resultado
  asegurado. *Regla de redacción para el sitio: el paquete "20% de tráfico" debe
  expresarse así.*
- **Privacidad** (§12): no se venden datos, eliminación de información sensible a 90
  días, notificación de brechas (Florida), HIPAA/BAA para clientes de salud.
- **Uso aceptable** (§10): prohíbe testimonios falsos y reseñas fabricadas — aplica
  también a nosotros: las reseñas del home deben ser de clientes reales con permiso.

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
5. **Traducciones ES/EN** de la póliza y el contrato para la web bilingüe.

## Archivo histórico

`archive/pdf-originales/` contiene las 8 pólizas separadas (07/06/2026) que nunca se
publicaron. Se conservan solo como referencia; la Service Policy & Terms las reemplaza
por completo.
