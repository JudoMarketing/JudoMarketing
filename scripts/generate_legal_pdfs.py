"""Genera los PDF legales descargables: contrato de cliente (ES) y Policy Amendment No. 1 (EN).

Uso: python scripts/generate_legal_pdfs.py
Salida: docs/legal/contracts/Acuerdo_de_Servicio_Cliente.pdf
        docs/legal/pdf/Policy_Amendment_1.pdf
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable)

PURPLE = colors.HexColor("#7B2DFF")
DARK = colors.HexColor("#11111A")
GRAY = colors.HexColor("#555555")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Title"], fontName="Helvetica-Bold",
                    fontSize=16, textColor=DARK, spaceAfter=2)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], fontSize=9, textColor=GRAY,
                     alignment=1, spaceAfter=10)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=11, textColor=PURPLE, spaceBefore=8, spaceAfter=3)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], fontSize=9, leading=12.5,
                      spaceAfter=4)
BULLET = ParagraphStyle("BULLET", parent=BODY, leftIndent=14, bulletIndent=4)
FOOT = ParagraphStyle("FOOT", parent=styles["Normal"], fontSize=7.5,
                      textColor=GRAY, alignment=1)

FOOTER = ("Judo Marketing · 66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130 · "
          "www.judomarketing.net · admin@judomarketing.net · 305-934-9981")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GRAY)
    canvas.drawCentredString(letter[0] / 2, 0.45 * inch, FOOTER)
    canvas.setStrokeColor(PURPLE)
    canvas.setLineWidth(2)
    canvas.line(0.9 * inch, letter[1] - 0.55 * inch,
                letter[0] - 0.9 * inch, letter[1] - 0.55 * inch)
    canvas.restoreState()


def doc_template(path):
    return SimpleDocTemplate(path, pagesize=letter, topMargin=0.85 * inch,
                             bottomMargin=0.8 * inch, leftMargin=0.9 * inch,
                             rightMargin=0.9 * inch)


def line_cell(label, width=34):
    return Paragraph(f"<b>{label}:</b> " + "_" * width, BODY)


def build_contract():
    story = [
        Paragraph("ACUERDO DE SERVICIO", H1),
        Paragraph("JUDO MARKETING · Contrato de suscripción de website y servicios "
                  "digitales · Plazo: 12 meses", SUB),
    ]
    data = [
        [line_cell("Cliente"), line_cell("Empresa", 30)],
        [line_cell("Email"), line_cell("Teléfono", 30)],
        [Paragraph("<b>Plan:</b> [&nbsp;&nbsp;] Website Esencial $50/mes &nbsp;&nbsp; "
                   "[&nbsp;&nbsp;] Website Complejo $100/mes &nbsp;&nbsp; "
                   "[&nbsp;&nbsp;] App $150/mes &nbsp;&nbsp; [&nbsp;&nbsp;] Otro", BODY),
         ""],
        [Paragraph("<b>Precio acordado:</b> $________ /mes", BODY),
         line_cell("Dominio / Proyecto", 26)],
        [line_cell("Vendedor asignado"), line_cell("Fecha de inicio", 30)],
    ]
    t = Table(data, colWidths=[3.4 * inch, 3.4 * inch])
    t.setStyle(TableStyle([
        ("SPAN", (0, 2), (1, 2)),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story += [t, Spacer(1, 4)]

    sections = [
        ("1. El servicio",
         ["Judo Marketing diseña, construye, aloja y mantiene el website o aplicación "
          "del cliente, incluyendo su portal de administrador. El plazo del contrato es "
          "de doce (12) meses, con pago mensual por adelantado."]),
        ("2. Cómo protegemos al cliente", [
            "• <b>Garantía de entrega de 30 días.</b> Si no entregamos el proyecto "
            "inicial dentro de 30 días de recibir todos los materiales y aprobaciones "
            "del cliente, el cliente puede pedir el reembolso completo de su primer "
            "pago. Es la única excepción a la regla de no reembolso.",
            "• <b>Cero penalidades.</b> Nunca cobramos recargos por mora ni multas por "
            "cancelar.",
            "• <b>Cancelación libre.</b> El cliente puede cancelar en cualquier momento "
            "escribiendo a admin@judomarketing.net; al cancelar, el servicio y el "
            "website se desactivan de inmediato y no se factura el mes siguiente.",
            "• <b>Control total.</b> El cliente gestiona su contenido, usuarios y "
            "productos desde su portal de administrador.",
            "• <b>Privacidad.</b> No vendemos la información del cliente.",
        ]),
        ("3. Cómo se protege Judo Marketing", [
            "• <b>Propiedad durante el primer año.</b> El código, el diseño, los "
            "portales y el dominio son propiedad de Judo Marketing durante los primeros "
            "12 meses de servicio. Cumplidos 12 pagos mensuales y con la cuenta al día, "
            "si el cliente decide dejar el servicio puede solicitar la entrega del "
            "dominio y del código mediante solicitud formal por escrito a "
            "admin@judomarketing.net.",
            "• <b>Suspensión por falta de pago.</b> Si un pago no se recibe, el website "
            "puede suspenderse temporalmente y mostrar una página neutral de "
            "“Temporalmente deshabilitado” con la marca de Judo Marketing y un "
            "enlace a www.judomarketing.net, sin publicidad. El cliente autoriza "
            "expresamente esta página. Al ponerse al día, el servicio se reactiva de "
            "inmediato y sin recargos.",
            "• <b>Sin reembolsos</b> fuera de la Garantía de Entrega de 30 días.",
        ]),
        ("4. Compromisos del cliente", [
            "El cliente <b>puede</b>: solicitar las actualizaciones menores incluidas "
            "en su plan, usar su portal de administrador, cancelar cuando lo desee, y "
            "solicitar su código y dominio al cumplir el año.",
            "El cliente <b>no puede</b>: usar el servicio para actividades ilegales, "
            "engañosas o prohibidas (Acceptable Use Policy), publicar testimonios o "
            "reseñas falsas, revender o compartir los accesos de sus portales, ni "
            "retener información necesaria para el proyecto. El cliente es responsable "
            "de la veracidad del contenido, precios y ofertas de su negocio.",
        ]),
        ("5. Comunicación", [
            "El canal directo del cliente es su <b>vendedor asignado</b>. Para hablar "
            "con administración, el cliente puede usar la página de contacto de "
            "<b>www.judomarketing.net</b>. Las solicitudes formales (cancelación, "
            "entrega de código, disputas de facturación) deben enviarse por escrito a "
            "admin@judomarketing.net.",
        ]),
        ("6. Marco legal", [
            "Este acuerdo se complementa con los Términos y Condiciones y las pólizas "
            "publicadas en www.judomarketing.net (incluida la Enmienda No. 1), que el "
            "cliente declara conocer. Se rige por las leyes del Estado de Florida; "
            "jurisdicción: Miami-Dade County, Florida. Las firmas electrónicas tienen "
            "la misma validez que las manuscritas.",
        ]),
    ]
    for title, paras in sections:
        story.append(Paragraph(title, H2))
        for p in paras:
            story.append(Paragraph(p, BULLET if p.startswith("•") else BODY))

    story += [Spacer(1, 10),
              HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC")),
              Spacer(1, 6)]
    sig = Table([
        [Paragraph("<b>EL CLIENTE</b>", BODY),
         Paragraph("<b>JUDO MARKETING — ADMINISTRACIÓN</b>", BODY)],
        [Paragraph("Firma: " + "_" * 34, BODY), Paragraph("Firma: " + "_" * 34, BODY)],
        [Paragraph("Nombre: " + "_" * 32, BODY), Paragraph("Nombre: " + "_" * 32, BODY)],
        [Paragraph("Fecha: ____ / ____ / ______", BODY),
         Paragraph("Fecha: ____ / ____ / ______", BODY)],
    ], colWidths=[3.4 * inch, 3.4 * inch])
    sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(sig)

    doc = doc_template("docs/legal/contracts/Acuerdo_de_Servicio_Cliente.pdf")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def build_amendment():
    story = [
        Paragraph("POLICY AMENDMENT NO. 1", H1),
        Paragraph("JUDO MARKETING · Effective Date: 08/05/2026", SUB),
        Paragraph("This Amendment modifies the Judo Marketing policies dated 07/06/2026 "
                  "to reflect Judo Marketing's twelve-month subscription model. Where "
                  "this Amendment conflicts with any policy, proposal, or prior "
                  "document, this Amendment controls. All other terms remain in full "
                  "force.", BODY),
    ]
    sections = [
        ("1. Website and Domain Ownership (replaces Terms and Conditions §10 and "
         "Subscription and Website Ownership Policy §5)", [
            "For monthly website and application subscription plans, Judo Marketing "
            "retains ownership and administrative control of the website code, design, "
            "portals, hosting configuration, and domain during the first twelve (12) "
            "months of service.",
            "Ownership transfer becomes available only when all of the following "
            "conditions are satisfied: (1) the client has completed twelve (12) full "
            "monthly subscription payments; (2) the account has no unpaid invoices, "
            "chargebacks, disputes, or outstanding balances; (3) the client has "
            "complied with Judo Marketing's policies and any applicable service "
            "agreement; and (4) any third-party transfer fees, registrar fees, hosting "
            "fees, or platform fees required for transfer have been paid.",
            "If the client decides to end the service after the twelve-month term, the "
            "client may request delivery of the domain and website code by submitting a "
            "formal written request through the contact page at www.judomarketing.net "
            "or by email to admin@judomarketing.net. Transfers are subject to registrar "
            "rules, lock periods, verification requirements, and third-party fees. Any "
            "reference in any policy to ownership transfer “after the third "
            "month” is replaced by this twelve-month rule.",
        ]),
        ("2. Suspension Page (supplements Terms and Conditions §14)", [
            "If an account becomes past due, Judo Marketing may temporarily disable the "
            "client's website and display a neutral suspension page stating that the "
            "site is temporarily disabled. The suspension page is identified with Judo "
            "Marketing branding and a link to www.judomarketing.net and contains no "
            "advertising. The client expressly authorizes the display of this "
            "suspension page. Service is restored promptly once the account is current. "
            "Judo Marketing does not charge late fees or non-payment penalties; "
            "suspension is the only consequence of a past-due account.",
        ]),
        ("3. 30-Day Delivery Guarantee (supplements Refund and Cancellation Policy §2)", [
            "If Judo Marketing fails to deliver the client's initial website or agreed "
            "project within thirty (30) days after receiving all required client "
            "materials, information, access, and approvals, the client may request a "
            "full refund of the first subscription payment. This Delivery Guarantee is "
            "the only exception to the general no-refund rule. It does not apply to "
            "delays caused by the client, incomplete client materials, third-party "
            "platforms, or scope changes requested after the project started.",
        ]),
        ("4. Client Communication Channel", [
            "The client's primary point of contact is the assigned Judo Marketing "
            "representative. Clients who wish to communicate directly with "
            "administration may do so through the contact page at "
            "www.judomarketing.net. Formal requests (cancellation, ownership transfer, "
            "billing disputes) must be submitted in writing to admin@judomarketing.net.",
        ]),
    ]
    for title, paras in sections:
        story.append(Paragraph(title, H2))
        for p in paras:
            story.append(Paragraph(p, BODY))
    doc = doc_template("docs/legal/pdf/Policy_Amendment_1.pdf")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_contract()
    build_amendment()
    print("PDFs generados.")
