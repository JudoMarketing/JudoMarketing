/**
 * Los contratos que Judo Marketing manda desde el portal (pestaña Documentos).
 *
 * Tres documentos, uno por servicio: Websites y apps, JuditoADS y Juditos.
 * Este archivo ES la versión maestra: el PDF se arma con este texto en el
 * momento de enviarlo, con los datos del cliente ya puestos y la firma de
 * Judo Marketing ya estampada. El cliente acepta desde un enlace, y esa
 * aceptación queda registrada con nombre, fecha y dirección IP.
 *
 * Regla de redacción: cada cláusula protege a la empresa de algo concreto
 * que puede pasar, y lo dice en lenguaje que un cliente entiende sin
 * abogado. Lo que el cliente gana también está escrito: un contrato que
 * solo defiende a una parte no se firma.
 *
 * Ojo: esto lo escribió una IA con criterio, no un abogado de Florida. Antes
 * de mandarlo al primer cliente grande, que un abogado lo lea.
 */

import { PRECIO_HOSTING } from "@/lib/pricing";

export const TIPOS_DOCUMENTO = ["websites", "juditoads", "juditos"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const NOMBRE_TIPO: Record<TipoDocumento, string> = {
  websites: "Websites y apps",
  juditoads: "JuditoADS",
  juditos: "Juditos (AI Assistants)",
};

/** Lo que el portal pide para llenar el contrato. */
export type DatosDocumento = {
  codigo: string;
  /** dd/mm/aaaa, ya formateada en Eastern. */
  fecha: string;
  clienteNombre: string;
  clienteEmpresa: string | null;
  clienteEmail: string;
  /** Solo websites: el plan contratado, en palabras. */
  plan: string | null;
  precioMensual: number;
  /** Dominio, nombre del proyecto o del asistente. */
  proyecto: string | null;
  /** dd/mm/aaaa. */
  inicio: string;
};

export type Seccion = { titulo: string; parrafos: string[] };

export type Documento = {
  titulo: string;
  subtitulo: string;
  /** Pares etiqueta/valor que van en la tabla de datos del contrato. */
  datos: [string, string][];
  secciones: Seccion[];
};

export const FIRMANTE = {
  nombre: "Junior Osorio",
  cargo: "Director · Judo Marketing",
  empresa: "Judo Marketing",
  direccion: "66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130, Estados Unidos",
  correo: "admin@judomarketing.net",
  web: "www.judomarketing.net",
};

const usd = (n: number) => `$${n.toFixed(n % 1 === 0 ? 0 : 2)} USD`;

function partes(d: DatosDocumento, servicio: string): [string, string][] {
  return [
    ["Cliente", d.clienteEmpresa ? `${d.clienteNombre} · ${d.clienteEmpresa}` : d.clienteNombre],
    ["Correo del cliente", d.clienteEmail],
    ["Proveedor", `${FIRMANTE.empresa} · ${FIRMANTE.direccion}`],
    ["Servicio", servicio],
    ["Precio mensual", `${usd(d.precioMensual)} al mes, por adelantado`],
    ["Fecha de inicio", d.inicio],
    ["Código del contrato", d.codigo],
  ];
}

/* ── Cláusulas que van en los tres ─────────────────────────────────── */

const HIPAA_GENERAL =
  "Información de salud (HIPAA). Si el negocio del cliente es una entidad cubierta o un asociado de negocio bajo HIPAA, el cliente debe declararlo por escrito ANTES de que el servicio reciba cualquier información de salud protegida (PHI). No se recibirá, almacenará ni procesará PHI hasta que (a) exista un Business Associate Agreement firmado por ambas partes y (b) el servicio esté configurado en su versión compatible con HIPAA, que tiene costo adicional. Si el cliente envía PHI sin cumplir esos dos pasos, lo hace bajo su exclusiva responsabilidad: Judo Marketing podrá eliminarla, suspender la función que la recibe, y el cliente mantendrá indemne a Judo Marketing de cualquier sanción, reclamo o costo derivado.";

function datosYPrivacidad(quien: string, hipaa: string = HIPAA_GENERAL): Seccion {
  return {
    titulo: "Datos personales, privacidad y HIPAA",
    parrafos: [
      `Judo Marketing trata los datos personales que ${quien} en calidad de proveedor de servicio, únicamente para prestar el servicio contratado. No los vende, no los alquila y no los usa para fines propios distintos de operar, asegurar y mejorar el servicio. Al terminar el contrato, los datos se eliminan dentro de los treinta (30) días siguientes, salvo los que la ley obligue a conservar (facturación, registros de seguridad, obligaciones fiscales).`,
      "El cliente es responsable ante sus propios clientes y usuarios: de tener una política de privacidad propia, de obtener los consentimientos que la ley exija y de que lo que recoge sea lícito. Judo Marketing no es parte de la relación entre el cliente y sus clientes.",
      hipaa,
      "Datos de pago. Los pagos con tarjeta los procesa un proveedor certificado (Stripe u otro equivalente). Judo Marketing nunca ve ni guarda números de tarjeta completos. El cliente no debe enviar números de tarjeta, contraseñas ni documentos de identidad por correo, chat o formularios no diseñados para ello.",
      "Incidentes. Si ocurre un incidente de seguridad que afecte datos del cliente, Judo Marketing lo notificará sin demora indebida y cumplirá las obligaciones de notificación que exija la ley aplicable, incluida la ley de Florida (Florida Information Protection Act).",
      "Solicitudes de autoridades. Si una autoridad pública pide datos del cliente, se aplica el procedimiento de la sección 20 de la Política de Servicio: se revisa la legalidad, se impugna lo que no la tenga, se entrega solo lo estrictamente pedido y se avisa al cliente salvo prohibición legal.",
    ],
  };
}

function disponibilidad(deQue: string): Seccion {
  return {
    titulo: "Disponibilidad y servicios de terceros",
    parrafos: [
      `El servicio depende de proveedores externos: ${deQue}. Judo Marketing elige proveedores serios y los vigila, pero no controla sus interrupciones, cambios de precio, cambios de reglas ni decisiones sobre las cuentas del cliente. Una caída o un cambio de un tercero no es incumplimiento de Judo Marketing y no genera reembolso, aunque Judo Marketing hará lo razonable por restablecer el servicio cuanto antes.`,
      "Judo Marketing puede hacer mantenimiento programado, preferiblemente en horas de bajo uso, y actualizaciones de seguridad sin aviso previo cuando la urgencia lo justifique.",
      "No se garantiza disponibilidad del cien por ciento. El objetivo de servicio es de un 99,5 % mensual, medido por Judo Marketing, sin contar mantenimiento programado ni fallos de terceros.",
    ],
  };
}

function garantiasYResponsabilidad(extra: string[]): Seccion {
  return {
    titulo: "Garantías, límite de responsabilidad e indemnidad",
    parrafos: [
      "Sin resultados garantizados. Judo Marketing se compromete a hacer el trabajo con calidad profesional. No garantiza ventas, visitas, posiciones en buscadores, aprobaciones de plataformas, cantidad de clientes ni ningún otro resultado de negocio. Toda promesa promocional vale únicamente por el remedio que tenga escrito, nunca como resultado asegurado.",
      ...extra,
      `Límite de responsabilidad. La responsabilidad total de Judo Marketing frente al cliente por cualquier causa relacionada con este contrato no superará el total de las cuotas mensuales que el cliente haya pagado a Judo Marketing en los doce (12) meses anteriores al hecho que la origine. Judo Marketing no responde por lucro cesante, pérdida de datos causada por terceros, pérdida de oportunidades, daño reputacional ni daños indirectos o consecuenciales, aunque se le hubiera advertido de su posibilidad. Nada de esto limita la responsabilidad que la ley no permita limitar.`,
      "Indemnidad. El cliente mantendrá indemne a Judo Marketing, a sus dueños y colaboradores, frente a cualquier reclamo, multa, sanción o costo (incluidos honorarios razonables de abogado) que provenga de: el contenido, productos, precios, ofertas o promesas del negocio del cliente; la relación del cliente con sus propios clientes; el incumplimiento por el cliente de la ley, de este contrato o de las reglas de las plataformas que use; y el envío de datos sensibles fuera de lo pactado en este contrato.",
    ],
  };
}

function comunicacion(): Seccion {
  return {
    titulo: "Comunicación y avisos",
    parrafos: [
      `El correo del cliente que figura en este contrato es su dirección oficial: los avisos enviados allí se consideran recibidos al día siguiente hábil de su envío. El cliente debe mantenerlo activo y avisar si cambia. La dirección oficial de Judo Marketing es ${FIRMANTE.correo}.`,
      "Las solicitudes formales (cancelación, entrega de código o datos, disputas de facturación, aviso de datos de salud) se hacen por escrito a ese correo. Un mensaje por chat, redes sociales o teléfono no cuenta como solicitud formal.",
    ],
  };
}

function marcoLegal(): Seccion {
  return {
    titulo: "Marco legal, firma electrónica y acuerdo completo",
    parrafos: [
      "Este contrato se complementa con la Política de Servicio y Términos (Service Policy & Terms) publicada en www.judomarketing.net/legal, que el cliente declara haber leído. Si algo de este contrato contradice a la Política, manda este contrato.",
      "Se rige por las leyes del Estado de Florida, Estados Unidos. Cualquier disputa se resolverá en los tribunales estatales o federales del condado de Miami-Dade, Florida, y ambas partes aceptan esa jurisdicción. Antes de demandar, las partes intentarán resolver la disputa de buena fe durante treinta (30) días a partir del aviso escrito. La parte que gane un litigio podrá recuperar de la otra sus honorarios razonables de abogado y costas.",
      "Firma electrónica. Las partes acuerdan que este contrato se celebra por medios electrónicos y que la firma electrónica de Judo Marketing estampada en este documento y la aceptación del cliente registrada desde el enlace de aceptación (con nombre, fecha, hora y dirección IP) tienen la misma validez que una firma manuscrita, conforme a la ley federal E-SIGN y a la Ley de Firmas Electrónicas de Florida. El código único de este documento identifica esta versión exacta del contrato.",
      "Acuerdo completo. Este documento y la Política de Servicio son el acuerdo completo entre las partes sobre este servicio y sustituyen cualquier conversación, cotización o promesa anterior. Se modifica solo por escrito aceptado por ambas partes; los cambios de precio siguen las reglas de aviso de este contrato. Si una cláusula resulta inválida, el resto sigue en pie. Judo Marketing puede ceder este contrato a una empresa sucesora que continúe el servicio; el cliente no puede cederlo sin autorización escrita. Ninguna de las partes responde por fuerza mayor (desastres naturales, fallos generales de internet o energía, actos de autoridad, pandemias) mientras dure el impedimento. Las cláusulas de propiedad, datos, responsabilidad, indemnidad y marco legal sobreviven a la terminación.",
      "Este contrato está redactado en español. Si se traduce, la versión en español prevalece.",
    ],
  };
}

/* ── 1. Websites y apps ────────────────────────────────────────────── */

function websites(d: DatosDocumento): Documento {
  const plan = d.plan ?? "Website";
  return {
    titulo: "Acuerdo de servicio · Websites y apps",
    subtitulo: "Suscripción de diseño, construcción, alojamiento y mantenimiento · Plazo: 12 meses",
    datos: [
      ...partes(d, `${plan}${d.proyecto ? ` · ${d.proyecto}` : ""}`),
    ],
    secciones: [
      {
        titulo: "1. El servicio y el plazo",
        parrafos: [
          `Judo Marketing diseña, construye, aloja y mantiene el website o la aplicación del cliente descrita en los datos de este contrato, incluido su portal de administración. El plan contratado es ${plan}, por ${usd(d.precioMensual)} al mes, pagados por adelantado.`,
          "El plazo inicial es de doce (12) meses contados desde la fecha de inicio. Al cumplirse, el cliente elige una de las tres salidas de la cláusula 4. Si no elige ninguna por escrito, el servicio continúa mes a mes con el mismo plan y el mismo precio, y cualquiera de las partes puede terminarlo con aviso de treinta (30) días.",
          "Incluye: el diseño y la construcción inicial; el alojamiento; el dominio (registrado por Judo Marketing durante el plazo); las actualizaciones de seguridad; el portal de administración del cliente; y las actualizaciones menores del plan (cambios de texto, precios, fotos y productos que el cliente no pueda hacer solo desde su portal). No incluye: rediseños, funciones nuevas, integraciones no previstas en el plan, campañas de publicidad ni contenido que deba producirse desde cero. Eso se cotiza aparte.",
        ],
      },
      {
        titulo: "2. Cómo protegemos al cliente",
        parrafos: [
          "Garantía de entrega de 30 días. Si el proyecto inicial no está entregado dentro de los treinta (30) días siguientes a que el cliente haya entregado todos los materiales, textos, accesos y aprobaciones que se le pidan, el cliente puede pedir el reembolso completo de su primer pago. Es la única excepción a la regla de no reembolso. El plazo se pausa cada día que Judo Marketing esté esperando algo del cliente.",
          "Sin recargos ni multas. Judo Marketing no cobra intereses de mora ni penalidades por cancelar.",
          "Cancelación libre. El cliente puede cancelar cuando quiera escribiendo a admin@judomarketing.net. Al cancelar, el servicio y el website se desactivan y no se factura el mes siguiente. Lo ya pagado no se devuelve.",
          "Control de su negocio. El cliente maneja su contenido, usuarios, productos y precios desde su portal de administración. Sus datos y su marca son suyos siempre.",
        ],
      },
      {
        titulo: "3. Propiedad: de quién es qué",
        parrafos: [
          "Del cliente, siempre: su marca, sus logotipos, sus textos, fotos y videos, su lista de clientes, sus productos y toda la información de su negocio. El cliente concede a Judo Marketing una licencia limitada para usar ese material únicamente para construir y operar el servicio.",
          "De Judo Marketing durante el plazo inicial: el código, el diseño, la estructura, los portales, el kit de componentes y el dominio son propiedad de Judo Marketing durante los primeros doce (12) meses. Es lo que permite ofrecer el proyecto por una cuota mensual en vez de cobrarlo completo el primer día.",
          "Entrega al cumplir el año. Con doce (12) cuotas mensuales completas y la cuenta al día, el cliente puede pedir por escrito la entrega de: el código fuente del proyecto, una exportación completa de su base de datos y el traspaso del dominio a un registrador a su nombre. Judo Marketing la completa dentro de los treinta (30) días siguientes a la solicitud. Los componentes genéricos del kit de Judo Marketing que estén dentro del código se entregan con licencia perpetua, no exclusiva y sin derecho a revenderlos como producto propio: Judo Marketing sigue pudiendo usarlos en otros proyectos. Hecha la entrega, Judo Marketing queda liberada de toda obligación sobre ese proyecto.",
          "Crédito en el sitio. Mientras Judo Marketing aloje el website, este lleva en su pie la frase «Website por Judo Marketing» con enlace a www.judomarketing.net. Es discreta y no interfiere con la marca del cliente.",
        ],
      },
      {
        titulo: "4. Al terminar los 12 meses: tres caminos",
        parrafos: [
          "Camino A · Seguir igual. El cliente continúa con su plan, mes a mes, al mismo precio, con todo lo que incluye.",
          `Camino B · Solo alojamiento. El cliente ya no necesita cambios ni mantenimiento de diseño, pero quiere que su website siga funcionando en los servidores de Judo Marketing. Paga ${usd(PRECIO_HOSTING)} al mes por el alojamiento, el dominio, las copias de seguridad y las actualizaciones de seguridad. No incluye cambios de contenido ni de diseño: los que el cliente no pueda hacer desde su portal se cotizan aparte.`,
          "El alojamiento se cobra por consumo. Ese precio cubre el consumo normal de un negocio pequeño o mediano: visitas, consultas a la base de datos, envíos de correo, almacenamiento y transferencia. Si el website o servicio del cliente consume claramente más que eso durante dos (2) meses seguidos —por ejemplo, por volumen de tráfico, por integraciones que consultan mucho o por archivos pesados—, Judo Marketing le mostrará al cliente el consumo medido y el nuevo precio, proporcional a ese consumo, con treinta (30) días de aviso. El cliente puede aceptarlo, reducir el consumo o pedir la entrega del Camino C. Nunca se aumenta el precio sin mostrar el consumo que lo justifica.",
          "Camino C · Llevárselo todo. El cliente pide la entrega completa de la cláusula 3 y aloja el proyecto donde prefiera. Desde el traspaso, el funcionamiento, la seguridad y las copias del proyecto son responsabilidad del cliente o de quien él contrate.",
          "Mientras el cliente no elija, aplica el Camino A.",
        ],
      },
      {
        titulo: "5. Pagos, atrasos y suspensión",
        parrafos: [
          "La cuota se paga por adelantado cada mes, por tarjeta a través del procesador de pagos de Judo Marketing o por el medio que ambas partes acuerden por escrito. Los precios no incluyen impuestos que la ley pueda exigir.",
          "Si una cuota no se recibe, el orden es siempre el mismo: factura enviada, recordatorio, aviso de corte y, vencidos siete (7) días de gracia, la suspensión. Cada paso queda registrado con su fecha y el cliente puede pedir ese registro.",
          "Durante la suspensión el website muestra una página neutral de «Temporalmente deshabilitado» con la marca de Judo Marketing y un enlace a www.judomarketing.net, sin publicidad. El cliente autoriza expresamente esa página. Al ponerse al día, el servicio se reactiva de inmediato y sin recargos. Si la suspensión dura más de sesenta (60) días, Judo Marketing puede dar el contrato por terminado y eliminar el proyecto tras avisar por escrito.",
          "Un pago devuelto o disputado (contracargo) sin causa justificada se considera cuota no recibida y activa el mismo proceso.",
        ],
      },
      {
        titulo: "6. Accesos que el cliente entrega y qué se mide",
        parrafos: [
          "Para medir y mejorar resultados, el cliente da acceso a Judo Marketing a las cuentas del negocio que apliquen: Google Search Console, Google Analytics, Perfil de Empresa de Google, Meta Business y su píxel, el procesador de pagos (solo lectura) y, cuando corresponda, el registrador del dominio y el correo del negocio. Los accesos se otorgan por invitación, nunca compartiendo contraseñas. Las cuentas siguen siendo del cliente y puede revocar cualquiera cuando quiera; si lo hace, Judo Marketing no podrá reportar ni optimizar esa parte, sin que eso interrumpa el contrato ni dé derecho a reembolso.",
          "El website envía a Judo Marketing cifras de funcionamiento: si está en línea, visitas, sesiones, órdenes, monto vendido, conversiones y errores. Nunca datos personales de los clientes del cliente: ni nombres, ni correos, ni teléfonos, ni datos de pago. El cliente ve el detalle completo en su portal y Judo Marketing ve el resumen; ambos leen la misma fuente. Estas cifras pueden usarse de forma anónima y agregada en estadísticas internas. No se venden ni se ceden.",
        ],
      },
      datosYPrivacidad("el website recoge de los clientes del cliente (pedidos, citas, formularios, cuentas de usuario)"),
      {
        titulo: "8. Compromisos y uso aceptable",
        parrafos: [
          "El cliente se compromete a entregar a tiempo los materiales, textos, fotos y accesos que el proyecto necesite; a mantener vigentes los accesos otorgados; y a ser el responsable de la veracidad y legalidad de su contenido, precios, ofertas, testimonios y reseñas.",
          "El cliente no puede usar el servicio para actividades ilegales, engañosas o que infrinjan derechos de terceros; publicar testimonios o reseñas falsas; revender, compartir o prestar los accesos de sus portales; ni usar el website para enviar correo no solicitado. Judo Marketing puede retirar contenido ilegal o que reciba un reclamo fundado (por ejemplo, de derechos de autor) y, en casos graves o reiterados, suspender o terminar el servicio de inmediato.",
        ],
      },
      disponibilidad("alojamiento y red de distribución, base de datos, correo transaccional, registrador de dominio, procesador de pagos y las plataformas de Google y Meta"),
      garantiasYResponsabilidad([
        "Copias de seguridad. Judo Marketing mantiene copias de seguridad automáticas de la base de datos del proyecto mientras lo aloja. Esas copias son una medida de protección, no una garantía de recuperación total: el cliente es responsable de conservar sus propios originales (fotos, textos, catálogos).",
      ]),
      {
        titulo: "11. Terminación",
        parrafos: [
          "El cliente puede terminar cuando quiera (cláusula 2). Judo Marketing puede terminar: con treinta (30) días de aviso una vez cumplido el plazo inicial; de inmediato si el cliente incumple este contrato de forma grave o usa el servicio para fines ilegales; y tras sesenta (60) días de suspensión por falta de pago.",
          "Al terminar, el website se desactiva. Los datos del cliente quedan disponibles para exportación durante treinta (30) días y después se eliminan (cláusula 7). El derecho a la entrega completa del proyecto solo existe con doce (12) cuotas completas y la cuenta al día; si el cliente termina antes, se lleva sus datos y su contenido, y el código, el diseño y el dominio quedan con Judo Marketing.",
        ],
      },
      { ...comunicacion(), titulo: "12. Comunicación y avisos" },
      { ...marcoLegal(), titulo: "13. Marco legal, firma electrónica y acuerdo completo" },
    ].map(numerar),
  };
}

/* ── 2. JuditoADS ──────────────────────────────────────────────────── */

function juditoads(d: DatosDocumento): Documento {
  return {
    titulo: "Acuerdo de servicio · JuditoADS",
    subtitulo: "Suscripción a la plataforma de publicidad en Facebook e Instagram · Mes a mes",
    datos: partes(d, `JuditoADS${d.proyecto ? ` · ${d.proyecto}` : ""}`),
    secciones: [
      {
        titulo: "1. El servicio",
        parrafos: [
          `JuditoADS es una plataforma de software de Judo Marketing que le permite al cliente crear, lanzar y seguir sus propias campañas de anuncios en Facebook e Instagram (Meta) desde un panel sencillo, sin manejar el administrador de anuncios de Meta. La suscripción cuesta ${usd(d.precioMensual)} al mes, se paga por adelantado y se renueva mes a mes hasta que el cliente cancele.`,
          "Prueba gratuita. Si el cliente entra con un periodo de prueba, no se cobra nada hasta que termine. Al terminar, la suscripción se cobra automáticamente salvo que el cliente cancele antes desde su panel o por escrito.",
          "Judo Marketing provee la herramienta y su soporte. El cliente es el anunciante: decide qué anuncia, a quién, con qué presupuesto y durante cuánto tiempo.",
        ],
      },
      {
        titulo: "2. El presupuesto de anuncios es del cliente y se paga a Meta",
        parrafos: [
          "La suscripción de JuditoADS paga la herramienta. El dinero de los anuncios (el presupuesto de cada campaña) lo cobra Meta directamente en la cuenta publicitaria del cliente, con el medio de pago que el cliente tenga registrado en Meta. Judo Marketing nunca recibe, retiene ni administra ese dinero, y no responde por los cobros de Meta ni por sus políticas de facturación.",
          "El cliente controla su gasto: fija el presupuesto de cada campaña y puede pausarla o apagarla cuando quiera desde el panel. Judo Marketing no es responsable de gastos que el cliente haya autorizado al lanzar o mantener una campaña.",
        ],
      },
      {
        titulo: "3. La cuenta de Meta y los permisos que el cliente otorga",
        parrafos: [
          "Para funcionar, JuditoADS necesita que el cliente conecte sus activos de Meta (página, cuenta publicitaria, cuenta de Instagram, píxel) y autorice a la aplicación de Judo Marketing a actuar sobre ellos por medio de la API de Meta, dentro de los permisos que el cliente conceda. El cliente declara que tiene derecho a usar esas cuentas y a otorgar esos permisos.",
          "Las cuentas siguen siendo del cliente. Puede revocar el acceso cuando quiera desde su configuración de Meta; al hacerlo, la plataforma deja de poder operar sus campañas.",
          "Meta decide sobre sus cuentas. Las revisiones, rechazos de anuncios, restricciones, verificaciones o cierres de cuentas publicitarias son decisiones de Meta según sus propias reglas. Judo Marketing no las controla, no las garantiza y no responde por ellas, aunque orientará al cliente en lo razonable para resolverlas. El cliente debe cumplir las Normas de Publicidad, los Términos Comerciales y las demás políticas de Meta.",
        ],
      },
      {
        titulo: "4. Datos de la plataforma de Meta",
        parrafos: [
          "Judo Marketing usa los datos que recibe de Meta a través de la conexión del cliente (Platform Data) únicamente para prestar JuditoADS: crear y administrar las campañas del cliente, mostrarle sus resultados y dar soporte. No los vende, no los comparte con anunciantes ni con redes de datos, y no los usa para fines ajenos al servicio, conforme a los Términos de la Plataforma de Meta.",
          "El cliente puede pedir la eliminación de sus datos de la plataforma en cualquier momento escribiendo a admin@judomarketing.net o desde el enlace de eliminación de datos publicado en www.judomarketing.net/legal. Se completa dentro de los treinta (30) días. Al cancelar la suscripción, se eliminan salvo lo que la ley obligue a conservar.",
        ],
      },
      {
        titulo: "5. Contenido de los anuncios y cumplimiento",
        parrafos: [
          "El cliente es el único responsable del contenido de sus anuncios: textos, imágenes, videos, ofertas, precios, afirmaciones sobre sus productos, y de tener los derechos sobre el material que use. También es responsable de que su segmentación cumpla la ley y las reglas de Meta, en especial en las categorías especiales (vivienda, crédito, empleo, temas sociales o políticos) y en publicidad dirigida a menores.",
          "Judo Marketing puede negarse a lanzar, pausar o retirar un anuncio que sea ilegal, engañoso, que infrinja derechos de terceros o que viole las reglas de Meta, sin que eso dé derecho a reembolso. Si Meta sanciona la aplicación de Judo Marketing por conducta del cliente, el cliente responde por el daño causado.",
        ],
      },
      datosYPrivacidad("JuditoADS recibe del cliente y de sus activos de Meta (públicos, audiencias, resultados de campañas, datos de contacto del negocio)"),
      {
        titulo: "7. Pagos, atrasos y suspensión",
        parrafos: [
          "La suscripción se cobra por adelantado cada mes con la tarjeta registrada en el procesador de pagos de Judo Marketing. Si un cobro falla, se avisa al cliente; si no se regulariza en siete (7) días, la cuenta se suspende y las campañas activas se pausan. Al pagar, se reactiva de inmediato y sin recargos. No se reembolsan meses parciales.",
          "Judo Marketing puede cambiar el precio de la suscripción con treinta (30) días de aviso por correo; el cliente puede cancelar antes de que el nuevo precio aplique.",
        ],
      },
      disponibilidad("la API y las plataformas de Meta, el alojamiento de la aplicación, la base de datos y el procesador de pagos"),
      garantiasYResponsabilidad([
        "Judo Marketing no garantiza que Meta apruebe un anuncio, que una campaña alcance a cierta cantidad de personas ni que produzca ventas o clientes. Los resultados dependen del producto, del presupuesto, del contenido y de las decisiones de Meta.",
      ]),
      {
        titulo: "10. Cancelación y terminación",
        parrafos: [
          "El cliente cancela cuando quiera desde su panel o por escrito; la suscripción termina al final del periodo ya pagado y no se cobra el siguiente. Las campañas activas se pausan al terminar; el cliente puede seguir administrándolas directamente en Meta.",
          "Judo Marketing puede terminar el servicio de inmediato si el cliente usa la plataforma para contenido ilegal o engañoso, viola las reglas de Meta de forma que ponga en riesgo la aplicación de Judo Marketing, o intenta vulnerar la seguridad de la plataforma. En los demás casos, con treinta (30) días de aviso.",
        ],
      },
      { ...comunicacion(), titulo: "11. Comunicación y avisos" },
      { ...marcoLegal(), titulo: "12. Marco legal, firma electrónica y acuerdo completo" },
    ].map(numerar),
  };
}

/* ── 3. Juditos (AI Assistants) ────────────────────────────────────── */

function juditos(d: DatosDocumento): Documento {
  return {
    titulo: "Acuerdo de servicio · Juditos, asistentes con inteligencia artificial",
    subtitulo: "Suscripción por asistente · Mes a mes",
    datos: partes(d, `Judito${d.proyecto ? ` · ${d.proyecto}` : ""}`),
    secciones: [
      {
        titulo: "1. El servicio",
        parrafos: [
          `Un Judito es un asistente con inteligencia artificial que Judo Marketing configura para el negocio del cliente y conecta a sus canales (WhatsApp, Instagram, Messenger, chat del website u otros que se acuerden) para atender a sus clientes: responder preguntas, dar información de productos, precios y horarios, tomar datos de contacto y, cuando el cliente lo configure, agendar o derivar a una persona. La suscripción cuesta ${usd(d.precioMensual)} al mes por asistente, se paga por adelantado y se renueva mes a mes hasta que el cliente cancele.`,
          "Incluye: la configuración inicial del asistente con la información que el cliente entregue; su conexión a los canales acordados; el panel donde el cliente ve las conversaciones y ajusta las instrucciones; el alojamiento; y el consumo base de mensajes de la cláusula 6.",
        ],
      },
      {
        titulo: "2. Qué es una inteligencia artificial y qué no",
        parrafos: [
          "El asistente genera sus respuestas con un modelo de inteligencia artificial a partir de las instrucciones, documentos y datos que el cliente le entrega. Puede equivocarse, entender mal una pregunta o inventar un dato cuando no tiene la información. Judo Marketing lo configura para reducir esos errores y para que derive a una persona cuando no sepa, pero no puede garantizar que ninguna respuesta sea incorrecta.",
          "El cliente es el responsable de lo que el asistente dice en su nombre. Debe revisar y aprobar la configuración inicial, mantener actualizada la información (precios, horarios, productos, políticas) y revisar periódicamente las conversaciones desde su panel. Si el asistente comunica una oferta, un precio o una promesa que salió de la información del cliente, el cliente responde por ella ante su cliente. Judo Marketing no es parte de las ventas ni de los acuerdos entre el cliente y sus clientes.",
          "No es para consejo profesional ni emergencias. El asistente no debe usarse para dar diagnósticos ni consejos médicos, legales, financieros o de seguridad, ni para atender emergencias. Si el negocio del cliente toca esos temas, el asistente se configura para derivar a una persona y el cliente debe informar a sus usuarios a quién acudir en una urgencia.",
          "Transparencia. El cliente se obliga a que sus usuarios sepan que hablan con un asistente automático, en la forma que exijan las plataformas y la ley. Judo Marketing configura el asistente para identificarse como tal cuando se le pregunte.",
        ],
      },
      {
        titulo: "3. Canales y plataformas de mensajería",
        parrafos: [
          "El cliente conecta sus propias cuentas (número de WhatsApp Business, página de Facebook, cuenta de Instagram, website) y declara que tiene derecho a usarlas. Esas cuentas siguen siendo suyas y puede desconectarlas cuando quiera.",
          "El cliente debe cumplir las reglas de mensajería comercial de cada plataforma: por ejemplo, escribir solo a quien haya dado su consentimiento, respetar las ventanas de respuesta, no enviar mensajes masivos no solicitados y no usar el asistente para contenido prohibido. Las restricciones, bloqueos o cierres que una plataforma aplique a las cuentas del cliente son decisiones de esa plataforma y no responsabilidad de Judo Marketing. Los costos que las plataformas cobren por mensaje o por conversación (por ejemplo, las tarifas de WhatsApp Business) los paga el cliente directamente a la plataforma y no están incluidos en la suscripción.",
        ],
      },
      {
        titulo: "4. Conversaciones, datos y proveedores de inteligencia artificial",
        parrafos: [
          "Las conversaciones del asistente se guardan para que el servicio funcione, para que el cliente pueda revisarlas en su panel y para mejorar las respuestas de su propio asistente. Se conservan mientras dure la suscripción y se eliminan dentro de los treinta (30) días siguientes a la cancelación, salvo lo que la ley obligue a conservar.",
          "Para generar cada respuesta, el contenido de la conversación se envía a proveedores de modelos de inteligencia artificial contratados por Judo Marketing bajo términos comerciales que prohíben usar esos datos para entrenar sus modelos. Judo Marketing no usa las conversaciones del cliente para entrenar modelos propios ni las cede a terceros. La lista de proveedores está disponible a solicitud del cliente.",
          "El cliente es el responsable de tratamiento frente a sus usuarios: de informarles, de obtener los consentimientos que exija la ley y de que lo que el asistente recoge (nombre, teléfono, correo, datos del pedido) sea lo necesario para atenderlos. Judo Marketing actúa como proveedor de servicio por cuenta del cliente.",
        ],
      },
      datosYPrivacidad(
        "el asistente recoge de los usuarios del cliente en sus conversaciones",
        "Datos sensibles y salud (HIPAA). El asistente no debe usarse para recibir ni guardar información de salud protegida (PHI), números de tarjeta, contraseñas ni documentos de identidad. Si el negocio del cliente es una entidad cubierta o un asociado de negocio bajo HIPAA, o si por su naturaleza sus usuarios podrían compartir información de salud, el cliente debe declararlo por escrito ANTES de activar el asistente. En ese caso el asistente no se activa hasta que (a) exista un Business Associate Agreement firmado por ambas partes y (b) el asistente esté configurado en su versión compatible con HIPAA, con proveedores de inteligencia artificial que acepten un BAA, que tiene costo adicional. Sin esos dos pasos, el asistente se configura para no recibir ese tipo de información y derivar a una persona; si aun así un usuario la envía, el cliente responde por ella y mantiene indemne a Judo Marketing."
      ),
      {
        titulo: "6. Consumo base y ajuste por uso",
        parrafos: [
          "La suscripción incluye el consumo base de un asistente para un negocio pequeño o mediano: la cantidad de conversaciones y mensajes por mes indicada en la ficha del plan vigente en www.judomarketing.net al momento de contratar, o en su defecto mil (1.000) conversaciones al mes.",
          "Si el asistente supera claramente ese consumo durante dos (2) meses seguidos, Judo Marketing le mostrará al cliente el consumo medido y el nuevo precio, proporcional a ese consumo, con treinta (30) días de aviso. El cliente puede aceptarlo, limitar el uso del asistente o cancelar. Nunca se aumenta el precio sin mostrar el consumo que lo justifica.",
        ],
      },
      {
        titulo: "7. Pagos, atrasos y suspensión",
        parrafos: [
          "La suscripción se cobra por adelantado cada mes con la tarjeta registrada en el procesador de pagos de Judo Marketing. Si un cobro falla, se avisa al cliente; si no se regulariza en siete (7) días, el asistente se pausa: deja de responder y, si el canal lo permite, muestra un mensaje neutro de «asistente no disponible». Al pagar, se reactiva de inmediato y sin recargos. No se reembolsan meses parciales.",
          "Judo Marketing puede cambiar el precio de la suscripción con treinta (30) días de aviso por correo; el cliente puede cancelar antes de que el nuevo precio aplique.",
        ],
      },
      disponibilidad("los proveedores de modelos de inteligencia artificial, las plataformas de mensajería (Meta, WhatsApp y otras), el alojamiento, la base de datos y el procesador de pagos"),
      garantiasYResponsabilidad([
        "Judo Marketing no garantiza que el asistente responda correctamente en todos los casos, que convierta consultas en ventas ni que las plataformas de mensajería mantengan sus condiciones. El cliente reconoce que la inteligencia artificial es una tecnología con límites y que la revisión humana de su negocio sigue siendo suya.",
      ]),
      {
        titulo: "10. Cancelación, terminación y qué se lleva el cliente",
        parrafos: [
          "El cliente cancela cuando quiera desde su panel o por escrito; la suscripción termina al final del periodo ya pagado y no se cobra el siguiente. Al terminar, el asistente se desconecta de los canales del cliente.",
          "Lo que el cliente entregó (sus instrucciones, documentos, información del negocio) y el historial de sus conversaciones son del cliente: puede pedir una exportación dentro de los treinta (30) días siguientes. La plataforma, el software, los modelos y la forma en que el asistente está construido son de Judo Marketing y no se entregan.",
          "Judo Marketing puede terminar el servicio de inmediato si el asistente se usa para fines ilegales, engañosos o prohibidos por las plataformas, para enviar mensajes no solicitados, o si el cliente intenta vulnerar la seguridad del servicio. En los demás casos, con treinta (30) días de aviso.",
        ],
      },
      { ...comunicacion(), titulo: "11. Comunicación y avisos" },
      { ...marcoLegal(), titulo: "12. Marco legal, firma electrónica y acuerdo completo" },
    ].map(numerar),
  };
}

/**
 * Las cláusulas compartidas no traen número. Se numera aquí, en orden, para
 * que un contrato nunca salga con un «7» delante de un «5».
 */
function numerar(s: Seccion, i: number): Seccion {
  const sinNumero = s.titulo.replace(/^\d+\.\s*/, "");
  return { ...s, titulo: `${i + 1}. ${sinNumero}` };
}

export function documento(tipo: TipoDocumento, d: DatosDocumento): Documento {
  if (tipo === "websites") return websites(d);
  if (tipo === "juditoads") return juditoads(d);
  return juditos(d);
}
