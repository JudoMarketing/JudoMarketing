# Arma storyboard.html del video «Count your yeses» (Judo Marketing, en
# inglés). v1: 13 nov 2026, desde el carrusel «Turn off your phone».
# v3: 14 nov 2026, la primera tarea de Vendito. Junior pidió que fuera «el
# video más poderoso que tenemos para atraer clientes»: dueños que pierden
# clientes o no dan abasto, redes y anuncios desde $5 al día que elige el
# cliente, la auditoría de $99 contra la competencia con fechas, y la promesa
# de un servicio mejor con contacto humano. Brief y prueba del humano:
# docs/vendito/briefs/2026-11-14-count-your-yeses.md
# Para cambiar el video: edita este archivo y corre
#   python3 armar.py && python3 build.py && node revisar.mjs
# Los estilos son base.html (plantilla de la skill judo-video-vertical) +
# pro.css (la capa pro) + diseno.css (el sistema de este video). Los iconos
# son Phosphor (licencia MIT, vectores/LICENSE.txt); los dibujos (teléfono,
# tienda, reloj de arena, monedas) están aquí. Las capturas de img/trabajo son
# sitios reales hechos por Judo (el showcase de judomarketing.net).
import json, os, re

D = os.path.dirname(os.path.abspath(__file__))
base = open(os.path.join(D, "base.html"), encoding="utf-8").read().replace('<html lang="es">', '<html lang="en">', 1)
base = re.sub(r"<title>.*?</title>", "<title>Video · Count your yeses · Judo Marketing</title>", base)
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


def rastreo(n, total=3, oscuro=False):
    """El hilo del video: «Question n / total»; el segmento de ahora se llena."""
    segs = "".join(f'<i class="{"hecho" if k < n - 1 else "ahora" if k == n - 1 else "falta"}"></i>' for k in range(total))
    return f'<div class="rastreo{" oscuro" if oscuro else ""}"><b>Question {n} / {total}</b>{segs}</div>'


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


# ── Dibujos ──
def tienda():
    """Una tienda de barrio de noche: cornisa, toldo a rayas, vidriera con
    productos, puerta, lámpara y dos matas. El vidrio se apaga a los 1,55 s."""
    franjas = ""
    x0, w = 24, 44
    for k in range(8):
        x = x0 + k * w
        franjas += (f'<path d="M{x} 80 h{w} v30 a{w / 2} 11 0 0 1 -{w} 0 Z" fill="{"#6e3bff" if k % 2 == 0 else "#ffffff"}"/>')
    productos = "".join(f'<rect x="{x}" y="{y}" width="{a}" height="{h}" rx="2" fill="{c}"/>'
                        for x, y, a, h, c in ((70, 186, 16, 22, "#ff8a5c"), (90, 192, 14, 16, "#6e3bff"), (108, 184, 18, 24, "#10b981"),
                                              (132, 190, 14, 18, "#ffb224"), (150, 186, 20, 22, "#ff5ca8"), (176, 192, 14, 16, "#3b82f6"),
                                              (196, 188, 12, 20, "#ff8a5c"), (70, 232, 22, 20, "#ffb224"), (98, 236, 16, 16, "#ff5ca8"),
                                              (120, 230, 18, 22, "#6e3bff"), (144, 234, 22, 18, "#10b981"), (172, 232, 16, 20, "#3b82f6"), (192, 236, 18, 16, "#ff8a5c")))
    mata = lambda cx: (f'<path d="M{cx - 15} 336 h30 l-4 28 h-22 Z" fill="#e07a4a"/><rect x="{cx - 17}" y="332" width="34" height="7" rx="3" fill="#c9653a"/>'
                       f'<circle cx="{cx - 9}" cy="318" r="13" fill="#13865c"/><circle cx="{cx + 9}" cy="316" r="14" fill="#19a974"/><circle cx="{cx}" cy="303" r="14" fill="#19a974"/>'
                       f'<circle cx="{cx - 4}" cy="298" r="5" fill="#5ee3a6" opacity=".7"/>')
    return (
        '<svg viewBox="0 40 400 336" aria-hidden="true"><defs>'
        '<linearGradient id="td-pared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#efe5d3"/></linearGradient>'
        '<linearGradient id="td-lado" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8cab2"/><stop offset="1" stop-color="#c3b296"/></linearGradient>'
        '<linearGradient id="td-vidrio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c9"/><stop offset="1" stop-color="#ffc56b"/></linearGradient>'
        '<linearGradient id="td-noche" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e2470"/><stop offset="1" stop-color="#14103a"/></linearGradient>'
        '<linearGradient id="td-puerta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3dff"/><stop offset="1" stop-color="#3b1aa8"/></linearGradient>'
        '<linearGradient id="td-sombra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c2a10" stop-opacity=".22"/><stop offset="1" stop-color="#3c2a10" stop-opacity="0"/></linearGradient>'
        '<linearGradient id="td-toldo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>'
        '<radialGradient id="td-luz"><stop offset="0" stop-color="#ffd166" stop-opacity=".9"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>'
        '<filter id="td-difusa" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="6"/></filter></defs>'
        '<ellipse cx="205" cy="368" rx="200" ry="9" fill="#3c2a10" opacity=".28" filter="url(#td-difusa)"/>'
        '<polygon points="368,74 390,88 390,370 368,362" fill="url(#td-lado)"/>'
        '<rect x="32" y="70" width="336" height="292" fill="url(#td-pared)"/>'
        '<rect x="32" y="342" width="336" height="20" fill="#e2d5bf"/>'
        '<polygon points="378,52 398,66 398,88 378,78" fill="#1a124a"/>'
        '<rect x="22" y="50" width="356" height="28" rx="6" fill="#2b1e5c"/><rect x="22" y="50" width="356" height="6" rx="3" fill="#4a3a8c"/>'
        '<rect x="150" y="57" width="100" height="14" rx="7" fill="#ffd166"/><circle cx="166" cy="64" r="3.5" fill="#2b1e5c"/><rect x="176" y="61" width="58" height="6" rx="3" fill="#2b1e5c" opacity=".55"/>'
        '<rect x="32" y="110" width="336" height="26" fill="url(#td-sombra)"/>'
        f'{franjas}<rect x="24" y="80" width="352" height="30" fill="url(#td-toldo)"/><rect x="18" y="76" width="364" height="7" rx="3.5" fill="#2b1e5c"/>'
        # La vidriera
        '<rect x="52" y="150" width="172" height="152" rx="6" fill="#2b1e5c"/>'
        '<rect x="60" y="158" width="156" height="136" rx="3" fill="url(#td-vidrio)"/>'
        f'{productos}<rect x="62" y="208" width="152" height="5" rx="2" fill="#c98a3a" opacity=".55"/><rect x="62" y="252" width="152" height="5" rx="2" fill="#c98a3a" opacity=".55"/>'
        '<rect class="vidrio-oscuro" x="60" y="158" width="156" height="136" rx="3" fill="url(#td-noche)" opacity=".92"/>'
        '<polygon points="72,294 116,158 134,158 90,294" fill="#fff" opacity=".28"/><polygon points="100,294 144,158 150,158 106,294" fill="#fff" opacity=".2"/>'
        '<rect x="46" y="298" width="184" height="9" rx="3" fill="#d6c6aa"/>'
        # La puerta
        '<rect x="246" y="148" width="106" height="214" rx="6" fill="#2b1e5c"/>'
        '<rect x="254" y="156" width="90" height="206" rx="3" fill="url(#td-puerta)"/>'
        '<rect x="264" y="168" width="70" height="96" rx="4" fill="url(#td-vidrio)"/>'
        '<rect class="vidrio-oscuro" x="264" y="168" width="70" height="96" rx="4" fill="url(#td-noche)" opacity=".92"/>'
        '<polygon points="270,264 296,168 306,168 280,264" fill="#fff" opacity=".25"/>'
        '<rect x="254" y="330" width="90" height="32" fill="#000" opacity=".14"/>'
        '<circle cx="334" cy="282" r="5.5" fill="#ffd166"/><circle cx="332.5" cy="280.5" r="2" fill="#fff" opacity=".7"/>'
        '<rect x="236" y="360" width="126" height="10" rx="2" fill="#d3c4aa"/>'
        # La lámpara sobre la puerta
        '<circle class="luz-lampara" cx="299" cy="140" r="44" fill="url(#td-luz)"/>'
        '<path d="M287 126 h24 l-5 12 h-14 Z" fill="#2b1e5c"/><rect x="297" y="118" width="4" height="9" fill="#2b1e5c"/><ellipse cx="299" cy="139" rx="7" ry="3" fill="#ffe08a"/>'
        + mata(26) + mata(384) + "</svg>")


RELOJ_ARENA = (
    '<svg viewBox="0 0 80 120" aria-hidden="true"><defs>'
    '<linearGradient id="ra-vidrio" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>'
    '<linearGradient id="ra-madera" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffcf70"/><stop offset="1" stop-color="#d98a1c"/></linearGradient>'
    '<linearGradient id="ra-arena" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#f59200"/></linearGradient>'
    # La arena se recorta con la forma de cada bulbo y lo que se mueve es el nivel:
    # arriba baja, abajo sube haciendo montoncito (CEREBRO, sección 10, 14 nov).
    '<clipPath id="ra-sup"><path d="M19.5 15 H60.5 C60.5 40 45.5 52 41.6 59.5 H38.4 C34.5 52 19.5 40 19.5 15 Z"/></clipPath>'
    '<clipPath id="ra-inf"><path d="M38.4 60.5 H41.6 C45.5 68 60.5 80 60.5 105 H19.5 C19.5 80 34.5 68 38.4 60.5 Z"/></clipPath></defs>'
    '<g clip-path="url(#ra-sup)"><rect class="arena-sup" x="0" y="27" width="80" height="40" fill="url(#ra-arena)"/></g>'
    '<g clip-path="url(#ra-inf)"><path class="arena-inf" d="M0 96 Q40 82 80 96 V132 H0 Z" fill="url(#ra-arena)"/></g>'
    '<rect class="chorro" x="39.4" y="58" width="1.2" height="46" fill="#ffb224"/>'
    '<path d="M18 14 H62 C62 40 46 52 44 60 C46 68 62 80 62 106 H18 C18 80 34 68 36 60 C34 52 18 40 18 14 Z" fill="url(#ra-vidrio)" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>'
    '<path d="M24 18 C24 36 31 46 35 52" stroke="#fff" stroke-opacity=".8" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    '<rect x="9" y="14" width="5" height="92" rx="2.5" fill="#c47a14"/><rect x="66" y="14" width="5" height="92" rx="2.5" fill="#c47a14"/>'
    '<rect x="3" y="3" width="74" height="12" rx="5" fill="url(#ra-madera)"/><rect x="3" y="105" width="74" height="12" rx="5" fill="url(#ra-madera)"/>'
    '<rect x="7" y="5" width="50" height="3" rx="1.5" fill="#fff" opacity=".5"/></svg>')

PERIODICO = (
    '<svg viewBox="0 0 300 210" aria-hidden="true"><defs>'
    '<linearGradient id="pe-pliegue" x1="0" x2="1"><stop offset=".44" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".13"/><stop offset=".56" stop-color="#000" stop-opacity="0"/></linearGradient></defs>'
    '<rect x="14" y="12" width="280" height="194" rx="4" fill="#d9d2c3" transform="rotate(3.5 150 105)"/>'
    '<rect x="6" y="6" width="288" height="198" rx="4" fill="#fbf8f1"/>'
    '<rect x="22" y="20" width="256" height="24" rx="2" fill="#14112a"/><rect x="92" y="28" width="116" height="8" rx="2" fill="#fff"/>'
    '<rect x="22" y="48" width="256" height="2" fill="#14112a"/>'
    '<rect x="22" y="58" width="100" height="16" rx="2" fill="#e8173a"/><rect x="30" y="63" width="70" height="6" rx="2" fill="#fff"/>'
    '<rect x="132" y="63" width="80" height="6" rx="2" fill="#bdb6a6"/>'
    '<rect x="22" y="82" width="256" height="11" rx="2" fill="#2a2540"/><rect x="22" y="98" width="190" height="11" rx="2" fill="#2a2540"/>'
    '<rect x="22" y="118" width="118" height="74" rx="3" fill="#ffd9de"/>'
    f'<g transform="translate(57 131) scale(.19)" fill="#e8173a">{path_de("shield-warning")}</g>'
    + "".join(f'<rect x="152" y="{y}" width="{126 if k % 4 != 3 else 80}" height="4" rx="2" fill="#c9c3b6"/>' for k, y in enumerate(range(120, 194, 9)))
    + '<rect x="6" y="6" width="288" height="198" rx="4" fill="url(#pe-pliegue)"/></svg>')

MEDIDOR = (
    '<svg viewBox="0 0 120 68" aria-hidden="true"><defs>'
    '<linearGradient id="gr-medidor" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="110" y2="0"><stop offset="0" stop-color="#ffb224"/><stop offset=".6" stop-color="#ff6a3d"/><stop offset="1" stop-color="#e8173a"/></linearGradient></defs>'
    '<path class="arco-fondo" d="M10 60 A50 50 0 0 1 110 60"/>'
    '<path class="arco" pathLength="1" d="M10 60 A50 50 0 0 1 110 60" style="--d:.9s"/>'
    '<g class="aguja" style="--d:.9s"><path d="M57.5 60 L60 20 L62.5 60 Z" fill="#14112a"/><circle cx="60" cy="60" r="6.5" fill="#14112a"/><circle cx="60" cy="60" r="2.4" fill="#fff"/></g></svg>')

DONA = (
    '<svg viewBox="0 0 100 100" aria-hidden="true"><defs>'
    '<linearGradient id="gr-dona" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a63ff"/><stop offset="1" stop-color="#4b1fd1"/></linearGradient></defs>'
    '<circle class="anillo-fondo" cx="50" cy="50" r="40"/>'
    '<circle class="anillo-lleno" cx="50" cy="50" r="40" pathLength="1" transform="rotate(-90 50 50)" style="--d:2s"/>'
    f'<g transform="translate(32 32) scale(.14)" fill="#5b2bff">{path_de("globe")}</g></svg>')

ETIQUETA = (
    '<svg viewBox="0 0 200 270" aria-hidden="true"><defs>'
    '<linearGradient id="et-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffe7bd"/></linearGradient></defs>'
    '<path d="M100 0 V82" stroke="#7a4a00" stroke-width="3" stroke-linecap="round"/>'
    '<path d="M100 54 L156 98 Q160 102 160 108 V250 Q160 262 148 262 H52 Q40 262 40 250 V108 Q40 102 44 98 Z" fill="url(#et-a)" stroke="#e59400" stroke-width="2"/>'
    '<circle cx="100" cy="92" r="10" fill="#f5a300" stroke="#c47a00" stroke-width="2"/><path d="M100 0 V88" stroke="#7a4a00" stroke-width="3" stroke-linecap="round"/>'
    '<path d="M52 116 H148" stroke="#f0c98a" stroke-width="2.4" stroke-dasharray="6 5"/>'
    f'<g transform="translate(52 130) scale(.375)" fill="#14112a">{path_de("currency-dollar")}</g>'
    + "".join(f'<rect x="{x}" y="234" width="{w}" height="14" fill="#14112a" opacity=".75"/>' for x, w in ((64, 3), (70, 2), (75, 5), (83, 2), (88, 3), (94, 6), (103, 2), (108, 4), (115, 2), (120, 5), (128, 3), (134, 2)))
    + '<path d="M58 106 Q66 100 74 104" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/></svg>')

MAPA = (
    '<svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" fill="#e3f6ef"/>'
    '<path d="M44 0 C40 14 46 24 42 36 C39 46 44 54 42 60 H60 V0 Z" fill="#bfe3ff"/>'
    '<path d="M0 18 H60 M0 40 H44 M14 0 V60 M30 0 V60" stroke="#fff" stroke-width="3"/>'
    '<path d="M0 28 C16 26 26 34 44 30" stroke="#fff" stroke-width="2"/>'
    '<circle cx="28" cy="30" r="17" fill="#10b981" fill-opacity=".18" stroke="#0a9e7f" stroke-width="1.4" stroke-dasharray="3 2.4"/>'
    f'<g transform="translate(18 16) scale(.08)" fill="#e8173a">{path_de("map-pin")}</g></svg>')

GLOBO = (
    '<svg viewBox="0 0 200 170" aria-hidden="true"><defs>'
    '<linearGradient id="gl-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ddff"/></linearGradient>'
    '<linearGradient id="gl-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ee07f"/><stop offset="1" stop-color="#0f9d58"/></linearGradient></defs>'
    '<path d="M76 8 h96 a24 24 0 0 1 24 24 v46 a24 24 0 0 1 -24 24 h-10 l6 22 -32 -22 h-60 a24 24 0 0 1 -24 -24 v-46 a24 24 0 0 1 24 -24z" fill="url(#gl-b)"/>'
    f'<g transform="translate(108 30) scale(.22)" fill="#fff">{path_de("whatsapp-logo")}</g>'
    '<path d="M30 40 h110 a26 26 0 0 1 26 26 v44 a26 26 0 0 1 -26 26 h-72 l-32 26 6 -26 h-12 a26 26 0 0 1 -26 -26 v-44 a26 26 0 0 1 26 -26z" fill="url(#gl-a)"/>'
    '<path d="M14 92 v-26 a26 26 0 0 1 22 -25" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>'
    '<circle class="p3" cx="62" cy="88" r="9" fill="#5b2bff"/><circle class="p3" cx="85" cy="88" r="9" fill="#5b2bff"/><circle class="p3" cx="108" cy="88" r="9" fill="#5b2bff"/></svg>')


# ═══════════════════════════════════════════════════════════════════════
# v3 (14 nov 2026, Vendito). Brief y prueba del humano:
# docs/vendito/briefs/2026-11-14-count-your-yeses.md
# Tres preguntas (una por dolor), la competencia que contesta primero, el
# arreglo de cada sí, las redes y los anuncios (desde $5 al día), la
# auditoría de $99 contra la competencia con plan y fechas, sitios reales,
# la promesa con persona real y una sola acción al final.
# La voz va en un clip por escena (voz.json), escrita a 3,3 sílabas por
# segundo: ninguna frase pasa del 85 % de su escena.
# ═══════════════════════════════════════════════════════════════════════

MONEDAS = (
    '<svg viewBox="0 0 160 170" aria-hidden="true"><defs>'
    '<linearGradient id="mn-c" x1="0" x2="1"><stop offset="0" stop-color="#b87a00"/><stop offset=".5" stop-color="#f5b700"/><stop offset="1" stop-color="#a86b00"/></linearGradient>'
    '<radialGradient id="mn-t" cx=".38" cy=".35" r=".8"><stop offset="0" stop-color="#fff3bf"/><stop offset=".55" stop-color="#ffc53d"/><stop offset="1" stop-color="#d98a00"/></radialGradient></defs>'
    '<ellipse cx="80" cy="160" rx="66" ry="9" fill="#5a3a00" opacity=".25"/>'
    + "".join(f'<g transform="translate(0 {y})"><path d="M22 0 v14 a58 14 0 0 0 116 0 v-14 Z" fill="url(#mn-c)"/>'
              f'<ellipse cx="80" cy="0" rx="58" ry="14" fill="url(#mn-t)" stroke="#c48400" stroke-width="1.5"/>'
              f'<ellipse cx="80" cy="0" rx="44" ry="10" fill="none" stroke="#fff6cc" stroke-opacity=".55" stroke-width="1.5"/></g>'
              for y in (146, 128, 110, 92, 74))
    + '<g class="moneda-salta"><ellipse cx="96" cy="34" rx="34" ry="34" fill="url(#mn-t)" stroke="#c48400" stroke-width="2"/>'
    f'<g transform="translate(70 8) scale(.2)" fill="#7a4d04">{path_de("currency-dollar")}</g>'
    '<ellipse cx="86" cy="22" rx="12" ry="6" fill="#fff" opacity=".45" transform="rotate(-30 86 22)"/></g></svg>')


def pant_bloqueo(hora):
    return ('<div class="fondo-bloqueo"></div>'
            f'<div class="hora-bloqueo"><small>{ic("lock-simple")} Tuesday</small><b>{hora}</b></div>')


def post(top, d, color, icono):
    return (f'<div class="post" style="top:{top}%;--d:{d}s"><div class="foto-p" style="background:{color}">{ic(icono)}</div>'
            f'<div class="pie-p">{ic("heart")} 128 · {ic("chat-teardrop-text")} 14</div></div>')


PANT_FEED = ('<div style="position:absolute;inset:0;background:#f6f5fb"></div>'
             '<div style="position:absolute;left:0;right:0;top:6.5%;text-align:center;font:700 4.4cqw/1 var(--f-titular);color:#14112a">Your feed</div>'
             + post(14, 0.6, "linear-gradient(140deg,#ff9a5c,#e8173a)", "fork-knife")
             + post(40, 1.2, "linear-gradient(140deg,#8a63ff,#3b1aa8)", "scissors")
             + post(66, 1.8, "linear-gradient(140deg,#5ef0c9,#0a9e7f)", "hammer"))

# ═══ 1 · Gancho ═══
PANT_APAGAR = ('<div class="fondo-apagado"></div>'
               f'<div class="riel-apagar"><span class="texto-riel" style="animation-delay:0s,.95s">slide to power off</span><b class="perilla-apagar" style="animation-delay:.75s">{ic("power")}</b></div>'
               '<i class="cancelar-x"></i><i class="pantalla-negra" style="--d:1.6s"></i><i class="luz-apagado" style="--d:1.6s"></i>')

escena("apaga", 3.0, "1 · Gancho", "Business owners: turn off your phone.",
       "Noche violeta. «Business owners» y el titular. Un teléfono de verdad, inclinado y con reflejo, muestra «slide to power off»: el botón rojo se desliza solo y la pantalla se apaga con una raya de luz.",
       "noche",
       '<div class="puntos-fondo" style="--punto:rgba(185,162,255,.22)"></div>'
       + '<div class="halo-color" style="top:66cqw;--ancho:96cqw;--hc:rgba(123,77,255,.5)"></div>'
       + deco("destello", 14, 66, 5, 0.3, c1="#d9ccff", fl=2.4) + deco("destello", 86, 92, 4, 0.5, c1="#ffd166", fl=2.8)
       + deco("esfera", 85, 64, 9, 0.2, c1="#c9b6ff", c2="#7b4dff", c3="#3a1f9a") + deco("anillo-d", 12, 120, 12, 0.4, c1="rgba(185,162,255,.45)")
       + f'<div class="kicker-v" style="--d:0s">{ic("storefront")} Business owners</div>'
       + cap(["Turn off", '<span class="raya" style="--dr:1.1s;--raya:#ff3b4f">your phone.</span>'], d=0.15, paso=0.12, clase="t-xl", top=26.5, estilo="font-size:12.6cqw")
       + telefono(58, 54, PANT_APAGAR),
       "sub@0/-21 clic-suave@0.75/-26 apagar@1.6", ("circulo", "papel", 50, 63),
       voz="Business owner? Turn off your phone.")

escena("sigue-vendiendo", 3.0, "1 · Gancho", "Is your business still selling?",
       "Papel. La tienda de barrio dibujada con sombras; arriba, junto a la hora, cuatro fichas de rubros (restaurante, contratista, salón, clínica). Son las 11:47 PM. El letrero se columpia en «OPEN», se voltea a «CLOSED» y la tienda se apaga.",
       "papel",
       deco("cruz", 10, 140, 4, 0.5, c1="#6e3bff")
       + cap(["Is your business", '<span class="raya" style="--dr:.85s">still selling?</span>'], d=0.0, clase="t-l", estilo="font-size:9.2cqw")
       + f'<div class="chip-hora" style="left:8cqw;top:47cqw;--d:.25s">{ic("clock")}11:47 PM</div>'
       + f'<div class="tienda" style="top:58cqw;--d:.05s">{tienda()}</div>'
       + '<div class="letrero encima" style="left:71.6cqw;top:93cqw"><div class="gira-l"><span class="cara abierto">OPEN</span><span class="cara cerrado">CLOSED</span></div></div>'
       + "".join(f'<div class="rubro" style="left:{x}cqw;top:{y}cqw;--d:{d}s"><i style="animation-delay:{d}s">{ic(i)}</i></div>'
                 for x, y, d, i in ((49.5, 50.5, 0.35, "fork-knife"), (62, 50.5, 0.45, "hammer"), (74.5, 50.5, 0.55, "scissors"), (87, 50.5, 0.65, "tooth"))),
       "golpe-suave@0.15:0/-25 reloj@0.3:1.2 voltear@1.5", ("lado", "electrico"),
       voz="Is your business still selling?")

# ═══ 2 · Introducción ═══
escena("tres", 3.0, "2 · Introducción", "3 questions. Count your yeses.",
       "Violeta eléctrico. «3 questions.» y tres fichas numeradas que se levantan como teclas. Abajo, «Yes» y «No»: se enciende «Yes».",
       "electrico",
       deco("esfera", 88, 52, 10, 0.4, c1="#ffffff", c2="#b9a2ff", c3="#5b2bff") + deco("anillo-d", 9, 132, 14, 0.5, c1="rgba(255,255,255,.35)")
       + deco("destello", 90, 112, 5, 0.9, c1="#ffd166", fl=2.6)
       + cap(["3 questions."], d=-0.05, clase="t-xl", estilo="font-size:13cqw")
       + cap(['<span class="ligera">Count your</span> yeses.'], d=0.2, clase="t-m", top=40)
       + '<div class="fichas-3" style="top:60cqw">' + "".join(f'<span class="ficha-n" style="--d:{0.35 + i * 0.12:.2f}s">{i + 1}</span>' for i in range(3)) + "</div>"
       + f'<div class="si-no" style="top:96cqw"><span style="--d:.95s">{ic("check-circle")} Yes<b class="si-on" style="--don:1.75s">{ic("check-circle")} Yes</b></span>'
       f'<span style="--d:1.05s">{ic("x-circle")} No</span></div>',
       "burbuja@0.35/-25 burbuja@0.47/-26 burbuja@0.59/-27 clic-suave@1.75/-24 cristal@1.8:4/-25", ("abajo", "navy"),
       voz="Three questions. Count your yeses.")

# ═══ 3 · Cuerpo 1: pierde clientes / demasiada demanda ═══
escena("noche", 3.6, "3 · Cuerpo 1", "A customer texts at 9:04 PM. Anyone answering?",
       "Azul noche. Pregunta 1 de 3. Un teléfono bloqueado a las 9:04 PM; del teléfono salen dos mensajes de clientes («Can I get a quote?», «Any openings tomorrow?») y queda la etiqueta roja «2 unanswered».",
       "navy",
       rastreo(1)
       + '<div class="halo-color" style="top:70cqw;--ancho:100cqw;--hc:rgba(75,107,255,.4)"></div>'
       + deco("esfera", 90, 52, 8, 0.4, c1="#c7d4ff", c2="#4b6bff", c3="#1d2f8f") + deco("destello", 10, 72, 4, 0.6, c1="#ffd166")
       + cap(["A customer texts", "at 9:04 PM.", '<span class="color-oro">Anyone answering?</span>'], estilo="font-size:9cqw")
       + telefono(58, 48, pant_bloqueo("9:04"), "--ry0:16deg;--ry1:8deg;--rz0:3deg;--rz1:1deg;--brillo-tel:rgba(75,107,255,.55)")
       + f'<div class="noti-g encima" style="top:92cqw;--d:.6s"><span class="app" style="background:linear-gradient(140deg,#3ee07f,#12a54e)">{ic("whatsapp-logo")}</span>'
       '<span><span class="de">WhatsApp · now</span><b>Can I get a quote?</b></span></div>'
       + f'<div class="noti-g encima" style="top:109cqw;--d:1.1s"><span class="app" style="background:linear-gradient(140deg,#feda75,#d62976 50%,#4f5bd5)">{ic("instagram-logo")}</span>'
       '<span><span class="de">Instagram · 2m</span><b>Any openings tomorrow?</b></span></div>'
       + f'<div class="sin-responder encima" style="left:33cqw;top:126.5cqw;--d:1.9s">{ic("warning-circle")} 2 unanswered</div>',
       "notificacion@0.6/-22 notificacion@1.1/-24 grave@1.9/-24", ("lado", "lavanda"),
       voz="One: texts at night. Is anyone answering?")


def fila_d(d, icono, color, titulo, sub):
    return (f'<div class="fila-b real" style="--d:{d}s"><span class="av" style="background:{color};color:#fff">{ic(icono)}</span>'
            f'<span><b>{titulo}</b><small>{sub}</small></span></div>')


escena("demanda", 4.2, "3 · Cuerpo 1", "More calls and orders than you can handle?",
       "Lavanda. Pregunta 2 de 3. La bandeja se llena sola: pedidos, citas, presupuestos y llamadas perdidas; el contador rojo de la bandeja sube hasta 38.",
       "lavanda",
       rastreo(2, oscuro=True)
       + deco("esfera", 92, 44, 7, 0.4, c1="#e6ddff", c2="#9b86c9", c3="#5d4f86") + deco("rejilla-d", 12, 138, 14, 0.5, c1="rgba(91,43,255,.35)")
       + cap(["More calls", "and orders than", '<span class="color-violeta">you can handle?</span>'], estilo="font-size:10cqw")
       + '<div class="tarjeta-pro bandeja" style="top:58cqw;--d:.15s">'
       '<div class="cab-b"><b>Inbox</b><span class="insignia-roja en-linea" style="--d:.3s"><span class="cuenta" style="--hasta:38;--d:.35s;--dc:2.2s"></span></span></div>'
       + fila_d(0.45, "shopping-cart", "linear-gradient(140deg,#ff9a5c,#e8173a)", "New order #1042", "Pickup at 7:30 PM")
       + fila_d(0.75, "calendar-check", "linear-gradient(140deg,#8a63ff,#5b2bff)", "Booking request", "Saturday, 2:00 PM")
       + fila_d(1.05, "hammer", "linear-gradient(140deg,#ffcf5c,#f59200)", "Quote request", "Kitchen remodel")
       + fila_d(1.35, "phone", "linear-gradient(140deg,#5ad1ff,#2563eb)", "Missed call", "3 times, same number")
       + "</div>"
       ,
       "bandeja@0.3:2.2 notificacion@1.4/-26", ("circulo", "alarma", 91, 47),
       voz="Two: more calls and orders than you can handle?")

# ═══ 4 · Bucle abierto ═══
escena("bucle-pasa", 1.8, "4 · Bucle abierto", "Then what happens…",
       "Rojo oscuro. Un reloj de arena grande que se mece mientras la arena cae. Corte seco.",
       "alarma",
       '<div class="halo-color" style="top:60cqw;--ancho:110cqw;--hc:rgba(232,23,58,.45)"></div>'
       + deco("destello", 14, 60, 4, 0.5, c1="#ff9aa8", fl=2) + deco("destello", 88, 130, 5, 0.6, c1="#ffd166", fl=2.2)
       + cap(["Then what", "happens…"], d=-0.1, paso=0.12, clase="t-xl centrado", top=25, estilo="font-size:12.6cqw")
       + f'<div class="reloj-arena cae" style="left:50cqw;top:66cqw;width:30cqw;margin-left:-15cqw;--d:0s"><div>{RELOJ_ARENA}</div></div>',
       "subida@0:1.6/-30 reloj@0.2:1.4/-30", ("corte",),
       voz="Then what happens…")

# ═══ 5 · Cuerpo 2: la consecuencia y el dinero ═══
escena("competencia", 4.8, "5 · Cuerpo 2", "By morning, they hired your competitor.",
       "Blanco. Corte seco en el golpe. Dos conversaciones del mismo cliente: tu competencia le contestó a las 9:06 PM con el presupuesto (visto verde); tú contestaste a las 7:12 AM «Sorry, just saw this!» y el cliente ya contrató a otro (X roja).",
       "nieve",
       deco("esfera", 92, 46, 7, 0.5, c1="#ffd1d8", c2="#ff6b7d", c3="#a50f2a") + deco("cruz", 8, 140, 4, 0.8, c1="#e8173a")
       + cap(["By morning,", "they hired your", '<span class="rojo">competitor.</span>'], estilo="font-size:10cqw")
       + '<div class="conver" style="top:59.5cqw;--d:.25s;--rz:-1deg"><div class="quien"><i class="pto" style="background:#10b981"></i>Your competitor<b>9:06 PM</b></div>'
       '<div class="bur cliente" style="--d:.45s">Can I get a quote?</div><div class="bur de-ellos" style="--d:.85s">Sure! Here’s your quote.</div>'
       f'<span class="marca-r" style="background:#10b981;--dm:1.15s">{ic("check-circle")}</span></div>'
       + '<div class="conver" style="top:102.5cqw;--d:1.6s;--rz:1deg"><div class="quien"><i class="pto" style="background:#e8173a"></i>You<b>7:12 AM</b></div>'
       '<div class="bur tarde" style="--d:1.85s">Sorry, just saw this!</div><div class="bur cliente" style="--d:2.45s">Already hired someone.</div>'
       f'<span class="marca-r" style="background:#e8173a;--dm:2.8s">{ic("x-circle")}</span></div>',
       "sub@0/-21 notificacion@0.85/-25 pop@1.85/-28 grave@2.8/-22", ("abajo", "ambar"),
       voz="By morning, they already hired your competitor.")

escena("dinero", 5.4, "5 · Cuerpo 2", "Ready to invest… but not sure where it works best? Ads? Website? Social media?",
       "Ámbar. Pregunta 3 de 3. Una pila de monedas de oro (la de arriba salta) y tres caminos punteados hacia tres tarjetas con su signo de pregunta: «Ads?», «Website?», «Social media?».",
       "ambar",
       rastreo(3, oscuro=True)
       + deco("destello", 90, 46, 5, 0.6, c1="#fff") + deco("anillo-d", 8, 138, 12, 0.4, c1="rgba(20,17,42,.18)")
       + cap(["Ready to invest…", '<span class="ligera">but not sure where</span>', '<span class="ligera">it works best?</span>'], estilo="font-size:9cqw")
       + f'<div class="monedas" style="left:5cqw;top:76cqw;width:28cqw;--d:.2s">{MONEDAS}</div>'
       + '<svg class="lineas-dinero" viewBox="0 0 100 177.78" aria-hidden="true">'
       + "".join(f'<path d="M33 96 C36 96 34 {y} 37 {y}" style="--d:{d}s"/>' for y, d in ((69, 1.0), (89, 1.3), (109, 1.6))) + "</svg>"
       + "".join(f'<div class="opcion" style="top:{t}cqw;--d:{d}s"><span class="tile" style="background:{c}">{ic(i)}</span><b>{txt}</b><span class="q">?</span></div>'
                 for t, d, c, i, txt in ((62, 1.0, "linear-gradient(140deg,#ff7aa8,#e11d74)", "megaphone", "Ads"),
                                          (82, 1.3, "linear-gradient(140deg,#8a63ff,#5b2bff)", "globe", "Website"),
                                          (102, 1.6, "linear-gradient(140deg,#ff9a5c,#f59200)", "instagram-logo", "Social media"))),
       "moneda@0.3/-24 burbuja@1.0/-27 burbuja@1.3/-28 burbuja@1.6/-29", ("circulo", "menta", 24, 52),
       voz="Three: ready to invest… but not sure where it works best?")

# ═══ 6 · Bucle abierto ═══
escena("bucle-buenas", 1.8, "6 · Bucle abierto", "Here's the good news.",
       "Menta. Un destello grande que gira y se abre en destellos chicos. Corte seco.",
       "menta",
       "".join(deco("destello", x, y, s, d, c1=c, fl=1.6) for x, y, s, d, c in ((18, 52, 6, 0.1, "#fff"), (82, 60, 5, 0.2, "#fff"), (14, 118, 4, 0.3, "#14112a"), (86, 112, 6, 0.25, "#fff"), (50, 136, 4, 0.35, "#fff")))
       + f'<div class="icono-pro escala" style="top:30cqw;--ancho:34cqw;height:34cqw;--c:#fff;--d:0s"><div style="width:100%;height:100%;animation:p-gira-lento 1.8s ease-in-out both">{ic("sparkle")}</div></div>'
       + cap(["Here’s the", "good news."], d=-0.05, paso=0.12, clase="t-xl centrado", top=74, estilo="font-size:12.6cqw"),
       "brillo@0.1/-22 campanita@0.25/-26", ("corte",),
       voz="Here's the good news.")


# ═══ 7 · Cuerpo 3: la respuesta ═══
def arreglo_g(d, icono, color, sub, texto):
    return (f'<div class="arreglo-g" style="--d:{d}s"><span class="tile" style="--tc:{color}">{ic(icono)}</span>'
            f'<span><small>{sub}</small><b>{texto}</b></span><span class="ok-a">{ic("check-circle")}</span></div>')


escena("arreglos", 4.8, "7 · Cuerpo 3", "Every yes has a fix. Texts at night: an AI assistant answers 24/7. Too much demand: a website that takes orders and bookings. Money to invest: a clear plan for every dollar.",
       "Uva. «Every yes has a fix.» y tres tarjetas grandes, una por pregunta, cada una con su visto verde.",
       "uva",
       deco("esfera", 90, 40, 9, 0.4, c1="#ffd1f5", c2="#c03fd9", c3="#5a1270") + deco("anillo-d", 10, 146, 10, 0.6, c1="rgba(255,255,255,.35)")
       + deco("destello", 93, 128, 5, 1.0, c1="#ffd166")
       + cap(["Every yes", '<span class="ligera">has a fix.</span>'], d=0.0, clase="t-xl", estilo="font-size:12cqw")
       + '<div class="arreglos-3" style="top:52cqw">'
       + arreglo_g(0.6, "chat-teardrop-text", "linear-gradient(140deg,#5ef0c9,#0a9e7f)", "Texts at night", "An AI assistant answers&nbsp;24/7")
       + arreglo_g(1.2, "calendar-check", "linear-gradient(140deg,#8a63ff,#5b2bff)", "Too much demand", "A website that takes orders and bookings")
       + arreglo_g(1.8, "coins", "linear-gradient(140deg,#ffcf5c,#f59200)", "Money to invest", "A clear plan for every&nbsp;dollar")
       + "</div>",
       "burbuja@0.6/-25 cristal@0.95:0/-27 burbuja@1.2/-26 cristal@1.55:2/-27 burbuja@1.8/-27 cristal@2.15:4/-27", ("lado", "hielo"),
       voz="Every yes has a fix. We handle all three.")

escena("redes", 7.2, "7 · Cuerpo 3", "We run your social media and your ads. Your daily ad budget: from $5 a day. You pick. Paid to Meta. Goal: calls, bookings, orders.",
       "Azul hielo. Un teléfono derecho, a la izquierda, con un feed donde salen publicaciones solas; a la derecha, «Posted for you» con Instagram y Facebook. Después entra la tarjeta del presupuesto diario de anuncios: sube de $1 a $5 al día, «You pick. Paid to Meta.», y abajo la meta: llamadas, citas, pedidos.",
       "hielo",
       deco("esfera", 92, 48, 7, 0.4, c1="#e3eeff", c2="#7aa7ff", c3="#2353c4")
       + cap(["We run your", "social media", '<span class="ligera">and your ads.</span>'], estilo="font-size:10.6cqw")
       + '<div class="tel-escala" style="left:8cqw;top:62cqw;width:48cqw;transform:scale(.62)">'
       + telefono(0, 48, PANT_FEED, "--ry0:0deg;--ry1:0deg;--rx0:0deg;--rx1:0deg;--rz0:0deg;--rz1:0deg;--brillo-tel:rgba(37,99,235,.3)") + '</div>'
       + f'<div class="posteado" style="left:45cqw;top:62cqw;--d:1.0s">{ic("instagram-logo")}{ic("facebook-logo")} Posted for you</div>'
       + '<div class="presupuesto" style="left:45cqw;top:74cqw;--d:2.8s"><small>Daily ad budget</small>'
       '<div class="monto-p">$<span class="cuenta" style="--desde:1;--hasta:5;--d:3.2s;--dc:.9s"></span><span class="chico">/ day</span></div>'
       '<div class="riel" style="--desde-p:0%;--hasta-p:16.7%;--d:3.2s;--dc:.9s"><i class="lleno"></i><b class="perilla"></b></div>'
       '<div class="nota-p">You pick it. Paid straight to Meta.</div></div>'
       + f'<div class="meta-chips" style="top:128cqw"><em style="--d:4.3s">Goal</em><span style="--d:4.4s">{ic("phone")} Calls</span>'
       f'<span style="--d:4.55s">{ic("calendar-check")} Bookings</span><span style="--d:4.7s">{ic("shopping-cart")} Orders</span></div>',
       "pop@0.6/-28 notificacion@1.0/-26 pop@1.6/-29 golpe-suave@2.8:2/-25 burbuja@3.2/-28 burbuja@3.5/-29 burbuja@3.8/-30 brillo@4.4/-26", ("abajo", "grafito"),
       voz="We run your social media and ads. Your budget starts at five dollars a day.")

escena("auditoria", 6.0, "7 · Cuerpo 3", "Before you spend a dollar: our $99 audit. Google, Maps & AI · Your website · You vs. competitors · Plan with deadlines.",
       "Grafito. «Before you spend a dollar: our $99 audit.» El informe en PDF se abre (dos hojas se abren en abanico detrás) y muestra lo que trae; al lado cae un sello dorado de $99.",
       "grafito",
       '<div class="halo-color" style="top:70cqw;--ancho:110cqw;--hc:rgba(123,77,255,.45)"></div>'
       + deco("destello", 10, 62, 4, 0.6, c1="#ffd166") + deco("destello", 90, 140, 5, 0.9, c1="#fff")
       + cap(["Before you spend", "a dollar:"], d=0.0, clase="t-l", estilo="font-size:10.6cqw")
       + cap(['<span class="ligera">our</span> <span class="color-oro">$99 audit.</span>'], d=0.35, clase="t-l", top=47, estilo="font-size:10.6cqw")
       + '<div class="informe" style="top:64cqw;left:7cqw;margin-left:0;width:58cqw;--d:.55s"><i class="hoja h2"></i><i class="hoja h3"></i><div class="portada-i">'
       '<div class="franja"><small>Full Diagnostic · PDF</small><b>Your business, end to end</b></div><div class="cuerpo-i">'
       + "".join(f'<div class="linea-i" style="--d:{d}s">{ic(i)}{t}</div>' for d, i, t in (
           (1.4, "magnifying-glass", "Google, Maps &amp; AI"), (1.8, "globe", "Your website"),
           (2.2, "users-three", "You vs. competitors"), (2.6, "calendar-check", "Plan with deadlines")))
       + "</div></div></div>"
       + '<div class="sello-99" style="left:86cqw;top:80cqw;--d:1.15s"><b>$99</b><small>One payment</small></div>',
       "golpe-suave@0.55:2/-24 sello@1.15/-18 burbuja@1.4/-29 burbuja@1.8/-30 burbuja@2.2/-30 burbuja@2.6/-31", ("lado", "crema"),
       voz="Before you spend a dollar, get our ninety-nine dollar audit.")


def fila_c(d, txt, tu, ellos):
    return (f'<div class="fila-c"><span>{txt}</span><span class="barras-c"><i class="tu" style="--w:{tu}%;--d:{d}s"></i>'
            f'<i class="ellos" style="--w:{ellos}%;--d:{d + 0.12:.2f}s"></i></span></div>')


escena("comparacion", 6.6, "7 · Cuerpo 3", "You vs. your competitors. A plan with deadlines. Week 1: Google profile fixed. Week 2: fast replies set up. Week 4: ads running.",
       "Crema. Una página del informe (marcada como ejemplo): tus barras contra las del mejor competidor en Google, reseñas y redes; abajo, el plan con fechas: semana 1, 2 y 4, cada una con su visto.",
       "crema",
       deco("esfera", 92, 46, 7, 0.4, c1="#fff3d6", c2="#ffc53d", c3="#c47a00")
       + cap(["You vs. your", "competitors."], d=0.0, clase="t-l", estilo="font-size:10.6cqw")
       + cap(['<span class="ligera">A plan with</span> deadlines.'], d=0.25, clase="t-m", top=47)
       + '<div class="tarjeta-pro comparar" style="top:59cqw;--d:.3s"><div class="cab-c2"><span>You vs. competitors</span><span class="etiqueta-ejemplo">Example</span></div>'
       '<div class="leyenda"><span><i style="background:#6e3bff"></i>You</span><span><i style="background:#c9c5da"></i>Best competitor</span></div>'
       + fila_c(0.8, "Google", 34, 88) + fila_c(1.1, "Reviews", 46, 92) + fila_c(1.4, "Social media", 22, 74)
       + "</div>"
       + '<div class="tarjeta-pro plan-f" style="top:100.5cqw;--d:2.6s"><div class="cab-c2"><span>Your plan</span><span class="etiqueta-ejemplo">Example</span></div>'
       + "".join(f'<div class="paso-f" style="--d:{d}s"><span class="sem">{s}</span><b>{t}</b><span class="chk">{ic("check-circle")}</span></div>'
                 for d, s, t in ((3.0, "WEEK 1", "Google profile fixed"), (3.5, "WEEK 2", "Fast replies set up"), (4.0, "WEEK 4", "Ads running")))
       + "</div>",
       "datos@0.8/-30 golpe-suave@2.6:2/-26 cristal@3.0:0/-27 cristal@3.5:2/-27 cristal@4.0:4/-27", ("abajo", "rosa"),
       voz="We compare you with your competitors, and give you a plan with deadlines.")

escena("trabajo", 3.6, "7 · Cuerpo 3", "Real websites we built. Pachy Pinchos · Restaurant. Denali CRT · Clinic. Delivery Rush · Delivery.",
       "Rosa claro. Tres teléfonos lado a lado (el del medio un poco más arriba) con capturas reales de sitios hechos por Judo: Pachy Pinchos (restaurante), Denali CRT (clínica) y Delivery Rush (reparto).",
       "rosa",
       deco("destello", 90, 46, 5, 0.5, c1="#ff4fa0")
       + cap(["Real websites", '<span class="ligera">we built.</span>'], d=0.0, clase="t-xl", estilo="font-size:11cqw")
       + '<div class="trabajo" style="top:51cqw">'
       + "".join(f'<div class="tel-t" style="left:{x}cqw;top:{t}cqw;width:25cqw;margin-left:-12.5cqw;z-index:{z};--d:{d}s;--r:{r}deg;--r0:{r * 2}deg"><div class="marco-t"><img src="img/trabajo/{img}.jpg" alt="{n}"></div><p>{n}<small>{k}</small></p></div>'
                 for x, t, z, d, r, img, n, k in ((20.5, 4, 1, 0.3, 0, "pachy", "Pachy Pinchos", "Restaurant"), (73.5, 4, 1, 0.5, 0, "deliveryrush", "Delivery Rush", "Delivery"), (47, 0, 2, 0.4, 0, "denali", "Denali CRT", "Clinic")))
       + "</div>",
       "pop@0.3/-27 pop@0.4/-28 pop@0.5/-29 brillo@0.9/-27", ("lado", "durazno"),
       voz="Sites we built for real businesses.")

escena("promesa", 6.0, "7 · Cuerpo 3", "Our promise: better service than you have now. A real person on WhatsApp · A plan with dates · Cancel anytime.",
       "Durazno. «Our promise: better service than you have now.» Una conversación de WhatsApp con Judo Marketing: un cliente pide revisar su negocio y una persona contesta. Abajo, tres garantías: una persona real por WhatsApp, un plan con fechas y cancelar cuando quiera.",
       "durazno",
       deco("esfera", 92, 46, 7, 0.4, c1="#fff1e6", c2="#ff9a5c", c3="#c2410c")
       + cap(["Our promise:", '<span class="ligera">better service</span>', '<span class="ligera">than you have now.</span>'], estilo="font-size:9cqw")
       + '<div class="tarjeta-pro chat-judo" style="top:54cqw;--d:.3s">'
       f'<div class="cab-j"><span class="av">{ic("whatsapp-logo")}</span><span><b>Judo Marketing</b><small>Miami · a real person</small></span></div>'
       '<div class="bur cli" style="--d:.7s">Hi! Can you check my&nbsp;business?</div>'
       '<div class="bur judo" style="--d:1.4s">Of course! I’m on it.</div></div>'
       + '<div class="garantias" style="top:109cqw">'
       + "".join(f'<span style="--d:{d}s">{ic(i)} {t}</span>' for d, i, t in ((2.4, "user-circle", "A real person on WhatsApp"), (3.0, "calendar-check", "A plan with dates"), (3.6, "check-circle", "Cancel anytime")))
       + "</div>",
       "notificacion@0.7/-26 pop@1.4/-27 cristal@2.4:0/-27 cristal@3.0:2/-27 cristal@3.6:4/-27", ("abajo", "cierre"),
       voz="Our promise: better service than you have now. With a real person.")

# ═══ 8 · Llamado a la acción ═══
escena("cierre", 7.2, "8 · Llamado a la acción", "Said yes to any? Get your $99 audit. Tell us about your business. In 3 business days, your plan arrives as a PDF. judomarketing.net/diagnostic · Questions? WhatsApp +1 305 934 9981",
       "Mezcla de violeta, azul y rosa. Arriba, «Said yes to any?» cierra el juego de las preguntas. «Get your $99 audit.», qué pasa después de pagar (nos cuentas de tu negocio y en 3 días hábiles llega el plan en PDF), un solo botón dorado con la dirección y, abajo, el WhatsApp para preguntas. Queda quieto más de 4 segundos.",
       "cierre",
       deco("esfera", 88, 44, 8, 0.3, c1="#ffe0f0", c2="#ff4fa0", c3="#8a1250") + deco("anillo-d", 92, 126, 10, 0.5, c1="rgba(255,255,255,.3)")
       + deco("destello", 10, 140, 4, 0.8, c1="#ffd166")
       + f'<div class="kicker-v" style="--d:0s">{ic("check-circle")} Said yes to any?</div>'
       + cap(["Get your", '<span class="color-oro">$99 audit.</span>'], d=0.1, clase="t-xl", top=26.5, estilo="font-size:12.6cqw")
       + '<div class="cta-nota" style="top:57cqw;--d:.5s">Tell us about your business. In <b>3 business days</b>, your plan arrives as a&nbsp;PDF.</div>'
       + f'<div class="cta-boton" style="top:71cqw;right:7cqw;--d:.75s;font-size:4.2cqw">{ic("globe")} judomarketing.net/diagnostic</div>'
       + f'<div class="cta-wa" style="top:90cqw;--d:1.05s">{ic("whatsapp-logo")}<span><small>Questions? Message me</small>+1 305 934 9981</span></div>'
       + '<div class="logo-pro aparece" style="top:112cqw;left:8cqw;margin-left:0;--ancho:24cqw;--d:1.3s"><img src="img/judo-logo.webp" alt="Judo Marketing"></div>',
       "golpe-suave@0.3:2/-24 notificacion@1.05/-24 campanita@1.4/-26",
       voz="Said yes to any? Get your audit at judomarketing.net.")

html = cabeza + "<!-- ═══════════════ ESCENAS (las arma armar.py) ═══════════════ -->\n" + "\n\n".join(T) + \
    '\n\n<script type="application/json" id="escenas">\n' + json.dumps(ESC, ensure_ascii=False, indent=1) + "\n</script>\n\n" + pie
open(os.path.join(D, "storyboard.html"), "w", encoding="utf-8").write(html)
print(f"{len(ESC)} escenas, {sum(e['dur'] for e in ESC):.1f} s")
