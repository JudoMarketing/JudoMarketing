# Arma el PDF de una auditoría de presencia en línea (el método de NV Labs,
# The Notes y Delivery Rush). Solo diagnóstico y plan: el precio, si lo hay,
# va en otro documento (Junior, 27 nov 2026). El método completo está en
# docs/AUDITORIA-CLIENTES.md.
#
#   python3 scripts/auditoria/presencia/armar.py <carpeta> <es|en> "<Nombre>" "<dominio>" "<para quién>" [salida.pdf]
#
# <carpeta> trae lo que escribe la medición (nunca dentro del repo: los datos
# de un cliente no se publican):
#   datos.json   el website: DIMENSIONES, BUSQUEDAS, SEO_CHECKS, IA_CHECKS,
#                PAGINAS_TEXTO, VELOCIDAD_PAGINAS, COMPETENCIA, HALLAZGOS, PLAN,
#                METODO, RESUMEN.fecha
#   fuera.json   fuera del website (opcional): FUERA, FUERA_CHECKS,
#                FUERA_HALLAZGOS, FUERA_PLAN, METODO_FUERA
#   home-desk.jpg y home-tel.jpg   capturas en el idioma del informe
# Escribe <carpeta>/informe.html y, si se da la salida, el PDF (revisando que
# nada se salga de su hoja).
import datetime, html, json, math, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTES = os.path.normpath(os.path.join(AQUI, "..", "..", "..", "docs", "tarjetas", "fuentes"))
IMG = os.path.join(AQUI, "img")
e = html.escape
CARPETA, IDIOMA, NOMBRE, DOMINIO, PARA = sys.argv[1:6]
SALIDA = sys.argv[6] if len(sys.argv) > 6 else None
CARPETA = os.path.abspath(CARPETA)
D = json.load(open(os.path.join(CARPETA, "datos.json")))
F = json.load(open(os.path.join(CARPETA, "fuera.json"))) if os.path.exists(os.path.join(CARPETA, "fuera.json")) else {}
ES = IDIOMA == "es"
T = (lambda es, en: es) if ES else (lambda es, en: en)
VACIO = T("s/d", "n/a")

MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
MESES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
try: dia = datetime.date.fromisoformat(str((D.get("RESUMEN") or {}).get("fecha")))
except Exception: dia = datetime.date.today()
FECHA = f"{dia.day} de {MESES_ES[dia.month - 1]} de {dia.year}" if ES else f"{MESES_EN[dia.month - 1]} {dia.day}, {dia.year}"
MES = f"{MESES_ES[dia.month - 1].capitalize()} {dia.year}" if ES else f"{MESES_EN[dia.month - 1]} {dia.year}"

def prom(filas, i): return round(sum(f[i] for f in filas) / len(filas)) if filas else 0
DIM = D["DIMENSIONES"]; FUERA = F.get("FUERA", [])
HOY_WEB, META_WEB = prom(DIM, 2), prom(DIM, 3)
HOY_FUERA, META_FUERA = prom(FUERA, 2), prom(FUERA, 3)
HOY = round((HOY_WEB + HOY_FUERA) / 2) if FUERA else HOY_WEB
META = round((META_WEB + META_FUERA) / 2) if FUERA else META_WEB
N_AREAS = len(DIM) + len(FUERA)
BUS = D["BUSQUEDAS"]; SEO = D["SEO_CHECKS"]; IA = D["IA_CHECKS"]
VEL = D.get("VELOCIDAD_PAGINAS", []); COMP = D.get("COMPETENCIA", [])
HALL = D.get("HALLAZGOS", []); HALL_F = F.get("FUERA_HALLAZGOS", [])
PLAN = D.get("PLAN", [])

def pts(v):
    try: return float(v)
    except Exception: return 0.0
def no_aparece(v): return str(v).strip().lower() in ("no", "0", "", "none") or str(v).strip().lower().startswith("no ")
SEO_P = sum(pts(c[1]) for c in SEO); IA_P = sum(pts(c[1]) for c in IA)
encontrado = sum(1 for b in BUS if not no_aparece(b[2]))

def color(v): return "#DC2626" if v < 40 else "#D97706" if v < 70 else "#0E9F6E"

def medidor(valor, tam=180, grosor=18, color_=None, fondo="#E9E5F5", texto="#17151F", sub=""):
    color_ = color_ or color(valor)
    r = (tam - grosor) / 2; cx, cy = tam / 2, tam / 2
    def p(x):
        a = math.pi * (1 - x); return cx + r * math.cos(a), cy - r * math.sin(a)
    x0, y0 = p(0); x1, y1 = p(1); xv, yv = p(max(0.001, min(valor, 100) / 100))
    alto = tam / 2 + grosor / 2 + 4
    return f'''<svg viewBox="0 0 {tam} {alto + 30}" width="{tam}" height="{alto + 30}">
<path d="M{x0:.1f},{y0:.1f} A{r:.1f},{r:.1f} 0 0 1 {x1:.1f},{y1:.1f}" fill="none" stroke="{fondo}" stroke-width="{grosor}" stroke-linecap="round"/>
<path d="M{x0:.1f},{y0:.1f} A{r:.1f},{r:.1f} 0 0 1 {xv:.1f},{yv:.1f}" fill="none" stroke="{color_}" stroke-width="{grosor}" stroke-linecap="round"/>
<text x="{cx}" y="{cy - 2}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="{tam * 0.24:.0f}" fill="{texto}">{valor}</text>
<text x="{cx}" y="{cy + 20}" text-anchor="middle" font-family="Inter" font-size="{max(11, tam * 0.07):.0f}" fill="{texto}" opacity=".72">{e(sub)}</text></svg>'''

def barras(filas, ancho=704):
    fila, ini = 25, 210; alto = fila * len(filas) + 30; largo = ancho - ini - 40
    s = [f'<svg viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}">']
    for i, d in enumerate(filas):
        nombre, hoy, meta = d[1], d[2], d[3]; y = 6 + i * fila
        s.append(f'<text x="{ini - 12}" y="{y + 15}" text-anchor="end" font-family="Inter" font-size="12.5" fill="#17151F">{e(nombre)}</text>')
        s.append(f'<rect x="{ini}" y="{y + 3}" width="{largo}" height="16" rx="8" fill="#F1EEF9"/>')
        s.append(f'<rect x="{ini}" y="{y + 3}" width="{largo * meta / 100:.1f}" height="16" rx="8" fill="#DDD3FB"/>')
        s.append(f'<rect x="{ini}" y="{y + 3}" width="{max(18, largo * hoy / 100):.1f}" height="16" rx="8" fill="{color(hoy)}"/>')
        s.append(f'<text x="{ini + max(18, largo * hoy / 100) - 6:.1f}" y="{y + 15}" text-anchor="end" font-family="Inter" font-weight="700" font-size="11" fill="#fff">{hoy}</text>')
        s.append(f'<text x="{ini + largo * meta / 100 + 6:.1f}" y="{y + 15}" font-family="Inter" font-weight="700" font-size="11" fill="#6D28D9">{meta}</text>')
    y = alto - 10
    s.append(f'<rect x="{ini}" y="{y - 9}" width="16" height="10" rx="5" fill="#D97706"/><text x="{ini + 22}" y="{y}" font-family="Inter" font-size="11" fill="#5F5A70">{T("Hoy", "Today")}</text>')
    s.append(f'<rect x="{ini + 80}" y="{y - 9}" width="16" height="10" rx="5" fill="#DDD3FB"/><text x="{ini + 102}" y="{y}" font-family="Inter" font-size="11" fill="#5F5A70">{T("Meta a 12 meses", "12-month goal")}</text></svg>')
    return "".join(s)

def icono(v):
    v = pts(v)
    return '<span class="ico si">✓</span>' if v >= 1 else '<span class="ico medio">½</span>' if v > 0 else '<span class="ico no">✕</span>'
def lista(items): return "<ul class='lista-simple'>" + "".join(f"<li>{e(str(i))}</li>" for i in items) + "</ul>"
def tabla_areas(filas):
    return (f'<table class="tabla areas"><thead><tr><th>{T("Área", "Area")}</th><th>{T("Lo que medimos", "What we found")}</th><th>{T("Cómo sube", "How it improves")}</th></tr></thead><tbody>'
            + "".join(f"<tr><td><b>{e(d[1])}</b><br><span class='num-dim' style='color:{color(d[2])}'>{d[2]} → {d[3]}</span></td><td>{e(d[4])}</td><td>{e(d[5])}</td></tr>" for d in filas)
            + "</tbody></table>")

paginas = []
def pagina(c, clase=""): paginas.append((c, clase))

# Portada
nota = (T(f"Puntaje de presencia en línea: la mitad es tu website (9 áreas) y la mitad lo que pasa fuera de él ({len(FUERA)} áreas).", f"Online presence score: half is your website (9 areas), half is everything outside it ({len(FUERA)} areas).")
        if FUERA else T("Puntaje de presencia en línea: el promedio de 9 áreas, cada una medida por separado.", "Online presence score: the average of 9 areas, each measured separately."))
pagina(f'''
<div class="portada-fondo"></div>
<header class="portada-cab"><img src="{IMG}/logo-blanco.png" class="logo-portada" alt="Judo Marketing"><span>Judo Marketing · Miami</span></header>
<div class="portada-centro">
  <p class="kicker-claro">{T("Auditoría de presencia en línea", "Online presence audit")} · {MES}</p>
  <h1>{e(NOMBRE)}<br><span>{e(DOMINIO)}</span></h1>
  <p class="portada-lead">{T("Dónde estás hoy en Google, Bing, la inteligencia artificial, las redes y los directorios, qué te falta y cómo mejorarlo en 12 meses.", "Where you stand today on Google, Bing, AI search, social media and directories, what's missing, and how to improve it over the next 12 months.")}</p>
  <div class="portada-medidores">
    <div>{medidor(HOY, 210, 20, texto="#FFFFFF", fondo="rgba(255,255,255,.14)", sub=T("de 100 · hoy", "out of 100 · today"))}</div>
    <div class="flecha-portada">→</div>
    <div>{medidor(META, 210, 20, color_="#A855F7", texto="#FFFFFF", fondo="rgba(255,255,255,.14)", sub=T("de 100 · meta", "out of 100 · goal"))}</div>
  </div>
  <p class="portada-nota">{nota}</p>
</div>
<footer class="portada-pie"><span>{e(PARA)}</span><span>{T("Medido el", "Measured on")} {FECHA}</span></footer>
''', "portada")

# Resumen
top = (HALL[:3] + HALL_F[:2]) if HALL_F else HALL[:5]
bloques = ""
if FUERA:
    bloques = f'''<div class="dos-bloques">
  <div><span>{T("Tu website", "Your website")}</span><b style="color:{color(HOY_WEB)}">{HOY_WEB}</b><small>{T("meta", "goal")} {META_WEB}</small></div>
  <div><span>{T("Fuera del website", "Outside your website")}</span><b style="color:{color(HOY_FUERA)}">{HOY_FUERA}</b><small>{T("meta", "goal")} {META_FUERA}</small></div>
</div>'''
pagina(f'''
<p class="kicker">{T("En resumen", "At a glance")}</p>
<h2>{T(f"Tu presencia en línea hoy: {HOY} de 100.", f"Your online presence today: {HOY} out of 100.")}</h2>
<div class="resumen-top">
  <div class="tarjeta-puntaje">{medidor(HOY, 190, 18, sub=T("de 100 hoy", "out of 100 today"))}<p>{T("Meta a 12 meses", "12-month goal")}: <b class="morado">{META}</b></p></div>
  <div class="resumen-texto"><p class="grande">{T(f"Medimos {N_AREAS} áreas con las mismas herramientas que usan Google y los buscadores con IA. Con el plan de este informe, la meta es {META}.", f"We measured {N_AREAS} areas with the same tools Google and AI search engines use. With the plan in this report, the goal is {META}.")}</p>{bloques}</div>
</div>
<div class="cifras-banda">
  <div><b>{encontrado} {T("de", "of")} {len(BUS)}</b><span>{T("búsquedas donde apareces", "searches where you show up")}</span></div>
  <div><b>{SEO_P:g} {T("de", "of")} {len(SEO)}</b><span>{T("revisiones de SEO técnico", "technical SEO checks passed")}</span></div>
  <div><b>{IA_P:g} {T("de", "of")} {len(IA)}</b><span>{T("puntos listos para la IA", "AI-readiness checks passed")}</span></div>
</div>
<div class="caja roja"><h3>{T("Lo que más te está costando hoy", "What's costing you most today")}</h3><ol>{"".join(f"<li>{e(str(h))}</li>" for h in top)}</ol></div>
''')

# Website, área por área
pagina(f'''
<p class="kicker">{T("Tu website, área por área", "Your website, area by area")}</p>
<h2>{T(f"Nueve áreas del website: {HOY_WEB} de 100.", f"Nine website areas: {HOY_WEB} out of 100.")}</h2>
<div class="grafico-dim">{barras(DIM)}</div>
{tabla_areas(DIM)}
''')

# Búsquedas
def chip(est):
    return f'<span class="chip rojo">{T("No aparece", "Not found")}</span>' if no_aparece(est) else f'<span class="chip ambar">{T("Posición", "Position")} {e(str(est))}</span>'
filas = "".join(f'<tr><td class="consulta">“{e(b[0])}”{f"<small>{e(b[1])}</small>" if b[1] else ""}</td><td>{chip(b[2])}</td><td class="quien">{e(str(b[3]))}</td></tr>' for b in BUS)
pagina(f'''
<p class="kicker">{T("Cómo te encuentran hoy", "How customers find you today")}</p>
<h2>{T("Buscamos como lo haría tu cliente.", "We searched the way your customer would.")}</h2>
<table class="tabla busquedas"><thead><tr><th>{T("Búsqueda", "Search")}</th><th>{e(NOMBRE)}</th><th>{T("Quién sale en su lugar", "Who shows up instead")}</th></tr></thead><tbody>{filas}</tbody></table>
<p class="nota">{T("Búsquedas hechas desde Estados Unidos con un buscador web el", "Searches run from the United States with a web search engine on")} {FECHA}. {T("Las posiciones exactas de Google se confirman en Search Console.", "Exact Google positions are confirmed in Search Console.")}</p>
''')

# Capturas y texto
pagina(f'''
<p class="kicker">{T("Tu website", "Your website")}</p>
<h2>{T("Así lo ve tu cliente, en la computadora y en el teléfono.", "What your customer sees, on a computer and on a phone.")}</h2>
<div class="capturas-dos"><img src="{CARPETA}/home-desk.jpg" alt=""><img src="{CARPETA}/home-tel.jpg" alt="" class="tel"></div>
<h3 class="textos">{T("Cuánto hay que leer", "How much there is to read")}</h3>
<table class="tabla"><thead><tr><th>{T("Página", "Page")}</th><th>{T("Palabras", "Words")}</th><th>{T("Minutos de lectura", "Minutes to read")}</th><th>{T("Párrafo más largo (palabras)", "Longest paragraph (words)")}</th></tr></thead><tbody>
{"".join(f"<tr><td>{e(str(t[0]))}</td><td class='centro'>{t[1]}</td><td class='centro'>{t[2]}</td><td class='centro'>{t[3] if len(t) > 3 else VACIO}</td></tr>" for t in D.get("PAGINAS_TEXTO", []))}
</tbody></table>
''')

# Velocidad
filas = "".join(f"<tr><td>{e(str(v[0]))}</td><td class='centro'><b style='color:{color(int(v[1] or 0))}'>{v[1] if v[1] is not None else VACIO}</b></td><td class='centro'>{v[2] if len(v) > 2 and v[2] is not None else VACIO}</td><td class='centro'>{(str(v[3]) + ' s') if len(v) > 3 and v[3] is not None else VACIO}</td></tr>" for v in VEL)
pagina(f'''
<p class="kicker">{T("Velocidad", "Speed")}</p>
<h2>{T("Lo que tarda en verse, medido con Lighthouse de Google.", "How long it takes to show up, measured with Google Lighthouse.")}</h2>
<table class="tabla"><thead><tr><th>{T("Página", "Page")}</th><th>{T("Medición 1", "Run 1")}</th><th>{T("Medición 2", "Run 2")}</th><th>{T("Contenido principal", "Main content (LCP)")}</th></tr></thead><tbody>{filas}</tbody></table>
<div class="caja"><h3>{T("Cómo leerlo", "How to read it")}</h3><p>{T("El puntaje va de 0 a 100 (90 o más es bueno). El contenido principal debería verse en menos de 2.5 segundos en el teléfono: es lo que Google usa para premiar a un sitio.", "Scores go from 0 to 100 (90+ is good). The main content should appear in under 2.5 seconds on a phone: that's what Google uses to reward a site.")}</p></div>
''')

# SEO técnico
filas = "".join(f"<tr><td>{icono(c[1])}</td><td><b>{e(c[0])}</b></td><td>{e(c[2] if len(c) > 2 else '')}</td></tr>" for c in SEO)
pagina(f'''
<p class="kicker">{T("SEO técnico", "Technical SEO")}</p>
<h2>{T(f"{SEO_P:g} de {len(SEO)} revisiones básicas aprobadas.", f"{SEO_P:g} of {len(SEO)} basic checks passed.")}</h2>
<table class="tabla seo"><tbody>{filas}</tbody></table>
''')

# IA y competencia
filas_ia = "".join(f"<tr><td>{icono(c[1])}</td><td>{e(c[0])}</td></tr>" for c in IA)
def celda(v):
    if v is None: return VACIO
    if isinstance(v, bool): return icono(1 if v else 0)
    if isinstance(v, int): return f"{v:,}".replace(",", "." if ES else ",")
    return e(str(v))
cab_comp = T(["Competidor", "Modelo / precio", "Velocidad móvil", "Datos para Google", "Páginas en sitemap"], ["Competitor", "Price model", "Mobile speed", "Structured data", "Sitemap pages"])
RESENAS = any(len(c) >= 8 for c in COMP)
if RESENAS: cab_comp.append(T("Reseñas", "Reviews"))
filas_c = "".join(f"<tr><td><b>{e(c[0])}</b></td><td>{celda(c[2])}</td><td class='centro'>{celda(c[3])}</td><td class='centro'>{celda(c[4])}</td><td class='centro'>{celda(c[5])}</td>{f'<td>{celda(c[6])}</td>' if RESENAS else ''}</tr>" for c in COMP)
pagina(f'''
<p class="kicker">{T("Inteligencia artificial y competencia", "AI search and competitors")}</p>
<h2>{T(f"Lista para la IA: {IA_P:g} de {len(IA)}.", f"Ready for AI search: {IA_P:g} of {len(IA)}.")}</h2>
<table class="tabla seo ia">{filas_ia}</table>
<h3>{T("Contra tu competencia", "Against your competitors")}</h3>
<table class="tabla comp"><thead><tr>{"".join(f"<th>{e(x)}</th>" for x in cab_comp)}</tr></thead><tbody>{filas_c}</tbody></table>
''')

# Fuera del website
if FUERA:
    pagina(f'''
<p class="kicker">{T("Fuera del website", "Outside your website")}</p>
<h2>{T(f"Lo que el cliente ve antes de llegar: {HOY_FUERA} de 100.", f"What customers see before they reach you: {HOY_FUERA} out of 100.")}</h2>
<div class="grafico-dim">{barras(FUERA)}</div>
{tabla_areas(FUERA)}
''')
    CH = F.get("FUERA_CHECKS", {})
    def tarjeta(d):
        filas = "".join(f"<tr><td>{icono(c[1])}</td><td><b>{e(c[0])}</b></td><td>{e(str(c[2]) if len(c) > 2 else '')}</td></tr>" for c in CH.get(d[0], []))
        return f"<div class='area-f'><h3>{e(d[1])}<span style='color:{color(d[2])}'>{d[2]}</span></h3><table class='tabla seo chico'><tbody>{filas}</tbody></table></div>"
    for parte in (FUERA[:5], FUERA[5:]):
        if parte:
            pagina(f'''
<p class="kicker">{T("Fuera del website, revisión por revisión", "Outside your website, check by check")}</p>
<div class="areas-f">{"".join(tarjeta(d) for d in parte)}</div>
''')

# Hallazgos
def hallazgos(lst, titulo):
    return f"<h3 class='sub-hall'>{titulo}</h3><ol class='hallazgos'>{''.join(f'<li>{e(str(h))}</li>' for h in lst)}</ol>"
pagina(f'''
<p class="kicker">{T("Lo que encontramos", "What we found")}</p>
<h2>{T("Todo lo que hay que arreglar en el website, en orden de importancia.", "Everything to fix on the website, in order of importance.")}</h2>
<ol class="hallazgos">{"".join(f"<li>{e(str(h))}</li>" for h in HALL)}</ol>
''')
if HALL_F:
    pagina(f'''
<p class="kicker">{T("Lo que encontramos", "What we found")}</p>
<h2>{T("Y fuera del website.", "And outside your website.")}</h2>
<ol class="hallazgos">{"".join(f"<li>{e(str(h))}</li>" for h in HALL_F)}</ol>
''')

# Plan (las acciones de fuera se suman a su fase)
fases = []
for f in PLAN:
    if isinstance(f, dict):
        titulo = f.get("titulo") or f.get("title") or f.get("fase") or f.get("phase") or ""
        cuando = f.get("cuando") or f.get("tiempo") or f.get("timing") or f.get("when") or ""
        items = list(f.get("items") or f.get("acciones") or f.get("actions") or [])
    else:
        titulo, cuando, items = (list(f) + ["", "", []])[:3]; items = list(items)
    fases.append([titulo, cuando, items])
for n, accion in F.get("FUERA_PLAN", []):
    if 1 <= int(n) <= len(fases): fases[int(n) - 1][2].append(accion)
html_fases = "".join(f"<div class='fase-v'><span class='fase-cuando'>{e(str(c))}</span><div><h3>{e(str(t))}</h3>{lista(i)}</div></div>" for t, c, i in fases)
pagina(f'''
<p class="kicker">{T("El plan", "The plan")}</p>
<h2>{T(f"De {HOY} a {META} en 12 meses.", f"From {HOY} to {META} in 12 months.")}</h2>
<div class="fases-v">{html_fases}</div>
<div class="caja verde"><h3>{T("Cómo lo medimos", "How we'll measure it")}</h3><p>{T("Search Console, Bing Webmaster, Lighthouse, el Perfil de Google y las mismas búsquedas de este informe, cada mes. La meta es un objetivo, no una garantía.", "Search Console, Bing Webmaster, Lighthouse, the Google Business Profile and the same searches in this report, every month. The goal is a target, not a guarantee.")}</p></div>
''', "plan")

# Método y contacto
metodo = "".join(f"<p>{e(x)}</p>" for x in (D.get("METODO", ""), F.get("METODO_FUERA", "")) if x)
pagina(f'''
<p class="kicker">{T("Cómo se hizo", "How this report was made")}</p>
<h2>{T("Medido desde afuera, como lo ven Google y tus clientes.", "Measured from the outside, the way Google and your customers see it.")}</h2>
<div class="metodo">{metodo}</div>
<div class="contacto"><img src="{IMG}/logo-blanco.png" alt="Judo Marketing"><div><h3>Judo Marketing</h3><p>{T("Websites, Google y anuncios, en español y en inglés, desde Miami.", "Websites, Google and ads, in English and Spanish, from Miami.")}</p><p class="contacto-datos"><b>WhatsApp:</b> 305-934-9981 · <b>Email:</b> admin@judomarketing.net · judomarketing.net</p></div></div>
''')

EXTRA = '''
.grafico-dim { background: var(--fondo); border: 1px solid var(--linea); border-radius: 14px; padding: 10px; }
.tabla.areas td { font-size: 10.4px; line-height: 1.32; vertical-align: top; padding-top: 4px; padding-bottom: 4px; }
.tabla.areas th { padding-top: 4px; padding-bottom: 4px; }
.tabla.seo td:first-child { width: 30px; }
.tabla.seo td:nth-child(2) { width: 46%; }
.tabla.ia td:nth-child(2) { width: auto; text-align: left; }
.tabla.chico td { font-size: 10.6px; line-height: 1.3; padding-top: 3px; padding-bottom: 3px; }
.tabla.chico td:nth-child(2) { width: 38%; }
.areas-f { display: flex; flex-direction: column; gap: 10px; }
.area-f { border: 1px solid var(--linea); border-radius: 12px; padding: 8px 12px 4px; }
.area-f h3 { display: flex; justify-content: space-between; margin: 0 0 2px; font-size: 14px; }
.area-f h3 span { font-family: Poppins; font-weight: 700; }
.dos-bloques { display: flex; gap: 10px; margin-top: 12px; }
.dos-bloques div { flex: 1; border: 1px solid var(--linea); border-radius: 12px; padding: 8px 12px; display: flex; flex-direction: column; }
.dos-bloques span { font-size: 11.5px; color: #5F5A70; }
.dos-bloques b { font-family: Poppins; font-size: 26px; line-height: 1.1; }
.dos-bloques small { font-size: 11px; color: #6D28D9; font-weight: 700; }
.textos { margin-top: 16px; }
.num-dim { font-family: Poppins; font-weight: 700; font-size: 13px; }
.capturas-dos { display: flex; gap: 14px; align-items: flex-start; }
.capturas-dos img { width: 72%; border-radius: 12px; border: 1px solid var(--linea); }
.capturas-dos img.tel { width: 25%; border-radius: 18px; border: 5px solid #17151F; }
.tabla td.centro { text-align: center; }
.hallazgos { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
.hallazgos li { background: var(--fondo); border: 1px solid var(--linea); border-radius: 10px; padding: 8px 12px; }
.lista-simple { margin: 0; padding-left: 18px; }
.fases-v { display: flex; flex-direction: column; gap: 10px; }
.fase-v { display: grid; grid-template-columns: 120px 1fr; gap: 14px; border: 1px solid var(--linea); border-radius: 14px; padding: 10px 14px; }
.fase-v .fase-cuando { font-family: Poppins; font-weight: 700; color: var(--morado); font-size: 14px; }
.plan .lista-simple li { font-size: 11.2px; line-height: 1.35; }
.metodo p { margin: 0 0 8px; }
'''
CSS = open(os.path.join(AQUI, "estilo.css")).read().replace("FUENTES", FUENTES).replace("INTERDIR", os.path.join(AQUI, "fuentes")) + EXTRA
total = len(paginas)
cuerpo = []
for i, (c, clase) in enumerate(paginas, 1):
    if "portada" in clase:
        cuerpo.append(f'<section class="pagina {clase}">{c}</section>')
    else:
        cuerpo.append(f'''<section class="pagina {clase}"><div class="cinta"><span>{e(NOMBRE)} · {T("Presencia en línea", "Online presence")}</span><span>{i} / {total}</span></div>
<div class="contenido">{c}</div>
<div class="pie"><img src="{IMG}/logo-negro.jpg" alt=""><span>Judo Marketing · judomarketing.net · 305-934-9981</span></div></section>''')
doc = f'<!doctype html><html lang="{IDIOMA}"><head><meta charset="utf-8"><title>{e(NOMBRE)} · {T("Auditoría", "Audit")} · Judo Marketing</title><style>{CSS}</style></head><body>{"".join(cuerpo)}</body></html>'
if "—" in doc.split("<body>")[1]: print("AVISO: hay rayas largas (—) en el texto; la casa no las usa.")
open(os.path.join(CARPETA, "informe.html"), "w").write(doc)
print(f"páginas {total} · hoy {HOY} (website {HOY_WEB}, fuera {HOY_FUERA if FUERA else 'sin medir'}) · meta {META} · búsquedas {encontrado}/{len(BUS)}")
if SALIDA:
    subprocess.run(["node", os.path.join(AQUI, "pdf.mjs"), os.path.join(CARPETA, "informe.html"), os.path.abspath(SALIDA)], check=True, cwd=os.path.normpath(os.path.join(AQUI, "..", "..", "..")))
