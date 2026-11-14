# Arma storyboard.html del video «Behind the screen» (Judo Marketing, en
# inglés), pedido por Junior el 14 de noviembre de 2026: «mucho se habla de
# los latinos y de lo duro que trabajan en trabajos físicos; poco de los
# latinos que trabajamos detrás de una computadora». Junior entra a cámara en
# tres escenas (camara-1, camara-2 y camara-3: aquí van como guía para
# grabar, con el marco, el tiempo y la frase); en el resto va su voz en off.
# Brief: docs/vendito/briefs/2026-11-14-behind-the-screen.md
# Para cambiar el video: edita este archivo y corre
#   python3 armar.py && python3 build.py && node revisar.mjs && node choques.mjs
# Los estilos son base.html (plantilla de la skill judo-video-vertical) +
# pro.css (la capa pro) + diseno.css (el sistema de los videos de Judo; lo de
# este video lleva el prefijo bs-). Los iconos son Phosphor (licencia MIT,
# vectores/LICENSE.txt); los dibujos (engranajes, mapa, palanca) están aquí.
import json, math, os, re

D = os.path.dirname(os.path.abspath(__file__))
base = open(os.path.join(D, "base.html"), encoding="utf-8").read().replace('<html lang="es">', '<html lang="en">', 1)
base = re.sub(r"<title>.*?</title>", "<title>Video · Behind the screen · Judo Marketing</title>", base)
base = re.sub(r"<!-- FUENTES:INICIO -->.*?<!-- FUENTES:FIN -->", """<!-- FUENTES:INICIO -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">
<!-- FUENTES:FIN -->""", base, flags=re.S)
base = re.sub(r"--f-display: [^;]+;", '--f-display: "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif;', base, count=1)
base = re.sub(r"--f-cuerpo: [^;]+;", '--f-cuerpo: "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif;', base, count=1)
base = base.replace("--ancho-display: 112%;", "--ancho-display: 100%;", 1)
estilos = "".join(open(os.path.join(D, f), encoding="utf-8").read() for f in ("pro.css", "diseno.css"))
base = base.replace("</style>", "</style>\n<style>\n" + estilos + "</style>", 1)
inicio = base.index("<!-- ═══════════════ ESCENAS")
fin = base.index("<script>\n// ── Mesa de revisión")
cabeza, pie = base[:inicio], base[fin:]


# ── Piezas ──
def ic(nombre):
    svg = open(os.path.join(D, "vectores", f"{nombre}.svg"), encoding="utf-8").read().strip()
    return svg.replace("<svg ", '<svg aria-hidden="true" ', 1)


def path_de(nombre):
    """Los trazos de un icono, para meterlos dentro de otro dibujo."""
    svg = open(os.path.join(D, "vectores", f"{nombre}.svg"), encoding="utf-8").read()
    return re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)


def m(texto, d, clase=""):
    """Una línea que sube desde abajo de su máscara."""
    return f'<span class="m{" " + clase if clase else ""}"><span style="--d:{d:.2f}s">{texto}</span></span>'


def cap(lineas, d=0.05, paso=0.09, clase="t-l", top=None, estilo=""):
    """Un titular: cada línea entra con su máscara, una tras otra."""
    pos = " arriba" if top is None else ""
    st = (f"top:{top}cqw;" if top is not None else "") + estilo
    cuerpo = "".join(m(l, d + i * paso) for i, l in enumerate(lineas))
    return f'<div class="pro-cap{pos} {clase}"{f" style={chr(34)}{st}{chr(34)}" if st else ""}>{cuerpo}</div>'


def deco(tipo, x, y, s, d=0.0, c1=None, c2=None, c3=None, fl=3.2, fx=1, fy=-2.4, fr=8):
    """Un adorno que flota: esfera, anillo-d, destello, pastilla-d, cruz o rejilla-d."""
    st = f"--x:{x};--y:{y};--s:{s};--d:{d}s;--fl:{fl}s;--fx:{fx}cqw;--fy:{fy}cqw;--fr:{fr}deg"
    for k, v in (("c1", c1), ("c2", c2), ("c3", c3)):
        if v:
            st += f";--{k}:{v}"
    return f'<div class="deco {tipo}" style="{st}"><i></i></div>'


def telefono(top, ancho, pantalla, estilo=""):
    """Un teléfono de verdad: cuerpo de titanio, botones, isla, reflejo, inclinado."""
    return (f'<div class="tel3d" style="top:{top}cqw;--ancho:{ancho}cqw;{estilo}"><div class="cuerpo">'
            '<i class="boton-lado" style="left:-.55cqw;top:19%;height:5%"></i><i class="boton-lado" style="left:-.55cqw;top:27%;height:9%"></i>'
            '<i class="boton-lado" style="left:-.55cqw;top:38%;height:9%"></i><i class="boton-lado" style="right:-.55cqw;top:26%;height:13%"></i>'
            f'<div class="pantalla pant">{pantalla}</div><i class="isla"></i><i class="reflejo"></i></div></div>')


ESC, T = [], []
COLOR_NOTA = {"abajo": "barrido-suave", "lado": "barrido-suave", "circulo": "barrido-grave"}


def escena(id_, dur, pieza, texto, ve, fondo, cuerpo, sfx="", sale=None, voz=""):
    """sale = (tipo, color siguiente[, x%, y%]); tipo: abajo, lado, circulo o corte.
    El panel termina de cubrir justo en el corte; la escena que sigue empieza
    con ese mismo fondo, así que el empalme no se nota."""
    panel, clase, sonidos = "", "", sfx.split()
    if sale and sale[0] != "corte":
        tipo, sig = sale[0], sale[1]
        sal = round(dur - (0.55 if tipo == "circulo" else 0.5), 2)
        pos = f";--cx:{sale[2]}%;--cy:{sale[3]}%" if tipo == "circulo" else ""
        panel = f'<div class="panel {tipo} {sig}" style="--sal:{sal}s{pos}"></div>'
        clase = f' sal-{tipo}" style="--sal:{sal}s'
        sonidos.append(f"{COLOR_NOTA[tipo]}@{max(0, sal - 0.05):.2f}")
    T.append(f'<template id="{id_}" data-sfx="{" ".join(sonidos)}" data-entrada="corte" data-swish="no">\n'
             f'  <div class="fondo {fondo}"><div class="contenido{clase}">{cuerpo}</div></div>{panel}\n</template>')
    ESC.append({"id": f"e{len(ESC) + 1:02d}", "plantilla": id_, "dur": dur, "pieza": pieza, "texto": texto, "ve": ve, "voz": voz})


# ── Dibujos de «Behind the screen» ──
def rueda(cx, cy, r, n, prof, hub, agujeros=0):
    """Un engranaje de verdad: n dientes trapezoidales, el eje hueco y, si se
    pide, agujeros de aligerado. Se rellena con fill-rule evenodd."""
    ri, pts = r - prof, []
    paso = 2 * math.pi / n
    for k in range(n):
        a = k * paso
        for ang, rad in ((a - paso * .30, ri), (a - paso * .17, r), (a + paso * .17, r), (a + paso * .30, ri)):
            pts.append(f"{cx + rad * math.cos(ang):.2f} {cy + rad * math.sin(ang):.2f}")
    d = "M" + " L".join(pts) + " Z"
    d += f" M{cx + hub:.2f} {cy:.2f} A{hub} {hub} 0 1 0 {cx - hub:.2f} {cy:.2f} A{hub} {hub} 0 1 0 {cx + hub:.2f} {cy:.2f} Z"
    for k in range(agujeros):
        a = k * 2 * math.pi / agujeros + .4
        hx, hy, hr = cx + (ri + hub) / 2 * math.cos(a), cy + (ri + hub) / 2 * math.sin(a), (ri - hub) * .26
        d += f" M{hx + hr:.2f} {hy:.2f} A{hr:.2f} {hr:.2f} 0 1 0 {hx - hr:.2f} {hy:.2f} A{hr:.2f} {hr:.2f} 0 1 0 {hx + hr:.2f} {hy:.2f} Z"
    return d


def giro(nombre, dur, puntos):
    """Keyframes de un giro con pausas: puntos = [(segundo, grados)]."""
    return f"@keyframes {nombre} {{ " + " ".join(f"{t / dur * 100:.2f}% {{ transform: rotate({g:.1f}deg) }}" for t, g in puntos) + " }"


# La máquina (escena 10): tres engranajes; el del medio, viejo, se parte y
# entra uno nuevo. viewBox 200 × 140.
G1, G2, G3 = (58, 80, 42, 16, 7), (110, 43.6, 28, 11, 6), (142.6, 70.9, 20, 8, 5)
DUR_MAQ, ROMPE, VUELVE = 6.0, 1.4, 3.0
W1A, W1B = 60, 110  # grados por segundo de la rueda grande, antes y después
a1 = W1A * ROMPE
a1f = a1 + W1B * (DUR_MAQ - VUELVE)
r12, r13 = G1[2] / G2[2], G1[2] / G3[2]
KEYS_MAQ = "\n".join([
    giro("p-bs-g1", DUR_MAQ, [(0, 0), (ROMPE, a1), (VUELVE, a1), (DUR_MAQ, a1f)]),
    giro("p-bs-g3", DUR_MAQ, [(0, 0), (ROMPE, a1 * r13), (VUELVE, a1 * r13), (DUR_MAQ, a1f * r13)]),
    giro("p-bs-g2", DUR_MAQ, [(0, 0), (ROMPE, -a1 * r12), (DUR_MAQ, -a1 * r12)]),
    giro("p-bs-g2n", DUR_MAQ, [(0, 0), (VUELVE, 0), (DUR_MAQ, -(a1f - a1) * r12)]),
    "@keyframes p-bs-tiembla-g { 0%, 100% { transform: none } 20% { transform: translate(-1.4px, .8px) } 45% { transform: translate(1.6px, -.6px) } 70% { transform: translate(-1px, -1px) } }",
    "@keyframes p-bs-cae-i { from { transform: none; opacity: 1 } to { transform: translate(-16px, 80px) rotate(-70deg); opacity: 0 } }",
    "@keyframes p-bs-cae-d { from { transform: none; opacity: 1 } to { transform: translate(18px, 84px) rotate(80deg); opacity: 0 } }",
    "@keyframes p-bs-baja { 0% { transform: translateY(-130px); opacity: 0 } 15% { opacity: 1 } 70% { transform: translateY(5px); opacity: 1 } 85% { transform: translateY(-3px); opacity: 1 } 100% { transform: none; opacity: 1 } }",
    "@keyframes p-bs-grieta { 0% { opacity: 0 } 30%, 70% { opacity: 1 } 100% { opacity: 0 } }",
    "@keyframes p-bs-luz { to { opacity: 1 } }",
    "@keyframes p-bs-apaga { to { opacity: 0 } }",
])


def rueda_g(g, grad, agujeros):
    return f'<path d="{rueda(*g[:4], g[4], g[2] * .26, agujeros)}" fill="url(#{grad})" fill-rule="evenodd" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>'


GRIETA = f'<path d="M{G2[0] - 3} {G2[1] - 27} l5 7 l-6 6 l5 6 l-4 5 l6 6 l-5 6 l4 7" fill="none" stroke="#ff3b4f" stroke-width="2.6" stroke-linejoin="round" style="opacity:0;animation:p-bs-grieta .5s ease {ROMPE + .1}s both"/>'
MAQUINA = (
    f'<style>{KEYS_MAQ}</style>'
    '<svg viewBox="0 0 200 140" aria-hidden="true"><defs>'
    '<linearGradient id="bs-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f8"/><stop offset=".5" stop-color="#b9bdd2"/><stop offset="1" stop-color="#7d8199"/></linearGradient>'
    '<linearGradient id="bs-oxido" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b77a"/><stop offset=".55" stop-color="#c9773a"/><stop offset="1" stop-color="#7f4119"/></linearGradient>'
    '<linearGradient id="bs-nuevo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4adff"/><stop offset=".5" stop-color="#7b4dff"/><stop offset="1" stop-color="#3b1aa8"/></linearGradient>'
    f'<clipPath id="bs-mitad-i"><rect x="0" y="0" width="{G2[0] + .6}" height="140"/></clipPath>'
    f'<clipPath id="bs-mitad-d"><rect x="{G2[0] - .6}" y="0" width="90" height="140"/></clipPath></defs>'
    # la placa de la máquina, con tornillos
    '<rect x="2" y="2" width="196" height="136" rx="10" fill="#1d1a30" stroke="rgba(255,255,255,.08)"/>'
    + "".join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#3a3555"/>' for x, y in ((10, 10), (190, 10), (10, 130), (190, 130)))
    # la luz de estado: ámbar, roja al romperse, verde cuando vuelve
    + '<circle cx="182" cy="122" r="5" fill="#ffb224"/>'
    f'<circle cx="182" cy="122" r="5" fill="#ff3b4f" style="opacity:0;animation:p-bs-luz .1s linear {ROMPE}s forwards, p-bs-apaga .1s linear {VUELVE + .3}s forwards"/>'
    f'<circle cx="182" cy="122" r="5" fill="#2ee59d" style="opacity:0;animation:p-bs-luz .1s linear {VUELVE + .3}s forwards"/>'
    # rueda grande y rueda chica
    + f'<g class="gira" style="animation:p-bs-g1 {DUR_MAQ}s linear both">{rueda_g(G1, "bs-metal", 5)}</g>'
    + f'<g class="gira" style="animation:p-bs-g3 {DUR_MAQ}s linear both">{rueda_g(G3, "bs-metal", 0)}</g>'
    # la del medio, vieja: gira, tiembla, se agrieta y se parte en dos mitades que caen
    + "".join(f'<g class="cae" style="animation:{cae} .8s cubic-bezier(.5,0,.8,.6) {ROMPE + .45}s forwards">'
              f'<g style="animation:p-bs-tiembla-g .12s linear {ROMPE}s 4">'
              f'<g class="gira" style="animation:p-bs-g2 {DUR_MAQ}s linear both"><g clip-path="url(#{clip})">{rueda_g(G2, "bs-oxido", 0)}{GRIETA}</g></g></g></g>'
              for cae, clip in (("p-bs-cae-i", "bs-mitad-i"), ("p-bs-cae-d", "bs-mitad-d")))
    # la nueva baja desde arriba y arranca
    + f'<g class="baja" style="animation:p-bs-baja .6s cubic-bezier(.3,0,.3,1) {VUELVE - .6}s both">'
    f'<g class="gira" style="animation:p-bs-g2n {DUR_MAQ}s linear both">{rueda_g(G2, "bs-nuevo", 4)}'
    + "".join(f'<circle cx="{G2[0] + 15 * math.cos(a):.1f}" cy="{G2[1] + 15 * math.sin(a):.1f}" r="1.6" fill="#ffd166"/>' for a in (0, 2.1, 4.2))
    + f'</g><text x="{G2[0]}" y="{G2[1] + 3.2}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" style="opacity:0;animation:p-bs-luz .3s ease {VUELVE + .2}s forwards">AI</text></g>'
    + "</svg>")


# El mapa (escena 4): Caracas → Miami, dibujado (no es Google Maps). viewBox 100 × 60.
P0, P1, P2 = (79, 47), (57, 3), (23, 15)


def bezier(t):
    x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0]
    y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1]
    dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0])
    dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])
    return x, y, math.degrees(math.atan2(dy, dx)) + 45  # el ícono mira al noreste


VUELO = "@keyframes p-bs-vuelo { " + " ".join(
    f"{k * 10}% {{ left: {x:.2f}%; top: {y / 60 * 100:.2f}%; transform: rotate({a:.1f}deg) }}" for k in range(11) for x, y, a in [bezier(k / 10)]) + " }"
MAPA = (
    f'<style>{VUELO}</style>'
    '<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><defs>'
    '<linearGradient id="bs-mar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfeaff"/><stop offset="1" stop-color="#8cc8ff"/></linearGradient>'
    '<mask id="bs-ruta-masc"><path class="ruta-m" d="M79 47 Q57 3 23 15" style="--dr:.7s"/></mask></defs>'
    '<rect width="100" height="60" fill="url(#bs-mar)"/>'
    '<g fill="#f6f1e4" stroke="#e2d6b8" stroke-width=".3">'
    '<path d="M0 0 H38 C37 5 33 8 30 11 C27 15 26 21 24 25 C23 28 21 28 20 25 C19 20 15 13 8 10 C4 9 0 9 0 9 Z"/>'
    '<path d="M33 25 C38 23 46 22 54 24 C56 25 55 26 52 26 C46 26 39 27 33 26 Z"/>'
    '<path d="M58 30 C61 29 66 29 68 30 C67 31.5 62 32 58 31 Z"/>'
    '<ellipse cx="73.5" cy="31.5" rx="2.4" ry=".9"/>'
    '<path d="M40 60 C44 53 52 50 60 51 C67 52 73 48 80 48.5 C88 49 94 46 100 45 V60 Z"/></g>'
    '<path d="M79 47 Q57 3 23 15" fill="none" stroke="#5b2bff" stroke-width=".9" stroke-dasharray="2 1.6" stroke-linecap="round" mask="url(#bs-ruta-masc)"/>'
    '<circle cx="79" cy="47" r="1.6" fill="#e8173a" stroke="#fff" stroke-width=".6"/><circle cx="23" cy="15" r="1.6" fill="#e8173a" stroke="#fff" stroke-width=".6"/></svg>'
    f'<div class="bs-avion encima" style="left:79%;top:{47 / 60 * 100:.2f}%;animation:p-bs-vuelo 1.7s cubic-bezier(.45,0,.3,1) .7s both">{ic("airplane-tilt")}</div>'
    f'<div class="bs-pin" style="left:62%;top:83%;--d:.35s">{ic("map-pin")}Caracas</div>'
    f'<div class="bs-pin" style="left:3%;top:38%;--d:2.3s">{ic("map-pin")}Miami</div>'
    '<div class="bs-ano" style="left:62%;top:4%;--d:1.2s">2015</div>')


def cam(id_, dur, pieza, linea, ve, extra="", sale=("corte",)):
    """Una escena donde entra Junior a cámara. Lo que se ve es la guía para
    grabar: el marco, el tiempo y la frase. Su video va encima al montar."""
    escena(id_, dur, pieza, f"[Junior a cámara] {linea}", ve, "camara",
           '<div class="bs-cam"></div>'
           f'<div class="bs-rec"><i></i>Junior on camera<em>{dur:.1f} s</em></div>'
           f'<div class="bs-silueta">{ic("user")}</div>'
           f'<div class="bs-guion" style="top:64cqw;--d:.2s"><small>Say</small><p>“{"&nbsp;".join(linea.rsplit(" ", 1)).replace(" a ", " a&nbsp;").replace(" an ", " an&nbsp;")}”</p></div>' + extra,
           "", sale, voz="")
    CAMARA.append({"t": round(sum(e["dur"] for e in ESC[:-1]), 1), "dur": dur, "linea": linea, "ve": ve})


CAMARA = []

# ═══ 1 · Gancho ═══
OFICIOS = (("hard-hat", "linear-gradient(140deg,#ffcf5c,#f59200)", "Construction"), ("cooking-pot", "linear-gradient(140deg,#ff9a5c,#e8173a)", "Kitchens"),
           ("leaf", "linear-gradient(140deg,#5ef0c9,#0a9e7f)", "Fields"), ("broom", "linear-gradient(140deg,#8a63ff,#5b2bff)", "Cleaning"),
           ("truck", "linear-gradient(140deg,#5ad1ff,#2563eb)", "Delivery"), ("wrench", "linear-gradient(140deg,#ff7aa8,#e11d74)", "Repairs"))
escena("oficios", 3.6, "1 · Gancho", "Everyone knows Latinos work hard.",
       "Crema. Seis fichas de colores con los oficios donde se ve a los latinos trabajar: construcción, cocinas, campo, limpieza, reparto y reparaciones. Entran rebotando una tras otra.",
       "crema",
       deco("esfera", 92, 46, 7, 0.3, c1="#fff3d6", c2="#ffc53d", c3="#c47a00") + deco("destello", 8, 132, 4, 0.6, c1="#f59200")
       + cap(["Everyone knows", "Latinos", '<span class="ligera">work hard.</span>'], d=-0.05, clase="t-l", estilo="font-size:10.6cqw")
       + '<div class="bs-oficios" style="top:60cqw">'
       + "".join(f'<div class="bs-oficio" style="--tc:{c};--d:{0.25 + k * 0.13:.2f}s;--r0:{(-1) ** k * 7}deg">{ic(i)}</div>' for k, (i, c, _) in enumerate(OFICIOS))
       + "</div>",
       "sub@0/-21 " + " ".join(f"pop@{0.25 + k * 0.13:.2f}/{-25 - k}" for k in range(6)), ("lado", "noche"),
       voz="Everyone knows Latinos work hard.")

CODIGO = ((52, 0, "#b9a2ff"), (36, 4, "#5ef0c9"), (60, 4, "#ffd166"), (28, 8, "#ff7aa8"), (46, 8, "#5ad1ff"), (22, 4, "#b9a2ff"), (40, 0, "#5ef0c9"), (30, 4, "#ffd166"))
escena("pantalla", 3.6, "1 · Gancho", "Few talk about the ones behind a screen.",
       "Noche violeta. Son las 2:14 AM: una laptop se abre sola y el código se escribe línea por línea, con el cursor amarillo parpadeando.",
       "noche",
       '<div class="puntos-fondo" style="--punto:rgba(185,162,255,.2)"></div>'
       + deco("destello", 90, 52, 4, 0.4, c1="#ffd166") + deco("anillo-d", 10, 134, 10, 0.5, c1="rgba(185,162,255,.4)")
       + cap(["Few talk about", "the ones behind", '<span class="color-oro">a screen.</span>'], estilo="font-size:10cqw")
       + f'<div class="chip-hora" style="left:8cqw;top:59cqw;--d:.3s">{ic("clock")}2:14 AM</div>'
       + '<div class="bs-laptop" style="top:70cqw;--d:.2s"><div class="tapa"><div class="pant-l">'
       + "".join(f'<i class="bs-lin" style="--w:{w}%;--ind:{ind}cqw;--c:{c};--d:{0.9 + k * 0.22:.2f}s"></i>' for k, (w, ind, c) in enumerate(CODIGO))
       + '<i class="bs-cursor"></i></div></div><div class="base"></div></div>',
       "barrido-suave@0:0.6/-26 teclado@0.9:2.2", ("circulo", "camara", 50, 60),
       voz="Few talk about the ones behind a screen.")

# ═══ 2 · Introducción: Junior a cámara ═══
cam("camara-1", 7.2, "2 · Introducción", "I’m one of them. I’m Junior. I left Venezuela in 2015, escaping Maduro’s dictatorship.",
    "Junior a cámara, de frente y cerca. Abajo, su nombre: «Junior · Founder, Judo Marketing · Miami».",
    '<div class="bs-tercio" style="top:114cqw;--d:.6s"><i></i><span><b>Junior</b><small>Founder · Judo Marketing · Miami</small></span></div>')

# ═══ 3 · Cuerpo 1: la historia ═══
escena("ruta", 6.0, "3 · Cuerpo 1", "Since 2015, giving this country my best.",
       "Azul hielo. Un mapa dibujado: un avión sale de Caracas en 2015 y llega a Miami por una ruta punteada. Abajo, una línea que se llena de 2015 a hoy: el avión, el trabajo de cada día y el cohete de hoy.",
       "hielo",
       deco("esfera", 92, 44, 7, 0.4, c1="#e3eeff", c2="#7aa7ff", c3="#2353c4")
       + cap(["Since 2015,", '<span class="ligera">giving this</span>', '<span class="ligera">country my best.</span>'], estilo="font-size:9.4cqw")
       + f'<div class="bs-mapa" style="top:56cqw;--d:.15s">{MAPA}</div>'
       + '<div class="bs-linea" style="top:108cqw"><div class="riel-l"><i style="--d:2.6s"></i></div>'
       + "".join(f'<div class="bs-hito" style="left:{x}cqw;--d:{d}s"><span>{ic(i)}</span><b>{t}</b></div>'
                 for x, d, i, t in ((5, 2.5, "airplane-tilt", "2015"), (39, 3.4, "laptop", "Every day"), (73, 4.2, "rocket-launch", "Today")))
       + "</div>",
       "golpe-suave@0.15:2/-25 avion@0.7:1.7 cristal@2.5:0/-27 cristal@3.4:2/-27 cristal@4.2:4/-27", ("abajo", "navy"),
       voz="Like so many immigrants, I've given this country my best.")

TECLAS = ["QWERTYUIOP", "ASDFGHJKL;", "ZXCVBNM,./"]
PULSA = {"H": 0.7, "A": 0.85, "R": 1.0, "D": 1.15, "W": 1.6, "O": 1.75, "K": 1.9, "E": 2.3, "N": 2.45, "M": 2.6, "T": 2.75, "S": 3.0}
escena("teclado", 4.2, "3 · Cuerpo 1", "Same hard work. Different tools.",
       "Azul noche. Un teclado de verdad: las teclas se hunden mientras alguien escribe. Abajo, las herramientas de los seis oficios del principio y, al final de la fila, la laptop: el mismo equipo, otra herramienta.",
       "navy",
       deco("esfera", 92, 46, 7, 0.4, c1="#c7d4ff", c2="#4b6bff", c3="#1d2f8f") + deco("destello", 8, 138, 4, 0.7, c1="#ffd166")
       + cap(["Same hard work.", '<span class="ligera">Different tools.</span>'], d=0.0, clase="t-l", estilo="font-size:10cqw")
       + '<div class="bs-teclado" style="top:52cqw;--d:.25s">'
       + "".join(f'<span class="bs-tecla"{f" style={chr(34)}--dk:{PULSA[k]}s{chr(34)}" if k in PULSA else ""}>{k}</span>' for fila in TECLAS for k in fila)
       + '<span class="bs-tecla media" style="font-size:2.6cqw">cmd</span><span class="bs-tecla ancha" style="--dk:2.15s"></span><span class="bs-tecla media" style="font-size:2.6cqw;--dk:3.25s">enter</span>'
       + "</div>"
       + '<div class="bs-herr" style="top:96cqw">'
       + "".join(f'<div class="bs-oficio" style="--tc:{c};--d:{1.3 + k * 0.12:.2f}s;--r0:0deg">{ic(i)}</div>' for k, (i, c, _) in enumerate(OFICIOS))
       + f'<div class="bs-oficio yo" style="--tc:linear-gradient(140deg,#2b2350,#14112a);--d:2.2s;--r0:0deg">{ic("laptop")}</div></div>',
       "teclado@0.6:2.9 clic-suave@3.25/-24", ("circulo", "alarma", 50, 48),
       voz="Same hard work. Just different tools.")

# ═══ 4 · Bucle abierto ═══
escena("bucle-solo", 1.8, "4 · Bucle abierto", "But hard work alone…",
       "Rojo oscuro. Una pesa enorme que tiembla. Corte seco.",
       "alarma",
       '<div class="halo-color" style="top:70cqw;--ancho:110cqw;--hc:rgba(232,23,58,.45)"></div>'
       + deco("destello", 14, 60, 4, 0.5, c1="#ff9aa8", fl=2) + deco("destello", 86, 128, 5, 0.6, c1="#ffd166", fl=2.2)
       + cap(["But hard work", "alone…"], d=-0.1, paso=0.12, clase="t-xl centrado", top=27, estilo="font-size:11.4cqw")
       + f'<div class="bs-icono" style="top:72cqw">{ic("barbell")}</div>',
       "grave@0.2/-22 subida@0:1.6/-30", ("corte",),
       voz="But hard work alone…")

# ═══ 5 · Cuerpo 2: la estrategia judo ═══
VENTANAS = "".join(f'<rect x="{28 + c * 13}" y="{40 + f * 10}" width="7" height="5" rx="1" fill="{"#ffd166" if (c + f) % 3 == 0 else "#c9cde0"}"/>' for c in range(3) for f in range(6))
PALANCA = (
    '<svg viewBox="0 0 200 150" aria-hidden="true"><defs>'
    '<linearGradient id="bs-torre" x1="0" x2="1"><stop offset="0" stop-color="#5d6078"/><stop offset="1" stop-color="#2b2d3f"/></linearGradient>'
    '<linearGradient id="bs-fulcro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#e39c00"/></linearGradient></defs>'
    '<g class="tabla">'
    '<rect x="14" y="104" width="182" height="8" rx="3" fill="#2b2350"/>'
    '<rect x="22" y="30" width="48" height="74" rx="3" fill="url(#bs-torre)"/>' + VENTANAS
    + '<rect x="44" y="20" width="4" height="10" fill="#5d6078"/>'
    '<text x="46" y="14" text-anchor="middle" font-size="7.5" fill="#6b6880">BIG COMPETITOR</text>'
    '<rect x="160" y="84" width="32" height="20" rx="2" fill="#7b4dff"/>'
    + "".join(f'<path d="M{158 + k * 6} 80 h6 v6 a3 3 0 0 1 -6 0 Z" fill="{"#fff" if k % 2 else "#ffd166"}"/>' for k in range(6))
    + '<rect x="181" y="92" width="7" height="12" rx="1" fill="#3b1aa8"/>'
    '<text x="176" y="72" text-anchor="middle" font-size="8" fill="#5b2bff">YOU</text></g>'
    '<g class="empuje" style="--de:1.0s"><path d="M176 34 v22 m-7 -8 l7 8 l7 -8" fill="none" stroke="#0a9e7f" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g>'
    '<polygon points="96,110 82,134 110,134" fill="url(#bs-fulcro)"/><rect x="70" y="134" width="52" height="4" rx="2" fill="#c47a00"/>'
    '<text x="96" y="148" text-anchor="middle" font-size="8" fill="#8a5700">LEVERAGE</text></svg>')
escena("palanca", 4.8, "5 · Cuerpo 2", "…doesn't beat bigger companies. Leverage does.",
       "Blanco. Una torre gris de una gran empresa contra una tienda chica violeta, sobre una tabla con su punto de apoyo dorado. La tienda empuja y levanta a la torre: «Leverage».",
       "nieve",
       deco("esfera", 92, 46, 7, 0.4, c1="#ffe2a8", c2="#ffb224", c3="#c47a00") + deco("cruz", 8, 140, 4, 0.8, c1="#5b2bff")
       + cap(["…doesn’t beat", "bigger companies.", '<span class="color-violeta">Leverage does.</span>'], estilo="font-size:9.4cqw")
       + f'<div class="bs-palanca" style="top:60cqw">{PALANCA}</div>',
       "sub@0/-22 golpe-suave@1.0:1/-24 arranque@1.6:0.9 sello@2.5/-17", ("lado", "electrico"),
       voz="…doesn't beat bigger companies. Leverage does.")

SERVICIOS = (("globe", "Websites"), ("device-mobile", "Apps"), ("megaphone", "Ads &amp; social"), ("sparkle", "AI"))
escena("judo", 3.6, "5 · Cuerpo 2", "So I built Judo Marketing.",
       "Violeta eléctrico. El logo de Judo Marketing en grande y lo que hace: websites, apps, anuncios y redes, IA.",
       "electrico",
       deco("esfera", 90, 46, 8, 0.3, c1="#ffffff", c2="#b9a2ff", c3="#5b2bff") + deco("anillo-d", 8, 132, 12, 0.5, c1="rgba(255,255,255,.35)")
       + cap(["So I built", '<span class="color-oro">Judo Marketing.</span>'], d=0.0, clase="t-l", estilo="font-size:10cqw")
       + '<div class="logo-pro aparece" style="top:48cqw;--ancho:40cqw;--d:.3s"><img src="img/judo-logo.webp" alt="Judo Marketing"></div>'
       + '<div class="bs-servicios" style="top:94cqw">'
       + "".join(f'<span style="--d:{0.9 + k * 0.15:.2f}s">{ic(i)}{t}</span>' for k, (i, t) in enumerate(SERVICIOS)) + "</div>",
       "brillo@0.2/-22 " + " ".join(f"pop@{0.9 + k * 0.15:.2f}/{-27 - k}" for k in range(4)), ("abajo", "ciruela"),
       voz="So I built Judo Marketing.")

# ═══ 6 · Bucle abierto ═══
escena("bucle-roto", 1.8, "6 · Bucle abierto", "What's broken in your business?",
       "Ciruela. Una llave inglesa grande que tiembla. Corte seco.",
       "ciruela",
       deco("destello", 16, 62, 4, 0.3, c1="#ffc1e3", fl=2) + deco("destello", 84, 126, 5, 0.5, c1="#ffd166", fl=2.2)
       + cap(["What’s broken", '<span class="ligera">in your business?</span>'], d=-0.1, paso=0.12, clase="t-l centrado", top=27, estilo="font-size:9.6cqw")
       + f'<div class="bs-icono" style="top:66cqw">{ic("wrench")}</div>',
       "aviso@0.1:0/-24", ("corte",),
       voz="What's broken?")

# ═══ 7 · Cuerpo 3: la solución ═══
escena("engranajes", 6.0, "7 · Cuerpo 3", "Complex problems, smart solutions. Broken → Rebuilt.",
       "Lavanda. Una máquina de engranajes en marcha. El engranaje viejo del medio tiembla, se agrieta y se parte en dos; la máquina se detiene y la luz se pone roja. Baja un engranaje nuevo, violeta, con «AI», y la máquina arranca más rápido, con la luz verde.",
       "lavanda",
       deco("rejilla-d", 90, 140, 12, 0.5, c1="rgba(91,43,255,.35)") + deco("destello", 92, 44, 5, 3.3, c1="#5b2bff")
       + cap(["Complex problems,", '<span class="ligera">smart solutions.</span>'], d=0.0, clase="t-l", estilo="font-size:8.8cqw")
       + f'<div class="bs-maquina" style="top:47cqw;--d:.1s">{MAQUINA}</div>'
       + f'<div class="bs-estado roto" style="top:111cqw;--d:1.5s">{ic("warning-circle")} Broken</div>'
       + f'<div class="bs-estado nuevo" style="top:111cqw;--d:3.3s">{ic("check-circle")} Rebuilt · running better</div>',
       "engranaje@0.1:1.3 rotura@1.4 caja@2.95/-17 arranque@3.0:0.8 engranaje@3.1:2.8/-27 campanita@3.4/-26", ("circulo", "camara", 50, 55),
       voz="Complex problems need smart solutions. We rebuild the machine.")

cam("camara-2", 6.6, "7 · Cuerpo 3", "This video found you for a reason. Tell me what’s broken. Together, we’ll fix it.",
    "Junior a cámara, más cerca, hablándole a una sola persona.")

EDITOR = ((70, 0, "#b9a2ff"), (48, 4, "#5ef0c9"), (62, 4, "#ffd166"), (40, 8, "#ff7aa8"), (56, 4, "#5ad1ff"))
escena("codigo", 4.8, "7 · Cuerpo 3", "With code and AI, we take your business further. Your goal · Or higher.",
       "Menta. Un editor de código se escribe solo y la IA sugiere una línea. Al lado, un medidor sube, pasa la marca «Your goal» y llega a «Or higher».",
       "menta",
       deco("esfera", 92, 44, 7, 0.4, c1="#e4fff6", c2="#5ef0c9", c3="#067a62")
       + cap(["With code and AI,", "we take your", '<span class="ligera">business further.</span>'], estilo="font-size:9cqw")
       + '<div class="bs-editor" style="top:58cqw;--d:.15s"><div class="cab-e"><i style="--c:#ff5f57"></i><i style="--c:#febc2e"></i><i style="--c:#28c840"></i><b>your-business.ts</b></div><div class="cuerpo-e">'
       + "".join(f'<i class="bs-lin" style="--w:{w}%;--ind:{ind}cqw;--c:{c};--d:{0.5 + k * 0.2:.2f}s"></i>' for k, (w, ind, c) in enumerate(EDITOR))
       + f'<div class="bs-ia" style="--d:1.6s">{ic("sparkle")}AI: suggested fix</div></div></div>'
       + '<div class="bs-medidor" style="top:58cqw;height:50cqw"><div class="tubo"><i style="--d:2.0s"></i></div>'
       + '<div class="bs-marca" style="top:32%;--d:1.9s"><span>Your<br>goal</span></div>'
       + '<div class="bs-marca" style="top:7%;--d:3.0s"><span>Or<br>higher</span></div></div>',
       "teclado@0.5:1.2/-30 brillo@1.6/-24 subida-suave@2.0:1.4 cristal@3.1:4/-26", ("lado", "durazno"),
       voz="With code and AI, we take your business further.")

TAGS = (("globe", "Website"), ("megaphone", "Ads"), ("chat-teardrop-text", "Messages"), ("instagram-logo", "Social media"))
escena("peso", 4.8, "7 · Cuerpo 3", "Or help you carry the weight of running a company.",
       "Durazno. Una caja pesada, «Running a company», con lo que pesa adentro (website, anuncios, mensajes, redes), cargada solo por «You» y caída hacia un lado. Llega «Judo Marketing» a cargar del otro lado y la caja sube derecha.",
       "durazno",
       deco("esfera", 92, 44, 7, 0.4, c1="#fff1e6", c2="#ff9a5c", c3="#c2410c")
       + cap(["Or help you carry", "the weight of", '<span class="color-violeta">running a company.</span>'], estilo="font-size:8.6cqw")
       + '<div class="bs-carga" style="top:56cqw;--dl:1.7s"><small>Running a company</small><div class="tags">'
       + "".join(f"<span>{ic(i)}{t}</span>" for i, t in TAGS) + "</div></div>"
       + f'<div class="bs-apoyo" style="left:12cqw;top:101cqw;--d:.3s">{ic("user")}You</div>'
       + '<div class="bs-apoyo oscuro" style="left:46cqw;top:101cqw;width:38cqw;--d:1.3s"><img src="img/judo-logo.webp" alt="">Judo Marketing</div>',
       "grave@0.3/-24 pop@1.3/-27 subida-suave@1.6:1.0 golpe-suave@2.5:2/-26", ("abajo", "camara"),
       voz="Or help you carry the weight of running a company.")

# ═══ 8 · Llamado a la acción ═══
cam("camara-3", 6.0, "8 · Llamado a la acción", "Tell me your problem. For ninety-nine dollars, I’ll give you a diagnosis and an action plan.",
    "Junior a cámara, con una sonrisa: el cierre.")

escena("cierre", 7.2, "8 · Llamado a la acción", "Tell me your problem. Message me on WhatsApp. $99: diagnosis + action plan, a PDF in 3 business days. judomarketing.net/diagnostic",
       "Mezcla de violeta, azul y rosa. «Tell me your problem.», el botón verde de WhatsApp con el número, la oferta de $99 (diagnóstico y plan de acción, con la estrategia judo) y la dirección. Queda quieto más de 4 segundos.",
       "cierre",
       deco("esfera", 88, 44, 8, 0.3, c1="#ffe0f0", c2="#ff4fa0", c3="#8a1250") + deco("anillo-d", 92, 126, 10, 0.5, c1="rgba(255,255,255,.3)")
       + deco("destello", 10, 140, 4, 0.8, c1="#ffd166")
       + cap(["Tell me", '<span class="color-oro">your problem.</span>'], d=0.05, clase="t-xl", top=22, estilo="font-size:11.4cqw")
       + f'<div class="cta-wa" style="top:51cqw;--d:.5s">{ic("whatsapp-logo")}<span><small>Message me on WhatsApp</small>+1 305 934 9981</span></div>'
       + '<div class="bs-oferta" style="top:71cqw;--d:.9s"><b>$99</b><span>Diagnosis + action&nbsp;plan<small>A PDF in 3 business days</small></span></div>'
       + f'<div class="bs-link" style="top:95cqw;--d:1.2s">{ic("globe")}judomarketing.net/diagnostic</div>'
       + '<div class="logo-pro aparece" style="top:106cqw;left:8cqw;margin-left:0;--ancho:24cqw;--d:1.4s"><img src="img/judo-logo.webp" alt="Judo Marketing"></div>',
       "golpe-suave@0.3:2/-24 notificacion@0.5/-24 brillo@0.9/-26 campanita@1.4/-26",
       voz="Message me on WhatsApp. I'll answer you myself.")

html = cabeza + "<!-- ═══════════════ ESCENAS (las arma armar.py) ═══════════════ -->\n" + "\n\n".join(T) + \
    '\n\n<script type="application/json" id="escenas">\n' + json.dumps(ESC, ensure_ascii=False, indent=1) + "\n</script>\n\n" + pie
open(os.path.join(D, "storyboard.html"), "w", encoding="utf-8").write(html)
json.dump(CAMARA, open(os.path.join(D, "camara.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(ESC)} escenas, {sum(e['dur'] for e in ESC):.1f} s; {len(CAMARA)} a cámara")
