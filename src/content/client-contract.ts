/**
 * Texto del Acuerdo de Servicio (ES) para el PDF firmado digitalmente.
 * Fuente de verdad: docs/legal/contracts/acuerdo-de-servicio-cliente.md
 * Si se edita el md, actualizar aquí también.
 */

export const ADMIN_SIGNER_NAME = "Junior Osorio";
export const ADMIN_SIGNER_TITLE = "Judo Marketing, Administración";

export const contractSections: { title: string; body: string[] }[] = [
  {
    title: "1. El servicio",
    body: [
      "Judo Marketing diseña, construye, aloja y mantiene el website o aplicación del cliente, incluyendo su portal de administrador. El plazo del contrato es de doce (12) meses, con pago mensual por adelantado.",
    ],
  },
  {
    title: "2. Cómo protegemos al cliente",
    body: [
      "• Garantía de entrega de 30 días: si no entregamos el proyecto inicial dentro de 30 días de recibir todos los materiales y aprobaciones del cliente, el cliente puede pedir el reembolso completo de su primer pago. Es la única excepción a la regla de no reembolso.",
      "• Cero penalidades: nunca cobramos recargos por mora ni multas por cancelar.",
      "• Cancelación libre: el cliente puede cancelar en cualquier momento escribiendo a admin@judomarketing.net; al cancelar, el servicio y el website se desactivan de inmediato y no se factura el mes siguiente.",
      "• Control total: el cliente gestiona su contenido, usuarios y productos desde su portal de administrador.",
      "• Privacidad: no vendemos la información del cliente.",
    ],
  },
  {
    title: "3. Cómo se protege Judo Marketing",
    body: [
      "• Propiedad durante el primer año: el código, el diseño, los portales y el dominio son propiedad de Judo Marketing durante los primeros 12 meses de servicio. Cumplidos 12 pagos mensuales y con la cuenta al día, si el cliente decide dejar el servicio puede solicitar la entrega del dominio y del código mediante solicitud formal por escrito a admin@judomarketing.net.",
      "• Suspensión por falta de pago: si un pago no se recibe, el website puede suspenderse temporalmente y mostrar una página neutral de “Temporalmente deshabilitado” con la marca de Judo Marketing y un enlace a www.judomarketing.net, sin publicidad. El cliente autoriza expresamente esta página. Al ponerse al día, el servicio se reactiva de inmediato y sin recargos.",
      "• Antes de suspender siempre hay aviso. El orden es: factura enviada, recordatorio, aviso de corte, y solo entonces la suspensión, una vez vencidos los días de gracia acordados (7 días si no se pactó otro número). Cada uno de esos pasos queda registrado con su fecha, y el cliente puede pedir ese registro cuando quiera.",
      "• Crédito en el sitio: mientras dure el contrato, el website lleva en su pie la frase “Website por Judo Marketing” con enlace a www.judomarketing.net. Es discreta y no interfiere con la marca del cliente.",
      "• Sin reembolsos fuera de la Garantía de Entrega de 30 días.",
    ],
  },
  {
    title: "4. Accesos que el cliente entrega",
    body: [
      "Para poder medir y mejorar los resultados, el cliente otorga a Judo Marketing acceso a las cuentas de su negocio que apliquen: Google Search Console, Google Analytics, Perfil de Empresa de Google, Meta Business y su pixel, el procesador de pagos (solo lectura) y, cuando corresponda, el registrador del dominio y el correo del negocio.",
      "• Los accesos se otorgan por invitación, nunca compartiendo contraseñas. Judo Marketing no solicita ni almacena las claves personales del cliente.",
      "• Las cuentas siguen siendo del cliente. Puede revocar cualquier acceso cuando quiera, sin dar explicaciones.",
      "• Estos accesos se usan únicamente para medir resultados, optimizar el servicio contratado y alimentar el panel del propio cliente. No se usan para publicar en su nombre sin autorización, ni para contactar a sus clientes, ni se comparten con terceros.",
      "• Si el cliente no otorga o revoca un acceso, Judo Marketing no podrá reportar ni optimizar esa parte del servicio. Eso no interrumpe el contrato ni da derecho a reembolso.",
    ],
  },
  {
    title: "5. Qué se mide y para qué",
    body: [
      "El website del cliente envía a Judo Marketing información de funcionamiento: si el sitio está en línea, visitas, sesiones, órdenes, monto vendido, conversiones y errores.",
      "• Nunca se envían datos personales de los compradores del cliente: ni nombres, ni correos, ni teléfonos, ni datos de pago. Solo cifras totalizadas.",
      "• El cliente ve el detalle completo en su propio portal; Judo Marketing ve el mismo dato en resumen. Ambos leen la misma fuente, para que nunca haya dos versiones de un número.",
      "• Esta información se usa para operar el servicio, detectar caídas y mejorar resultados. Puede usarse de forma anónima y agregada en estadísticas internas de la agencia. No se vende ni se cede.",
    ],
  },
  {
    title: "6. Compromisos del cliente",
    body: [
      "El cliente puede: solicitar las actualizaciones menores incluidas en su plan, usar su portal de administrador, cancelar cuando lo desee, y solicitar su código y dominio al cumplir el año.",
      "El cliente se compromete a: entregar a tiempo los materiales, textos, fotos y accesos que el proyecto necesite, y mantener vigentes los accesos otorgados mientras dure el contrato.",
      "El cliente no puede: usar el servicio para actividades ilegales, engañosas o prohibidas (Acceptable Use), publicar testimonios o reseñas falsas, revender o compartir los accesos de sus portales, ni retener información necesaria para el proyecto. El cliente es responsable de la veracidad del contenido, precios y ofertas de su negocio.",
    ],
  },
  {
    title: "7. Comunicación",
    body: [
      "El canal directo del cliente es su vendedor asignado. Para hablar con administración, el cliente puede usar la página de contacto de www.judomarketing.net. Las solicitudes formales (cancelación, entrega de código, disputas de facturación) deben enviarse por escrito a admin@judomarketing.net.",
    ],
  },
  {
    title: "8. Marco legal",
    body: [
      "Este acuerdo se complementa con la Política de Servicio y Términos (Service Policy & Terms) publicada en www.judomarketing.net, que el cliente declara conocer. Se rige por las leyes del Estado de Florida; jurisdicción: Miami-Dade County, Florida. Las firmas electrónicas tienen la misma validez que las manuscritas. Este documento fue firmado electrónicamente y está identificado con un código único de verificación.",
    ],
  },
];
