"""Genera los PDF legales descargables: contrato de cliente (ES) y Service Policy & Terms (EN).

Uso: python scripts/generate_legal_pdfs.py
Salida: docs/legal/contracts/Acuerdo_de_Servicio_Cliente.pdf
        docs/legal/Service_Policy_and_Terms.pdf (desde docs/legal/service-policy.md)
"""
import re
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
        [Paragraph("<b>Plan:</b> [&nbsp;&nbsp;] Website Esencial &nbsp;&nbsp; "
                   "[&nbsp;&nbsp;] Website Complejo &nbsp;&nbsp; "
                   "[&nbsp;&nbsp;] App &nbsp;&nbsp; [&nbsp;&nbsp;] Otro: ______________", BODY),
         ""],
        [Paragraph("<b>Precio acordado:</b> $________ /mes", BODY),
         line_cell("Dominio / Proyecto", 26)],
        [line_cell("Vendedor asignado"), line_cell("Fecha de inicio", 30)],
        [line_cell("Día de cobro"), line_cell("Días de gracia", 30)],
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
            "• <b>Antes de suspender siempre hay aviso.</b> El orden es: factura "
            "enviada, recordatorio, aviso de corte, y solo entonces la suspensión, "
            "una vez vencidos los días de gracia acordados (7 días si no se pactó "
            "otro número). Cada paso queda registrado con su fecha y el cliente "
            "puede pedir ese registro cuando quiera.",
            "• <b>Crédito en el sitio.</b> Mientras dure el contrato, el website "
            "lleva en su pie la frase “Website por Judo Marketing” con enlace a "
            "www.judomarketing.net. Es discreta y no interfiere con la marca del "
            "cliente.",
            "• <b>Sin reembolsos</b> fuera de la Garantía de Entrega de 30 días.",
        ]),
        ("4. Accesos que el cliente entrega", [
            "Para poder medir y mejorar los resultados, el cliente otorga a Judo "
            "Marketing acceso a las cuentas de su negocio que apliquen: Google Search "
            "Console, Google Analytics, Perfil de Empresa de Google, Meta Business y "
            "su pixel, el procesador de pagos (solo lectura) y, cuando corresponda, "
            "el registrador del dominio y el correo del negocio.",
            "• Los accesos se otorgan <b>por invitación, nunca compartiendo "
            "contraseñas</b>. Judo Marketing no solicita ni almacena las claves "
            "personales del cliente.",
            "• Las cuentas <b>siguen siendo del cliente</b>. Puede revocar cualquier "
            "acceso cuando quiera, sin dar explicaciones.",
            "• Se usan únicamente para medir resultados, optimizar el servicio "
            "contratado y alimentar el panel del propio cliente. No se usan para "
            "publicar en su nombre sin autorización, ni para contactar a sus "
            "clientes, ni se comparten con terceros.",
            "• Si el cliente no otorga o revoca un acceso, Judo Marketing no podrá "
            "reportar ni optimizar esa parte del servicio. Eso no interrumpe el "
            "contrato ni da derecho a reembolso.",
        ]),
        ("5. Qué se mide y para qué", [
            "El website del cliente envía a Judo Marketing información de "
            "funcionamiento: si el sitio está en línea, visitas, sesiones, órdenes, "
            "monto vendido, conversiones y errores.",
            "• <b>Nunca se envían datos personales de los compradores del cliente</b>: "
            "ni nombres, ni correos, ni teléfonos, ni datos de pago. Solo cifras "
            "totalizadas.",
            "• El cliente ve el detalle completo en su propio portal; Judo Marketing "
            "ve el mismo dato en resumen. Ambos leen la misma fuente, para que nunca "
            "haya dos versiones de un número.",
            "• Esta información se usa para operar el servicio, detectar caídas y "
            "mejorar resultados. Puede usarse de forma anónima y agregada en "
            "estadísticas internas de la agencia. <b>No se vende ni se cede.</b>",
        ]),
        ("6. Compromisos del cliente", [
            "El cliente <b>puede</b>: solicitar las actualizaciones menores incluidas "
            "en su plan, usar su portal de administrador, cancelar cuando lo desee, y "
            "solicitar su código y dominio al cumplir el año.",
            "El cliente <b>se compromete a</b>: entregar a tiempo los materiales, textos, "
            "fotos y accesos que el proyecto necesite, y mantener vigentes los "
            "accesos otorgados mientras dure el contrato.",
            "El cliente <b>no puede</b>: usar el servicio para actividades ilegales, "
            "engañosas o prohibidas (Acceptable Use Policy), publicar testimonios o "
            "reseñas falsas, revender o compartir los accesos de sus portales, ni "
            "retener información necesaria para el proyecto. El cliente es responsable "
            "de la veracidad del contenido, precios y ofertas de su negocio.",
        ]),
        ("7. Comunicación", [
            "El canal directo del cliente es su <b>vendedor asignado</b>. Para hablar "
            "con administración, el cliente puede usar la página de contacto de "
            "<b>www.judomarketing.net</b>. Las solicitudes formales (cancelación, "
            "entrega de código, disputas de facturación) deben enviarse por escrito a "
            "admin@judomarketing.net.",
        ]),
        ("8. Marco legal", [
            "Este acuerdo se complementa con la Política de Servicio y Términos "
            "(Service Policy &amp; Terms) publicada en www.judomarketing.net, que el "
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
    # Tres firmantes: el vendedor asignado también firma (recoge la firma del
    # cliente desde su portal; Administración contrafirma desde su email)
    sig = Table([
        [Paragraph("<b>EL CLIENTE</b>", BODY),
         Paragraph("<b>EL VENDEDOR</b>", BODY),
         Paragraph("<b>JUDO MARKETING — ADMINISTRACIÓN</b>", BODY)],
        [Paragraph("Firma: " + "_" * 20, BODY), Paragraph("Firma: " + "_" * 20, BODY),
         Paragraph("Firma: " + "_" * 20, BODY)],
        [Paragraph("Nombre: " + "_" * 18, BODY), Paragraph("Nombre: " + "_" * 18, BODY),
         Paragraph("Nombre: " + "_" * 18, BODY)],
        [Paragraph("Fecha: ___ / ___ / _____", BODY),
         Paragraph("Fecha: ___ / ___ / _____", BODY),
         Paragraph("Fecha: ___ / ___ / _____", BODY)],
    ], colWidths=[2.26 * inch, 2.26 * inch, 2.26 * inch])
    sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(sig)

    doc = doc_template("docs/legal/contracts/Acuerdo_de_Servicio_Cliente.pdf")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def md_bold(text):
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)


def build_policy():
    """Convierte docs/legal/service-policy.md al PDF oficial."""
    lines = open("docs/legal/service-policy.md", encoding="utf-8").read().splitlines()
    story, para = [], []

    def flush(style=BODY):
        nonlocal para
        if para:
            story.append(Paragraph(md_bold(" ".join(para)), style))
            para = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            flush()
            story.append(Paragraph(stripped[2:], H1))
        elif stripped.startswith("## "):
            flush()
            story.append(Paragraph(stripped[3:], H2))
        elif stripped.startswith("- "):
            flush()
            para = [chr(8226) + " " + stripped[2:]]
            flush(BULLET)
        elif stripped == "":
            flush()
        elif stripped.startswith("Effective Date:"):
            flush()
            story.append(Paragraph(stripped, SUB))
        elif len(story) == 1:  # subtítulo justo después del título
            story.append(Paragraph(stripped, SUB))
        else:
            para.append(stripped)
    flush()
    doc = doc_template("docs/legal/Service_Policy_and_Terms.pdf")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def build_seller_agreement():
    """Convierte docs/legal/contracts/acuerdo-programa-vendedores.md al PDF oficial."""
    lines = open("docs/legal/contracts/acuerdo-programa-vendedores.md",
                 encoding="utf-8").read().splitlines()
    story, para = [], []
    style = [BODY]  # estilo del párrafo en curso (holder mutable)

    def flush():
        nonlocal para
        if para:
            story.append(Paragraph(md_bold(" ".join(para)), style[0]))
            para = []
        style[0] = BODY

    for line in lines:
        s = line.strip()
        if s.startswith(">"):
            continue  # notas internas del md, no van al PDF
        if s == "---":
            break  # de aquí en adelante solo queda el pie de página del md
        if s.startswith("|"):
            continue  # la tabla de firmas se dibuja aparte
        if s.startswith("# "):
            flush()
            story.append(Paragraph("ACUERDO DEL PROGRAMA DE VENDEDORES", H1))
            story.append(Paragraph("JUDO MARKETING · Representante independiente de "
                                   "ventas", SUB))
        elif s.startswith("*") and s.endswith("*") and not s.startswith("**"):
            continue  # línea de subtítulo en cursiva del md
        elif s.startswith("## Firmas"):
            flush()
        elif s.startswith("## "):
            flush()
            story.append(Paragraph(s[3:], H2))
        elif s.startswith("- "):
            flush()
            style[0] = BULLET
            para = [chr(8226) + " " + s[2:]]
        elif s == "":
            flush()
        else:
            para.append(s)  # continuación del párrafo o viñeta en curso
    flush()

    story += [Spacer(1, 10),
              HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC")),
              Spacer(1, 6)]
    sig = Table([
        [Paragraph("<b>EL VENDEDOR</b>", BODY),
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

    doc = doc_template("docs/legal/contracts/Acuerdo_Programa_Vendedores.pdf")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_contract()
    build_policy()
    build_seller_agreement()
    print("PDFs generados.")
