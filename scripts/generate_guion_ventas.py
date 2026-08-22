#!/usr/bin/env python3
"""Genera el Guion de Ventas de Judo Marketing en PDF (material interno
para vendedores). Salida: public/legal/Guion_de_Ventas.pdf"""

import json

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether
)

PURPLE = HexColor("#7B2DFF")
LILAC = HexColor("#A855F7")
DARK = HexColor("#1a1a24")
GRAY = HexColor("#555566")

OUT = "public/legal/Guion_de_Ventas.pdf"

# Los precios salen del mismo archivo que usa el website, para que el guion
# nunca quede diciendo una cifra que la página ya no cobra.
with open("src/content/pricing.json", encoding="utf-8") as f:
    TARIFA = json.load(f)
PRECIOS = TARIFA["precios"]


def dos_precios(plan: str) -> str:
    """El precio del plan, tal como lo cobra el website."""
    return f"${PRECIOS[plan]}/mes"

title_s = ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=22, textColor=PURPLE, alignment=TA_CENTER, spaceAfter=4)
subtitle_s = ParagraphStyle("st", fontName="Helvetica", fontSize=11, textColor=GRAY, alignment=TA_CENTER, spaceAfter=2)
h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=14, textColor=PURPLE, spaceBefore=16, spaceAfter=6)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, textColor=DARK, spaceBefore=10, spaceAfter=4)
body = ParagraphStyle("b", fontName="Helvetica", fontSize=10.5, textColor=DARK, leading=15, spaceAfter=6)
bullet = ParagraphStyle("bl", parent=body, leftIndent=16, bulletIndent=6, spaceAfter=4)
speech = ParagraphStyle("sp", fontName="Helvetica-Oblique", fontSize=10.5, textColor=DARK, leading=15,
                        leftIndent=14, rightIndent=10, spaceAfter=8, spaceBefore=2,
                        borderPadding=8, backColor=HexColor("#F4EEFF"), borderColor=LILAC, borderWidth=0.7)
qa_q = ParagraphStyle("qq", fontName="Helvetica-Bold", fontSize=10.5, textColor=PURPLE, leading=14, spaceBefore=7, spaceAfter=2)
qa_a = ParagraphStyle("qa", parent=body, leftIndent=12, spaceAfter=5)

E = []

def sec(text): E.append(Paragraph(text, h1)); E.append(HRFlowable(width="100%", thickness=1, color=LILAC, spaceAfter=8))
def sub(text): E.append(Paragraph(text, h2))
def p(text): E.append(Paragraph(text, body))
def b(text): E.append(Paragraph(text, bullet, bulletText="•"))
def say(text): E.append(Paragraph(f"“{text}”", speech))
def qa(q, a): E.append(KeepTogether([Paragraph(q, qa_q), Paragraph(a, qa_a)]))

# ── Portada compacta ─────────────────────────────────────────────
E.append(Spacer(1, 10))
E.append(Paragraph("GUION DE VENTAS", title_s))
E.append(Paragraph("Judo Marketing · Build Trust, Create Value", subtitle_s))
E.append(Paragraph("Material interno para vendedores. No compartir con clientes.", subtitle_s))
E.append(Spacer(1, 6))
E.append(HRFlowable(width="100%", thickness=2, color=PURPLE, spaceAfter=10))
p("Este guion es tu herramienta de trabajo. Léelo hasta que te salga natural, con tus propias palabras. "
  "Aquí está lo que vendemos, cómo abrir una conversación, cómo responder cada pregunta y cada objeción, "
  "y las reglas que nunca se rompen. Si dominas estas páginas, no hay cliente que te agarre fuera de base.")

# ── 1. Lo que vendemos ───────────────────────────────────────────
sec("1. LO QUE VENDEMOS (apréndetelo de memoria)")
p("<b>La frase de oro:</b>")
say(f"Websites y apps profesionales por suscripción mensual, desde ${PRECIOS['essential']} al mes, "
    "con todo incluido: diseño, mantenimiento, seguridad y su propio panel de control.")
p(f"<b>PRECIOS VIGENTES:</b> son los que cobra el website hoy. "
  "El precio que el cliente firme antes es el que mantiene mientras siga con "
  "nosotros. Úsalo: es tu mejor razón para que decida hoy y no la otra semana.")
sub("Los 3 planes")
b(f"<b>Websites Esenciales, {dos_precios('essential')}:</b> tiendas online, páginas de citas, "
  "venta de servicios. Diseño moderno, panel fácil, soporte y mantenimiento.")
b(f"<b>Websites Complejos, {dos_precios('complex')}:</b> delivery, logística, clases virtuales, "
  "sistemas avanzados, integraciones a la medida.")
b(f"<b>Apps para Teléfonos, {dos_precios('apps')}:</b> aplicaciones nativas iPhone y Android "
  "con notificaciones push.")
b("<b>Media Marketing (publicidad pagada):</b> anuncios en Instagram, Facebook, TikTok y Google. "
  "Nosotros armamos el anuncio y elegimos a quién se le muestra; el cliente decide cuánto invertir "
  "cada mes. No tiene precio fijo. El rango que recomendamos para crecer sostenido es de $500 a $700 "
  "al mes, y se puede empezar con menos. Se conversa con la agencia en la página de Contacto.")
sub("Datos fijos que debes saber sin pensar")
b("Página: <b>www.judomarketing.net</b> (en español y en inglés)")
b("Teléfono y WhatsApp de la agencia: <b>+1 305 934 9981</b>")
b("Oficina: 66 W Flagler St Suite 900, Miami, FL. Atendemos todo Estados Unidos y Latinoamérica online.")
b("Pagos: tarjeta (y todos los métodos de Stripe), PayPal, Zelle y cripto USDT. Solo en dólares.")
b("Garantía: si el proyecto no se entrega en menos de un mes, se devuelve el primer pago.")
b("Contrato de 12 meses. Al cumplir el año, el código del website pasa a ser del cliente.")

# ── 2. Speech 30 segundos ────────────────────────────────────────
sec("2. EL SPEECH DE 30 SEGUNDOS (para abrir en frío)")
p("Para cuando entras a un negocio o te presentan a alguien. Corto, directo y termina en pregunta:")
say("Hola, ¿usted es quien lleva el negocio? Mucho gusto, soy [tu nombre], trabajo con Judo Marketing. "
    "Le hago una pregunta rapidita: cuando alguien busca un negocio como el suyo en Google, ¿lo encuentra a usted o "
    f"encuentra a la competencia? ... Mire, nosotros hacemos páginas web profesionales por suscripción: {PRECIOS['essential']} dólares al "
    "mes, sin pagar miles de una vez, con tienda o citas online y su propio panel para controlar todo. Y si no se la "
    "entregamos en menos de un mes, le devolvemos su plata. ¿Le muestro en dos minutos cómo quedaría la suya?")
p("<b>La clave:</b> no vendas la página, vende lo que le duele. Escucha más de lo que hablas.")

# ── 3. La conversación completa ──────────────────────────────────
sec("3. LA CONVERSACIÓN COMPLETA, PASO A PASO")
sub("Paso 1. Rompe el hielo hablando de SU negocio, no del tuyo")
say("¿Cuánto tiempo tiene con el negocio? ¿Y cómo le llegan los clientes ahorita, más por recomendación o por redes?")
p("Deja que hable. La gente ama hablar de su negocio, y en su respuesta te va a regalar el dolor.")
sub("Paso 2. Encuentra el dolor (elige la pregunta según lo que te contó)")
b("¿Le ha pasado que le escriben por WhatsApp a las 11 de la noche y pierde la venta porque no contestó?")
b("¿Cuánto tiempo se le va al día respondiendo lo mismo: precios, horarios, si hay disponible?")
b("¿Y si Instagram se le cae o le cierran la cuenta mañana, cómo lo encuentran sus clientes?")
sub("Paso 3. Presenta la solución conectada a SU dolor")
p("Ejemplos según el tipo de negocio:")
b("<b>Barbería o salón:</b> “Imagínese que sus clientes agenden su cita solos desde el teléfono, a cualquier hora, "
  "y a usted le quede el día organizado sin contestar un solo mensaje.”")
b("<b>Tienda:</b> “Su tienda abierta 24 horas: la gente ve los productos, paga en línea, y usted se levanta con "
  "pedidos hechos mientras dormía.”")
b("<b>Restaurante o comida:</b> “Pedidos directos desde su propia página, sin pagarle comisión a ninguna app de "
  "delivery.”")
b("<b>Servicios (mecánico, abogado, doctor, entrenador):</b> “Una página seria que dé confianza, con sus "
  "servicios, citas y testimonios, para que cuando lo busquen en Google, usted gane.”")
sub("Paso 4. El precio, sin miedo y sin rodeos")
say(f"Son {PRECIOS['essential']} dólares al mes, el plan de arranque. Menos de 2 dólares al día, menos de lo que cuesta un café. Y ahí va "
    "todo incluido: el diseño, el mantenimiento, la seguridad, los respaldos y su panel de control. Sin cobros "
    "escondidos.")
sub("Paso 5. Quítale el riesgo")
say("Y mire lo mejor: si no le entregamos su proyecto en menos de un mes, le devolvemos su primer pago. Y usted puede "
    "cancelar cuando quiera, sin penalidad. O sea que el riesgo lo corremos nosotros, no usted.")
sub("Paso 6. Cierra (siempre con pregunta, siempre con siguiente paso)")
b("<b>Cierre directo:</b> “¿Arrancamos de una? El pago se hace seguro desde la misma página, yo lo acompaño "
  "ahorita mismo.” (botón Iniciar en www.judomarketing.net)")
b("<b>Cierre de agenda:</b> “¿Le agendo una videollamada gratis con la agencia? Ahí le dicen con honestidad "
  "si su idea se puede hacer, escoja usted el día y la hora.” (página de Contacto)")
b("<b>Apenas termines, registra la visita en tu portal.</b> Con o sin internet, el portal la guarda. Esa visita es "
  "tuya: si ese cliente compra después, tu comisión queda amarrada a tu registro.")

# ── 4. Objeciones ────────────────────────────────────────────────
sec("4. OBJECIONES: QUÉ RESPONDER, PALABRA POR PALABRA")
qa("“Está caro” / “No tengo presupuesto”",
   "“Le entiendo. Mire, una página web tradicional cuesta 1.500 a 3.000 dólares de una sola vez, y después le "
   f"cobran aparte el mantenimiento. Aquí son {PRECIOS['essential']} al mes con todo incluido: menos de 2 dólares diarios. ¿Cuánto vale "
   "para usted una sola venta que hoy se le está escapando por no estar en línea?”")
qa("“Ya tengo Instagram y me va bien”",
   "“¡Y qué bueno, siga con Instagram! La página no lo reemplaza, lo multiplica. Instagram es terreno alquilado: "
   "si mañana le cierran la cuenta o cambia el algoritmo, pierde todo. La página es su casa propia, y hace lo que "
   "Instagram no hace: citas automáticas, pagos en línea, y salir en Google.”")
qa("“Yo no sé nada de tecnología”",
   "“Para eso estamos nosotros. Usted no toca nada técnico: la agencia se lo monta todo y le entrega un panel "
   "facilito, como usar WhatsApp. Y el soporte va incluido en la mensualidad, cualquier duda me escribe a mí.”")
qa("“Déjeme pensarlo”",
   "“Claro que sí, es una decisión de su negocio. Solo para ayudarle a pensar: ¿qué es lo que más le hace dudar, "
   "el precio o el tiempo? [Responde esa duda.] Mire, hagamos algo sin compromiso: le agendo la entrevista gratis "
   "por videollamada, ahí le dicen honestamente si su idea se puede hacer y usted decide con calma después.”")
qa("“¿Y si no me gusta o no funciona?”",
   "“Por eso la garantía: si no le entregan su proyecto en menos de un mes, le devuelven su primer pago. Y puede "
   "cancelar cuando quiera, sin penalidad. Además usted aprueba el diseño: el portal se hace a su gusto.”")
qa("“¿Por qué mensual y no pagar una sola vez?”",
   "“Porque así arranca sin descapitalizarse, y porque una página no es una foto, es un ser vivo: necesita "
   "mantenimiento, seguridad y respaldos todos los días, y eso va incluido siempre. Y ojo con esto: al cumplir su año "
   "de contrato, el código pasa a ser completamente suyo.”")
qa("“¿Y la página es mía o de ustedes?”",
   "“Buena pregunta, y se la respondo con los términos en la mano: durante los primeros 12 meses el código y el "
   "dominio son de Judo Marketing, por eso el precio es tan bajo. Al cumplir su año de contrato, el código es "
   "completamente suyo. Todo está escrito en judomarketing.net/legal, sin letra escondida.”")
qa("“Ya tengo una página pero está vieja”",
   "“Perfecto, eso es más fácil todavía: se la renovamos. Tenemos clientes que renovaron y ahora su gente les "
   "comenta que la página se entiende y se navega mucho más fácil. ¿Me deja verla un momento?”")
qa("“No tengo tiempo para eso ahorita”",
   "“Lo entiendo, por eso el proceso está hecho para gente ocupada: una entrevista de 15 minutos y la agencia "
   "hace el resto. Usted solo aprueba cómo va quedando.”")

# ── 5. FAQ ───────────────────────────────────────────────────────
sec("5. PREGUNTAS FRECUENTES DEL CLIENTE (tu chuleta)")
qa("¿Cuánto cuesta?", f"Websites Esenciales {dos_precios('essential')}; Websites Complejos "
   f"{dos_precios('complex')}; Apps {dos_precios('apps')}. Son precios “desde”: si el proyecto es "
   "más grande, la agencia cotiza en la entrevista.")
qa("¿Qué incluye la mensualidad?", "Diseño, hosting, mantenimiento, seguridad y respaldos diarios, soporte, y su "
   "panel de administrador para controlar contenido, usuarios y ventas.")
qa("¿En cuánto tiempo está lista?", "Menos de un mes. Con garantía: si no se entrega en menos de un mes, se devuelve "
   "el primer pago.")
qa("¿Cómo se paga?", "En la propia página (botón Iniciar): tarjeta y todos los métodos de Stripe, PayPal, Zelle o "
   "USDT. Todo en dólares. El cliente cubre los fees de procesamiento; el monto que llega debe ser el total.")
qa("¿Hay contrato?", "Sí, de 12 meses, firmado digitalmente. Sin permanencia forzada: puede cancelar cuando quiera "
   "y el servicio se desactiva, sin penalidades.")
qa("¿El dominio (el .com) quién lo pone?", "La agencia lo registra y lo administra el primer año, va con el servicio.")
qa("¿Atienden en inglés?", "Sí, la agencia es bilingüe y la página existe en español y en inglés.")
qa("¿Dónde están ubicados?", "En Miami: 66 W Flagler St Suite 900. Y atendemos clientes de todo Estados Unidos y "
   "Latinoamérica, todo el proceso puede ser online.")
qa("¿Cómo empiezo?", "Con la entrevista inicial gratis: en la página de Contacto elige día y hora para una llamada "
   "por videollamada, o yo mismo te la agendo ahorita.")
qa("¿Y después de comprar, quién me atiende?", "Yo soy tu canal directo para todo. Y la administración de la agencia "
   "siempre está disponible en la página de Contacto.")
qa("¿Hacen publicidad también?", "Sí, el paquete de marketing en redes sociales con 20% de incremento de tráfico "
   "asegurado. El presupuesto de los anuncios lo decides tú. Eso se cotiza con la agencia en la entrevista.")
qa("¿Me dan recibo?", "Sí, todos los pagos quedan con comprobante. Los pagos con tarjeta reciben recibo automático "
   "por correo.")

# ── 6. Reglas de oro ─────────────────────────────────────────────
sec("6. LAS REGLAS DE ORO (esto no se negocia)")
b("<b>1. Nunca prometas cifras de ventas ni de dinero.</b> Las únicas promesas oficiales son: entrega en menos de un "
  "mes (o devolución del primer pago) y el 20% de tráfico del paquete de redes. Nada más.")
b("<b>2. Nunca inventes precios ni descuentos.</b> Los precios los fija la administración. Si el cliente pide rebaja, "
  "la respuesta es: “déjeme consultarlo con la agencia”.")
b("<b>3. El dinero nunca pasa por tus manos.</b> El cliente paga SIEMPRE por la página oficial (botón Iniciar) o los "
  "métodos oficiales de la agencia. Ni efectivo, ni transferencias a tu cuenta personal.")
b("<b>4. Registra toda visita en tu portal apenas termine.</b> Funciona hasta sin internet. Tu visita registrada es "
  "tu comisión protegida.")
b("<b>5. El contrato se firma desde tu portal.</b> Sección Contratos: eliges la visita, completas los datos, el "
  "cliente firma en tu teléfono, firmas tú, y le llega su copia al correo con la firma de la administración.")
b("<b>6. Tú eres el canal del cliente.</b> Sus dudas, cambios y reclamos entran por ti. Para hablar con la "
  "administración, la vía es la página de Contacto.")
b("<b>7. Si no sabes una respuesta, no inventes.</b> Di: “esa se la confirmo hoy mismo con la agencia”, "
  "y consulta. Un “no sé, lo averiguo” vende más que un invento que después explota.")

# ── 7. Cierres ───────────────────────────────────────────────────
sec("7. TRES CIERRES PARA TU BOLSILLO")
b("<b>El directo:</b> “¿Arrancamos de una vez? En 5 minutos dejamos el pago hecho y su proyecto en cola.”")
b("<b>El de agenda:</b> “No decida ahorita: agendemos la entrevista gratis y decida después de escuchar a la "
  "agencia. ¿Le viene mejor mañana o pasado?”")
b("<b>El del espejo:</b> “Búsquese en Google ahorita mismo, aquí conmigo... ¿Vio quién aparece? Su competencia. "
  "Eso es lo que arreglamos.”")
E.append(Spacer(1, 14))
E.append(HRFlowable(width="100%", thickness=1, color=LILAC, spaceAfter=6))
E.append(Paragraph("Judo Marketing · www.judomarketing.net · +1 305 934 9981 · Material interno, versión 08/2026",
                   subtitle_s))

doc = SimpleDocTemplate(OUT, pagesize=letter, topMargin=0.7 * inch, bottomMargin=0.7 * inch,
                        leftMargin=0.85 * inch, rightMargin=0.85 * inch,
                        title="Guion de Ventas - Judo Marketing", author="Judo Marketing")
doc.build(E)
print("OK ->", OUT)
