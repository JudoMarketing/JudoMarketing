/**
 * Contenido de la Service Policy & Terms para la página /legal.
 * La versión maestra y legalmente vigente es la de INGLÉS
 * (docs/legal/service-policy.md → Service_Policy_and_Terms.pdf).
 * La versión en español es una traducción informativa fiel.
 * Si se edita el markdown maestro, actualizar este archivo también.
 */

export type PolicySection = { title: string; body: string[] };

export const policyContent: Record<
  "es" | "en",
  { effective: string; sections: PolicySection[] }
> = {
  en: {
    effective: "Effective Date: 08/05/2026",
    sections: [
      {
        title: "1. Agreement",
        body: [
          'This Service Policy & Terms ("Policy") governs all services provided by Judo Marketing, including website design and maintenance, mobile and web applications, admin portals, digital products, virtual assistants, automations, marketing packages, advertising support, and consulting. By requesting services, signing a service agreement, paying an invoice, creating an account, or using a delivered product, the client agrees to this Policy. If a signed service agreement conflicts with this Policy, the signed agreement controls for that project.',
        ],
      },
      {
        title: "2. Services and Plans",
        body: [
          "Services are provided as monthly subscriptions (such as Essential Websites, Complex Websites, and Mobile Apps), one-time projects, or custom proposals. The exact scope, price, and inclusions of each plan are stated on www.judomarketing.net, the applicable proposal, or the signed service agreement. Anything not expressly included is outside scope and may require an additional quote. Minor updates included in subscription plans cover small text edits, image replacements, link changes, basic form updates, and small layout adjustments — not new pages, redesigns, new branding, or new integrations.",
        ],
      },
      {
        title: "3. Client Responsibilities",
        body: [
          "The client is responsible for providing accurate information, timely approvals, and the materials needed to complete the work (logos, content, access, service descriptions). The client must review and approve deliverables before use and must ensure that all claims, prices, testimonials, and offers about its business are truthful and legally permitted. The client is responsible for its own licenses, insurance, and industry-specific compliance. The client must not send unnecessary sensitive information; see Section 12.",
        ],
      },
      {
        title: "4. Payments and Billing",
        body: [
          "Subscription payments are due monthly in advance on the agreed billing date. Judo Marketing does not charge late fees or non-payment penalties: if a payment is not received, the only consequences are suspension of services as described in Section 8 and pausing of the ownership-transfer clock in Section 7. The client is responsible for third-party costs (advertising budgets, premium software, stock assets) unless expressly included in writing.",
        ],
      },
      {
        title: "5. Subscriptions, Renewal, and Cancellation",
        body: [
          "Subscriptions renew monthly until canceled. The client may cancel at any time, free of charge, by written request to admin@judomarketing.net or through the client portal. Cancellation stops future billing; the service and the website are deactivated immediately upon cancellation. Where applicable law requires an online cancellation method, Judo Marketing provides one.",
        ],
      },
      {
        title: "6. Refunds and the 30-Day Delivery Guarantee",
        body: [
          "Because services are customized digital work, payments are non-refundable once work has started or a subscription period has begun — with one exception: the 30-Day Delivery Guarantee. If Judo Marketing fails to deliver the client's initial website or agreed project within thirty (30) days after receiving all required client materials, information, access, and approvals, the client may request a full refund of the first subscription payment. This guarantee does not apply to delays caused by the client, incomplete materials, third-party platforms, or scope changes requested after the project started. Refunds are not provided because a campaign or website did not produce a specific business result (see Section 9). Third-party fees are non-refundable.",
        ],
      },
      {
        title: "7. Twelve-Month Ownership Rule",
        body: [
          "Judo Marketing owns and retains administrative control of the website code, design, portals, hosting configuration, and domain during the first twelve (12) months of service. Ownership transfer becomes available when all of the following are satisfied:",
          "• The client has completed twelve (12) full monthly subscription payments.",
          "• The account has no unpaid invoices, chargebacks, disputes, or outstanding balances.",
          "• The client has complied with this Policy and any applicable service agreement.",
          "• Any third-party transfer, registrar, hosting, or platform fees have been paid.",
          "A client who decides to end the service after the twelve-month term may request delivery of the domain and website code by formal written request to admin@judomarketing.net or through the contact page at www.judomarketing.net. Transfers are subject to registrar rules and third-party fees. Judo Marketing's internal templates, reusable systems, frameworks, and proprietary tools are not transferred. Client-provided materials always remain the client's property. A discretionary buyout before the twelve-month term may be offered in writing.",
        ],
      },
      {
        title: "8. Suspension for Non-Payment",
        body: [
          "If an account becomes past due, Judo Marketing may temporarily disable the client's website and display a neutral suspension page stating that the site is temporarily disabled, identified with Judo Marketing branding and a link to www.judomarketing.net, with no advertising. The client expressly authorizes this suspension page. Service is restored promptly once the account is current — with no late fees, penalties, or reactivation charges for a first occurrence. Judo Marketing may also suspend or terminate services for illegal requests, abusive conduct, security risks, or violations of Section 10.",
        ],
      },
      {
        title: "9. No Guarantee of Results",
        body: [
          "Judo Marketing uses professional efforts to improve presentation, visibility, lead capture, and client experience, but does not guarantee sales, leads, revenue, appointments, search rankings, platform approvals, audience growth, or any specific business outcome. Results depend on market conditions, competition, budget, offer quality, platform algorithms, and other factors outside Judo Marketing's control. Any promotional guarantee (for example, a traffic-growth guarantee) is defined exclusively by its written remedy — such as continued work at no additional cost until the target is met — and never as a promise of a specific business outcome.",
        ],
      },
      {
        title: "10. Acceptable Use",
        body: [
          "Clients may not use Judo Marketing services or deliverables for: illegal, fraudulent, deceptive, or abusive activity; phishing, impersonation, scams, or malware; false advertising, unsupported claims, fake testimonials, or fabricated reviews; harassment, hate speech, or exploitation; sexually explicit commercial content or illegal services; unlawful collection or disclosure of personal, health, financial, or children's data; or any use that damages Judo Marketing's systems, reputation, or platform accounts. Clients in regulated industries (healthcare, ABA therapy, financial, legal, insurance, education) are responsible for their own regulatory compliance. Judo Marketing may refuse, pause, or remove work that creates legal, ethical, platform, or reputational risk.",
        ],
      },
      {
        title: "11. Advertising and Third-Party Platforms",
        body: [
          "Advertising and integrations depend on third-party platforms (Meta, Google, TikTok, email/SMS providers, payment processors, hosting, registrars). Judo Marketing does not control platform approvals, suspensions, pricing, reach, or algorithmic delivery, and is not responsible for third-party outages or policy changes. The client is responsible for truthful claims, honoring advertised offers, and advertising spend. Testimonials and endorsements must be truthful and properly disclose any material connection.",
        ],
      },
      {
        title: "12. Privacy and Data Protection",
        body: [
          "Judo Marketing collects basic business and contact information (name, business name, email, phone, billing and service information) from visitors, prospects, and clients, through forms, communications, and service delivery. Information is used to provide and manage services, respond to inquiries, send service and promotional communications (subject to opt-out), and maintain business records. Information is not sold. Information is shared only with service providers needed to deliver the work (hosting, payment processing, software platforms), to comply with law, or to protect Judo Marketing's rights.",
          "Safeguards include encrypted systems, access controls, and limited personnel access. Sensitive information processed for a project is deleted after 90 days unless retention is required for legal, billing, security, or active-service purposes. If a security incident creates a legal notification obligation, Judo Marketing will provide notices required by applicable law, including Florida breach-notification requirements. For healthcare or regulated clients, HIPAA-compliant and encrypted platforms are used when applicable; a Business Associate Agreement must be signed before any protected health information is processed, and clients must not send PHI through unsecured channels or without a signed BAA. Judo Marketing provides business-to-business services and does not knowingly collect personal information from children under 13. Requests for access, correction, deletion, or opt-out: admin@judomarketing.net.",
        ],
      },
      {
        title: "13. Communications and Opt-Out",
        body: [
          'By contacting Judo Marketing or providing contact information, you agree that Judo Marketing may contact you by email, phone, text, or social media about inquiries, services, and related business matters, including occasional promotional messages. You may opt out of promotional communications at any time by replying "unsubscribe" or "STOP," or by contacting admin@judomarketing.net. Service-related and transactional communications (billing, security, legal notices, appointment reminders) continue after a promotional opt-out. Message and data rates may apply to SMS.',
        ],
      },
      {
        title: "14. Communication Channel",
        body: [
          "The client's primary point of contact is the assigned Judo Marketing representative. Clients who wish to communicate directly with administration may do so through the contact page at www.judomarketing.net. Formal requests (cancellation, ownership transfer, billing disputes) must be submitted in writing to admin@judomarketing.net.",
        ],
      },
      {
        title: "15. Confidentiality and Portfolio Use",
        body: [
          "Each party will use reasonable care to protect the other's nonpublic business information and use it only to provide or receive services. Unless the client requests confidentiality in writing, Judo Marketing may show completed public-facing work in its portfolio and marketing materials without disclosing confidential information.",
        ],
      },
      {
        title: "16. Limitation of Liability and Indemnification",
        body: [
          "To the maximum extent permitted by law, Judo Marketing is not liable for indirect, incidental, consequential, punitive, or lost-profit damages, and its total liability for any claim is limited to the amounts paid by the client for the specific service during the three (3) months before the event giving rise to the claim. The client agrees to defend, indemnify, and hold harmless Judo Marketing from claims arising from client-provided materials, the client's products and operations, regulatory violations, or misuse of deliverables.",
        ],
      },
      {
        title: "17. Electronic Agreements, Governing Law, and Updates",
        body: [
          "Electronic signatures, checkbox agreements, online approvals, and digital records have the same legal effect as paper records where permitted by law. This Policy is governed by the laws of the State of Florida; venue for disputes is the state or federal courts of Miami-Dade County, Florida. Judo Marketing may update this Policy from time to time; updates are posted on www.judomarketing.net with a revised effective date, and continued use of services constitutes acceptance.",
        ],
      },
      {
        title: "18. Contact",
        body: [
          "Judo Marketing · 66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130 · www.judomarketing.net · admin@judomarketing.net · 305-934-9981",
        ],
      },
    ],
  },
  es: {
    effective: "Fecha efectiva: 08/05/2026",
    sections: [
      {
        title: "1. Acuerdo",
        body: [
          'Esta Política de Servicio y Términos ("Política") rige todos los servicios de Judo Marketing: diseño y mantenimiento de websites, aplicaciones móviles y web, portales de administración, productos digitales, asistentes virtuales, automatizaciones, paquetes de marketing, soporte publicitario y consultoría. Al solicitar servicios, firmar un acuerdo de servicio, pagar una factura, crear una cuenta o usar un producto entregado, el cliente acepta esta Política. Si un acuerdo de servicio firmado contradice esta Política, el acuerdo firmado prevalece para ese proyecto.',
        ],
      },
      {
        title: "2. Servicios y planes",
        body: [
          "Los servicios se ofrecen como suscripciones mensuales (Websites Esenciales, Websites Complejos y Apps Móviles), proyectos únicos o propuestas personalizadas. El alcance, precio e inclusiones exactas de cada plan se indican en www.judomarketing.net, la propuesta aplicable o el acuerdo firmado. Lo que no esté expresamente incluido está fuera de alcance y puede requerir cotización adicional. Las actualizaciones menores incluidas cubren pequeños cambios de texto, reemplazo de imágenes, cambios de enlaces, ajustes básicos de formularios y pequeños ajustes de diseño — no páginas nuevas, rediseños, nueva marca ni nuevas integraciones.",
        ],
      },
      {
        title: "3. Responsabilidades del cliente",
        body: [
          "El cliente es responsable de dar información veraz, aprobaciones a tiempo y los materiales necesarios para completar el trabajo (logos, contenido, accesos, descripciones de servicios). Debe revisar y aprobar los entregables antes de usarlos y asegurar que todas las afirmaciones, precios, testimonios y ofertas de su negocio sean veraces y legalmente permitidas. El cliente es responsable de sus propias licencias, seguros y cumplimiento de su industria. No debe enviar información sensible innecesaria; ver Sección 12.",
        ],
      },
      {
        title: "4. Pagos y facturación",
        body: [
          "Los pagos de suscripción se hacen mensualmente por adelantado en la fecha acordada. Judo Marketing no cobra recargos por mora ni penalidades por falta de pago: si un pago no se recibe, las únicas consecuencias son la suspensión del servicio descrita en la Sección 8 y la pausa del reloj de transferencia de propiedad de la Sección 7. El cliente es responsable de los costos de terceros (presupuestos publicitarios, software premium, recursos de stock) salvo que estén incluidos por escrito.",
        ],
      },
      {
        title: "5. Suscripciones, renovación y cancelación",
        body: [
          "Las suscripciones se renuevan mensualmente hasta cancelarse. El cliente puede cancelar en cualquier momento, sin costo, por solicitud escrita a admin@judomarketing.net o desde su portal. La cancelación detiene la facturación futura; el servicio y el website se desactivan de inmediato al cancelar. Donde la ley exija un método de cancelación online, Judo Marketing lo ofrece.",
        ],
      },
      {
        title: "6. Reembolsos y la Garantía de Entrega de 30 Días",
        body: [
          "Como los servicios son trabajo digital personalizado, los pagos no son reembolsables una vez iniciado el trabajo o el período de suscripción — con una excepción: la Garantía de Entrega de 30 Días. Si Judo Marketing no entrega el website inicial o proyecto acordado dentro de treinta (30) días después de recibir todos los materiales, información, accesos y aprobaciones del cliente, el cliente puede solicitar el reembolso completo de su primer pago de suscripción. Esta garantía no aplica a demoras causadas por el cliente, materiales incompletos, plataformas de terceros o cambios de alcance pedidos después de iniciado el proyecto. No se dan reembolsos porque una campaña o website no produjo un resultado de negocio específico (ver Sección 9). Las tarifas de terceros no son reembolsables.",
        ],
      },
      {
        title: "7. Regla de Propiedad de Doce Meses",
        body: [
          "Judo Marketing es propietaria y mantiene el control administrativo del código del website, el diseño, los portales, la configuración de hosting y el dominio durante los primeros doce (12) meses de servicio. La transferencia de propiedad está disponible cuando se cumple todo lo siguiente:",
          "• El cliente completó doce (12) pagos mensuales completos de suscripción.",
          "• La cuenta no tiene facturas pendientes, contracargos, disputas ni saldos.",
          "• El cliente cumplió esta Política y el acuerdo de servicio aplicable.",
          "• Se pagaron las tarifas de terceros necesarias para la transferencia (registrar, hosting, plataformas).",
          "El cliente que decida dejar el servicio después del año puede solicitar la entrega del dominio y del código mediante solicitud formal escrita a admin@judomarketing.net o por la página de contacto de www.judomarketing.net. Las transferencias están sujetas a reglas del registrar y tarifas de terceros. Las plantillas internas, sistemas reutilizables, frameworks y herramientas propias de Judo Marketing no se transfieren. Los materiales aportados por el cliente siempre son propiedad del cliente. Antes del año puede ofrecerse un buyout discrecional por escrito.",
        ],
      },
      {
        title: "8. Suspensión por falta de pago",
        body: [
          "Si una cuenta entra en mora, Judo Marketing puede deshabilitar temporalmente el website del cliente y mostrar una página neutral de suspensión que indica que el sitio está temporalmente deshabilitado, identificada con la marca de Judo Marketing y un enlace a www.judomarketing.net, sin publicidad. El cliente autoriza expresamente esta página. El servicio se restablece de inmediato al ponerse al día — sin recargos, penalidades ni cargos de reactivación en una primera ocurrencia. Judo Marketing también puede suspender o terminar servicios por solicitudes ilegales, conducta abusiva, riesgos de seguridad o violaciones de la Sección 10.",
        ],
      },
      {
        title: "9. Sin garantía de resultados",
        body: [
          "Judo Marketing aplica esfuerzos profesionales para mejorar presentación, visibilidad, captación de clientes y experiencia, pero no garantiza ventas, leads, ingresos, citas, posiciones en buscadores, aprobaciones de plataformas, crecimiento de audiencia ni ningún resultado de negocio específico. Los resultados dependen del mercado, la competencia, el presupuesto, la calidad de la oferta, los algoritmos de las plataformas y otros factores fuera del control de Judo Marketing. Cualquier garantía promocional (por ejemplo, una garantía de crecimiento de tráfico) se define exclusivamente por su remedio escrito — como trabajo continuo sin costo adicional hasta lograr la meta — y nunca como promesa de un resultado específico.",
        ],
      },
      {
        title: "10. Uso aceptable",
        body: [
          "Los clientes no pueden usar los servicios o entregables de Judo Marketing para: actividad ilegal, fraudulenta, engañosa o abusiva; phishing, suplantación, estafas o malware; publicidad falsa, afirmaciones sin sustento, testimonios falsos o reseñas fabricadas; acoso, discurso de odio o explotación; contenido sexual comercial explícito o servicios ilegales; recolección o divulgación ilegal de datos personales, de salud, financieros o de menores; ni ningún uso que dañe los sistemas, la reputación o las cuentas de plataforma de Judo Marketing. Los clientes de industrias reguladas (salud, terapia ABA, finanzas, legal, seguros, educación) son responsables de su propio cumplimiento regulatorio. Judo Marketing puede rechazar, pausar o retirar trabajo que cree riesgo legal, ético, de plataforma o reputacional.",
        ],
      },
      {
        title: "11. Publicidad y plataformas de terceros",
        body: [
          "La publicidad y las integraciones dependen de plataformas de terceros (Meta, Google, TikTok, proveedores de email/SMS, procesadores de pago, hosting, registrars). Judo Marketing no controla aprobaciones, suspensiones, precios, alcance ni entrega algorítmica de las plataformas, y no es responsable de sus caídas o cambios de política. El cliente es responsable de la veracidad de sus afirmaciones, de honrar sus ofertas publicadas y de su gasto publicitario. Los testimonios y patrocinios deben ser veraces y divulgar cualquier conexión material.",
        ],
      },
      {
        title: "12. Privacidad y protección de datos",
        body: [
          "Judo Marketing recolecta información básica de negocio y contacto (nombre, nombre del negocio, email, teléfono, información de facturación y servicio) de visitantes, prospectos y clientes, mediante formularios, comunicaciones y la prestación del servicio. La información se usa para prestar y gestionar servicios, responder consultas, enviar comunicaciones de servicio y promocionales (con derecho a opt-out) y mantener registros de negocio. La información no se vende. Solo se comparte con proveedores necesarios para el trabajo (hosting, procesamiento de pagos, plataformas de software), para cumplir la ley o para proteger los derechos de Judo Marketing.",
          "Las salvaguardas incluyen sistemas cifrados, controles de acceso y personal limitado. La información sensible procesada para un proyecto se elimina a los 90 días salvo que deba retenerse por razones legales, de facturación, seguridad o servicio activo. Si un incidente de seguridad crea obligación legal de notificación, Judo Marketing dará los avisos que exija la ley, incluidas las reglas de notificación de brechas de Florida. Para clientes de salud o regulados se usan plataformas cifradas y compatibles con HIPAA cuando aplique; debe firmarse un Business Associate Agreement antes de procesar información de salud protegida, y los clientes no deben enviarla por canales inseguros ni sin BAA firmado. Judo Marketing presta servicios entre negocios y no recolecta a sabiendas información de menores de 13 años. Solicitudes de acceso, corrección, eliminación u opt-out: admin@judomarketing.net.",
        ],
      },
      {
        title: "13. Comunicaciones y opt-out",
        body: [
          'Al contactar a Judo Marketing o dar tu información de contacto, aceptas que Judo Marketing pueda contactarte por email, teléfono, mensaje de texto o redes sociales sobre consultas, servicios y asuntos de negocio relacionados, incluidos mensajes promocionales ocasionales. Puedes salir de las comunicaciones promocionales en cualquier momento respondiendo "unsubscribe" o "STOP", o escribiendo a admin@judomarketing.net. Las comunicaciones de servicio y transaccionales (facturación, seguridad, avisos legales, recordatorios de citas) continúan después del opt-out promocional. Pueden aplicar tarifas de mensajería según tu operador.',
        ],
      },
      {
        title: "14. Canal de comunicación",
        body: [
          "El punto de contacto principal del cliente es su representante asignado de Judo Marketing. Los clientes que deseen comunicarse directamente con administración pueden hacerlo por la página de contacto de www.judomarketing.net. Las solicitudes formales (cancelación, transferencia de propiedad, disputas de facturación) deben enviarse por escrito a admin@judomarketing.net.",
        ],
      },
      {
        title: "15. Confidencialidad y uso de portafolio",
        body: [
          "Cada parte cuidará razonablemente la información no pública de la otra y la usará solo para prestar o recibir servicios. Salvo que el cliente pida confidencialidad por escrito, Judo Marketing puede mostrar trabajo público terminado en su portafolio y materiales de marketing sin revelar información confidencial.",
        ],
      },
      {
        title: "16. Limitación de responsabilidad e indemnización",
        body: [
          "En la máxima medida permitida por la ley, Judo Marketing no es responsable de daños indirectos, incidentales, consecuentes, punitivos ni de lucro cesante, y su responsabilidad total por cualquier reclamo se limita a los montos pagados por el cliente por el servicio específico durante los tres (3) meses anteriores al evento que origina el reclamo. El cliente acepta defender, indemnizar y mantener indemne a Judo Marketing frente a reclamos derivados de materiales aportados por el cliente, sus productos y operaciones, violaciones regulatorias o mal uso de los entregables.",
        ],
      },
      {
        title: "17. Acuerdos electrónicos, ley aplicable y actualizaciones",
        body: [
          "Las firmas electrónicas, casillas de aceptación, aprobaciones online y registros digitales tienen el mismo efecto legal que los documentos en papel donde la ley lo permita. Esta Política se rige por las leyes del Estado de Florida; la jurisdicción para disputas son los tribunales estatales o federales de Miami-Dade County, Florida. Judo Marketing puede actualizar esta Política; las actualizaciones se publican en www.judomarketing.net con nueva fecha efectiva y el uso continuo de los servicios constituye aceptación.",
        ],
      },
      {
        title: "18. Contacto",
        body: [
          "Judo Marketing · 66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130 · www.judomarketing.net · admin@judomarketing.net · 305-934-9981",
        ],
      },
    ],
  },
};
