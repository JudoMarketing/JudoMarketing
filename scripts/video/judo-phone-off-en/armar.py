# Arma storyboard.html del video «Turn off your phone» (Judo Marketing, en
# inglés), pedido por Junior en la Biblioteca el 13 de noviembre de 2026:
# «la misma estructura que todos los demás videos, no escatimes en recursos de
# diseño, muchos vectores y sombras; las voces de ElevenLabs deben coincidir
# con el timing del video».
# Sale del carrusel «Turn off your phone» (scripts/carrusel/judo-preguntas-en):
# las mismas 6 preguntas, los mismos datos y las mismas respuestas.
# Para cambiar el video: edita este archivo y corre
#   python3 armar.py && python3 build.py && node revisar.mjs
# Los estilos son base.html (plantilla de la skill judo-video-vertical) +
# pro.css (la capa pro) + diseno.css (el sistema de este video). Los iconos
# son Phosphor (licencia MIT, vectores/LICENSE.txt); los dibujos (teléfono,
# tienda, reloj de arena, periódico, etiqueta, mapa, globo) están aquí.
import json, os, re

D = os.path.dirname(os.path.abspath(__file__))
base = open(os.path.join(D, "base.html"), encoding="utf-8").read().replace('<html lang="es">', '<html lang="en">', 1)
base = re.sub(r"<title>.*?</title>", "<title>Video · Turn off your phone · Judo Marketing</title>", base)
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


def rastreo(n, oscuro=False):
    """El hilo del video: «Question n / 6» y seis segmentos; el de ahora se llena."""
    segs = "".join(f'<i class="{"hecho" if k < n - 1 else "ahora" if k == n - 1 else "falta"}"></i>' for k in range(6))
    return f'<div class="rastreo{" oscuro" if oscuro else ""}"><b>Question {n} / 6</b>{segs}</div>'


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
    '<linearGradient id="ra-arena" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#f59200"/></linearGradient></defs>'
    '<path class="arena-arriba" d="M24 24 H56 C54 40 44 50 40 56 C36 50 26 40 24 24 Z" fill="url(#ra-arena)"/>'
    '<path class="arena-abajo" d="M21 104 H59 C59 92 48 84 40 82 C32 84 21 92 21 104 Z" fill="url(#ra-arena)"/>'
    '<rect x="39.3" y="56" width="1.4" height="44" fill="#ffb224" opacity=".85"/>'
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


# ═══ 1 · Gancho ═══
PANT_APAGAR = ('<div class="fondo-apagado"></div>'
               f'<div class="riel-apagar"><span class="texto-riel">slide to power off</span><b class="perilla-apagar">{ic("power")}</b></div>'
               '<i class="cancelar-x"></i><i class="pantalla-negra" style="--d:1.2s"></i><i class="luz-apagado" style="--d:1.2s"></i>')

escena("apaga", 2.4, "1 · Gancho", "Turn off your phone.",
       "Noche violeta. El titular sube por líneas y se subraya «phone.». Un teléfono de verdad, inclinado y con reflejo, muestra «slide to power off»: el botón rojo se desliza solo y la pantalla se apaga con una raya de luz.",
       "noche",
       '<div class="puntos-fondo" style="--punto:rgba(185,162,255,.22)"></div>'
       + '<div class="halo-color" style="top:66cqw;--ancho:96cqw;--hc:rgba(123,77,255,.5)"></div>'
       + deco("destello", 14, 66, 5, 0.3, c1="#d9ccff", fl=2.4) + deco("destello", 86, 92, 4, 0.5, c1="#ffd166", fl=2.8)
       + deco("esfera", 85, 64, 9, 0.2, c1="#c9b6ff", c2="#7b4dff", c3="#3a1f9a") + deco("anillo-d", 12, 120, 12, 0.4, c1="rgba(185,162,255,.45)")
       + cap(["Turn off", '<span class="raya" style="--dr:.75s;--raya:#ff3b4f">your phone.</span>'], d=-0.25, paso=0.12, clase="t-xl", estilo="font-size:12.6cqw")
       + telefono(58, 54, PANT_APAGAR),
       "sub@0/-21 clic-suave@0.35/-26 apagar@1.2", ("circulo", "papel", 50, 63),
       voz="Turn off your phone.")

escena("sigue-vendiendo", 3.0, "1 · Gancho", "Is your business still selling?",
       "Papel. Una tienda de barrio dibujada con sombras: toldo a rayas, vidriera con productos, puerta, lámpara y dos matas. Son las 11:47 PM. El letrero de la puerta se columpia en «OPEN», se voltea a «CLOSED» y la tienda se apaga.",
       "papel",
       deco("esfera", 90, 48, 8, 0.3, c1="#ffe2a8", c2="#ffb224", c3="#c47a00") + deco("cruz", 10, 140, 4, 0.5, c1="#6e3bff")
       + cap(["Is your business", '<span class="raya" style="--dr:.85s">still selling?</span>'], d=0.0, clase="t-l", estilo="font-size:9.2cqw")
       + f'<div class="chip-hora" style="left:8cqw;top:47cqw;--d:.25s">{ic("clock")}11:47 PM</div>'
       + f'<div class="tienda" style="top:58cqw;--d:.05s">{tienda()}</div>'
       + '<div class="letrero encima" style="left:71.6cqw;top:93cqw"><div class="gira-l"><span class="cara abierto">OPEN</span><span class="cara cerrado">CLOSED</span></div></div>',
       "golpe-suave@0.15:0/-25 reloj@0.3:1.2 voltear@1.5", ("lado", "electrico"),
       voz="Is your business still selling?")

# ═══ 2 · Introducción ═══
escena("seis", 3.0, "2 · Introducción", "6 questions. Count your yeses.",
       "Violeta eléctrico. «6 questions.» y seis fichas numeradas que se levantan una tras otra, como teclas. Abajo, «Yes» y «No»: se enciende «Yes».",
       "electrico",
       deco("esfera", 88, 52, 10, 0.4, c1="#ffffff", c2="#b9a2ff", c3="#5b2bff") + deco("anillo-d", 9, 132, 14, 0.5, c1="rgba(255,255,255,.35)")
       + deco("destello", 90, 112, 5, 0.9, c1="#ffd166", fl=2.6)
       + cap(["6 questions."], d=-0.05, clase="t-xl", estilo="font-size:12.4cqw")
       + cap(['<span class="ligera">Count your</span> yeses.'], d=0.2, clase="t-m", top=39.5)
       + '<div class="fichas-6" style="top:58cqw">' + "".join(f'<span class="ficha-n" style="--d:{0.35 + i * 0.09:.2f}s">{i + 1}</span>' for i in range(6)) + "</div>"
       + f'<div class="si-no" style="top:114cqw"><span style="--d:1.05s">{ic("check-circle")} Yes<b class="si-on" style="--don:1.85s">{ic("check-circle")} Yes</b></span>'
       f'<span style="--d:1.15s">{ic("x-circle")} No</span></div>',
       " ".join(f"burbuja@{0.35 + i * 0.09:.2f}/{-25 - i}" for i in range(6)) + " clic-suave@1.85/-24 cristal@1.9:4/-25", ("abajo", "lavanda"),
       voz="Six questions. Count your yeses.")


# ═══ 3 · Cuerpo 1 ═══
def fila_b(d, clase, av, nombre, texto, extra="", etq=""):
    return (f'<div class="fila-b {clase}" style="--d:{d}s{extra}"><span class="av">{av}</span><span><b>{nombre}</b><small>{texto}</small></span>{etq}</div>')


escena("bots", 3.6, "3 · Cuerpo 1", "Is your contact form full of bots?",
       "Lavanda. El rastreador marca la pregunta 1. La bandeja del formulario de contacto se llena: el globo rojo cuenta hasta 38 y caen mensajes de bots; al fondo, enterrado, el de una clienta real («Can I get a kitchen quote?»), que se enciende.",
       "lavanda",
       rastreo(1, oscuro=True)
       + deco("esfera", 92, 44, 7, 0.4, c1="#e6ddff", c2="#9b86c9", c3="#5d4f86") + deco("rejilla-d", 12, 138, 14, 0.5, c1="rgba(91,43,255,.35)")
       + cap(["Is your", "contact form", '<span class="color-violeta">full of bots?</span>'], estilo="font-size:10cqw")
       + '<div class="tarjeta-pro bandeja" style="top:59cqw;--d:.15s">'
       '<div class="cab-b"><b>Inbox</b><small>Contact form</small></div>'
       + fila_b(0.5, "bot", ic("robot"), "bot_4471", "Cheap backlinks 4 u!!!")
       + fila_b(0.75, "bot", ic("robot"), "promo-bot", "You won a free cruise!")
       + fila_b(1.0, "bot", ic("robot"), "xx_crypto", "Double your money today")
       + fila_b(1.3, "real", "M", "María G.", "Can I get a kitchen quote?", ";--dac:2.05s", '<em class="etq-real">Real customer</em>')
       + "</div>"
       + '<div class="insignia-roja" style="left:85cqw;top:63cqw;--d:.35s"><span class="cuenta" style="--hasta:38;--d:.4s;--dc:1.5s"></span></div>'
       + f'<div class="burbuja-bot" style="left:92cqw;top:86cqw;--tam:11cqw;--d:.85s"><div>{ic("robot")}</div></div>'
       + f'<div class="burbuja-bot" style="left:7cqw;top:127cqw;--tam:10cqw;--d:1.1s"><div style="animation-delay:.4s">{ic("robot")}</div></div>',
       "golpe-suave@0.15:0/-25 bandeja@0.4:1.5 notificacion@2.05/-23", ("lado", "ciruela"),
       voz="One: is your contact form full of bots?")

escena("espera", 3.6, "3 · Cuerpo 1", "To change a price, do you wait on someone?",
       "Ciruela. Pregunta 2. Un chat de vidrio con quien te hace la página: el lunes pides cambiar el precio del combo, te dicen «esta semana»; el reloj de arena se voltea y el jueves todavía preguntas. Visto, sin respuesta.",
       "ciruela",
       rastreo(2)
       + deco("esfera", 8, 140, 9, 0.5, c1="#ffc1e3", c2="#c03fd9", c3="#5a1270") + deco("destello", 92, 132, 4, 0.8, c1="#ffd166")
       + cap(["To change a price,"], d=0.0, clase="t-m", top=23.5)
       + cap(["do you wait", '<span class="color-oro">on someone?</span>'], d=0.12, clase="t-l", top=33)
       + '<div class="tarjeta-pro oscura chat-pro" style="top:60cqw;--d:.15s">'
       f'<div class="cab-c"><span class="av">{ic("user")}</span><span><b>Web designer</b><small>last seen Monday</small></span></div>'
       '<div class="dia" style="--d:.35s">MON · 9:02 AM</div>'
       '<div class="globo-c yo" style="--d:.45s">Can you change the combo price?</div>'
       '<div class="globo-c el" style="--d:1.0s">I’ll do it this week!</div>'
       '<div class="dia" style="--d:1.75s">THU · 4:15 PM</div>'
       '<div class="globo-c yo" style="--d:1.9s">Any luck?<span class="visto">Seen</span></div>'
       "</div>"
       + f'<div class="reloj-arena" style="left:80cqw;top:57cqw;--d:.3s"><div>{RELOJ_ARENA}</div></div>',
       "pop@0.45/-27 pop@1.0/-29 reloj@1.15:0.6/-30 golpe-suave@2.1:1/-26 pop@1.9/-27", ("circulo", "alarma", 88.5, 40),
       voz="Two: to change a price, do you wait on someone?")

# ═══ 4 · Bucle abierto ═══
escena("bucle-noticia", 1.8, "4 · Bucle abierto", "#3 made the news…",
       "Rojo oscuro. Llega girando un periódico con la franja roja de última hora y un escudo de alerta en la foto. Corte seco.",
       "alarma",
       '<div class="halo-color" style="top:62cqw;--ancho:110cqw;--hc:rgba(232,23,58,.45)"></div>'
       + deco("destello", 14, 60, 4, 0.6, c1="#ff9aa8", fl=2) + deco("destello", 88, 134, 5, 0.7, c1="#ffd166", fl=2.2)
       + cap(["#3 made", "the news…"], d=-0.1, paso=0.12, clase="t-xl centrado", top=25, estilo="font-size:12.6cqw")
       + f'<div class="periodico" style="top:76cqw;--d:.05s">{PERIODICO}</div>',
       "sirena-suave@0:1.8 golpe-suave@0.95:1/-22", ("corte",),
       voz="Number three made the news…")

# ═══ 5 · Cuerpo 2 ═══
escena("php", 4.8, "5 · Cuerpo 2", "PHP2Shell. Is yours patched? Critical, 9.2 / 10. 7 in 10 websites run PHP.",
       "Blanco con luz roja arriba. Pregunta 3. Corte seco en el golpe. La alerta de seguridad del 21 de octubre de 2026: PHP2Shell puede abrir tu servidor sin contraseña; la aguja sube a 9,2 de 10, crítica. Abajo, una dona se llena: 7 de cada 10 sitios usan PHP (W3Techs).",
       "nieve",
       rastreo(3, oscuro=True)
       + deco("esfera", 92, 46, 7, 0.5, c1="#ffd1d8", c2="#ff6b7d", c3="#a50f2a") + deco("cruz", 92, 100, 4, 0.8, c1="#e8173a")
       + cap(['<span class="rojo">PHP2Shell.</span>'], d=0.0, clase="t-xl", estilo="font-size:12.4cqw")
       + cap(['<span class="ligera">Is yours</span> patched?'], d=0.15, clase="t-m", top=38)
       + '<div class="tarjeta-pro alerta" style="top:51cqw;--d:.25s">'
       f'<div class="cab-a"><span class="ic-a">{ic("shield-warning")}</span><span><small>Alert · Oct 21,&nbsp;2026</small><b>PHP2Shell</b></span></div>'
       "<p>A PHP flaw that can open your server without a password.</p>"
       f'<div class="medidor">{MEDIDOR}<div class="valor aparece" style="--d:1.9s"><b>9.2<small> / 10</small></b><span>Critical</span></div></div></div>'
       + f'<div class="tarjeta-pro dona-t" style="top:108cqw;--d:1.7s">{DONA}<div><b>7 in 10</b><p>websites run PHP</p><small>Source: W3Techs</small></div></div>',
       "sub@0/-21 notificacion@0.35/-25 subida@0.9:1.3/-30 golpe-suave@1.95:1/-24 burbuja@2.0/-27 cristal@3.1:1/-26", ("abajo", "navy"),
       voz="PHP2Shell. Seven in ten sites run PHP. Is yours patched?")

PANT_BLOQUEO = ('<div class="fondo-bloqueo"></div>'
                f'<div class="hora-bloqueo"><small>{ic("lock-simple")} Tuesday</small><b>11:47</b></div>')

escena("sin-responder", 3.6, "5 · Cuerpo 2", "When you don't answer, do sales stop?",
       "Azul noche. Pregunta 4. Un teléfono bloqueado a las 11:47; del teléfono salen dos mensajes de clientes («Any openings tomorrow?», «How much is it?») y queda la etiqueta roja «2 unanswered».",
       "navy",
       rastreo(4)
       + '<div class="halo-color" style="top:70cqw;--ancho:100cqw;--hc:rgba(75,107,255,.4)"></div>'
       + deco("esfera", 90, 52, 8, 0.4, c1="#c7d4ff", c2="#4b6bff", c3="#1d2f8f") + deco("destello", 10, 72, 4, 0.6, c1="#ffd166")
       + cap(["When you", "don’t answer,", '<span class="color-oro">do sales stop?</span>'], estilo="font-size:10cqw")
       + telefono(60, 48, PANT_BLOQUEO, "--ry0:16deg;--ry1:8deg;--rz0:3deg;--rz1:1deg;--brillo-tel:rgba(75,107,255,.55)")
       + f'<div class="noti-g encima" style="top:94cqw;--d:.75s"><span class="app" style="background:linear-gradient(140deg,#3ee07f,#12a54e)">{ic("whatsapp-logo")}</span>'
       '<span><span class="de">WhatsApp · now</span><b>Any openings tomorrow?</b></span></div>'
       + f'<div class="noti-g encima" style="top:111cqw;--d:1.3s"><span class="app" style="background:linear-gradient(140deg,#feda75,#d62976 50%,#4f5bd5)">{ic("instagram-logo")}</span>'
       '<span><span class="de">Instagram · 2m</span><b>How much is it?</b></span></div>'
       + f'<div class="sin-responder encima" style="left:8cqw;top:128.5cqw;--d:2.1s">{ic("warning-circle")} 2 unanswered</div>',
       "notificacion@0.75/-22 notificacion@1.3/-24 grave@2.1/-24", ("circulo", "ambar", 50, 72),
       voz="Four: when you don't answer, do sales stop?")

# ═══ 6 · Bucle abierto ═══
escena("bucle-precio", 1.8, "6 · Bucle abierto", "#5 costs less than you think…",
       "Ámbar. Una etiqueta de precio cuelga de su hilo y se columpia. Corte seco.",
       "ambar",
       deco("destello", 22, 70, 6, 0.3, c1="#fff", fl=1.8) + deco("destello", 80, 96, 4, 0.5, c1="#fff", fl=2.1)
       + deco("esfera", 86, 128, 9, 0.2, c1="#fff3d6", c2="#ffd166", c3="#d98a00") + deco("anillo-d", 14, 118, 12, 0.3, c1="rgba(20,17,42,.18)")
       + cap(["#5 costs less", '<span class="ligera">than you think…</span>'], d=-0.1, paso=0.12, clase="t-l centrado", top=25, estilo="font-size:9.6cqw")
       + f'<div class="etiqueta-precio" style="top:54cqw">{ETIQUETA}</div>',
       "subida@0:1.6/-30 campanita@0.35", ("corte",),
       voz="Five costs less than you think…")

# ═══ 7 · Cuerpo 3 ═══
escena("anuncios", 4.8, "7 · Cuerpo 3", "Want to run ads, but don't know where to start? $5 a day.",
       "Menta. Pregunta 5. Corte seco en el golpe. Una tarjeta de anuncio de ejemplo: el presupuesto diario sube de $1 a $5, el lugar es Miami a 10 millas (un mapa dibujado con su radio) y un cursor toca «Publish ad».",
       "menta",
       rastreo(5, oscuro=True)
       + deco("esfera", 92, 50, 8, 0.4, c1="#e4fff6", c2="#5ef0c9", c3="#067a62") + deco("cruz", 6, 140, 4, 0.6, c1="#14112a")
       + cap(["Want to run ads,", '<span class="ligera">but don’t know</span>', '<span class="ligera">where to start?</span>'], estilo="font-size:9.2cqw")
       + '<div class="tarjeta-pro anuncio" style="top:55cqw;--d:.15s"><div class="cab-ui"><span>New ad · Daily budget</span><span class="etiqueta-ejemplo">Example</span></div>'
       '<div class="monto">$<span class="cuenta" style="--desde:1;--hasta:5;--d:.55s;--dc:1s"></span><small> / day</small></div>'
       '<div class="riel" style="--desde-p:0%;--hasta-p:16.7%;--d:.55s;--dc:1s"><i class="lleno"></i><b class="perilla"></b></div>'
       f'<div class="lugar" style="--d:1.15s"><span class="mapa-mini">{MAPA}</span><span><b>Miami · 10 mi</b><small>Who sees it</small></span></div>'
       f'<div class="boton-pub" style="--d:1.35s;--dt:2.75s">{ic("megaphone")} Publish ad<i class="onda"></i><span class="listo-pub">{ic("check-circle")} Ad ready</span></div></div>'
       + f'<div class="mano encima" style="left:55cqw;top:120cqw;--d:1.6s">{ic("hand-pointing")}</div>',
       "burbuja@0.6/-28 burbuja@0.85/-29 burbuja@1.1/-30 burbuja@1.35/-31 clic-suave@2.75/-22 brillo@3.05/-24", ("lado", "hielo"),
       voz="Want ads, but don't know where to start? Test with five dollars a day.")

escena("visitas", 3.6, "7 · Cuerpo 3", "How many people visited your site this week?",
       "Azul hielo. Pregunta 6. El tablero de visitas de la semana tiene las barras vacías, punteadas; en medio late un signo de pregunta. Abajo: «You’re paying blind.»",
       "hielo",
       rastreo(6, oscuro=True)
       + deco("esfera", 92, 48, 7, 0.4, c1="#e3eeff", c2="#7aa7ff", c3="#2353c4") + deco("rejilla-d", 90, 138, 12, 0.6, c1="rgba(37,99,235,.35)")
       + cap(["How many people", "visited your site", '<span class="ligera">this week?</span>'], estilo="font-size:8.6cqw")
       + '<div class="tarjeta-pro visitas" style="top:54cqw;--d:.15s"><div class="cab-v"><span>Website visits</span><span>This week</span></div>'
       '<div class="total-v">No data<small>yet</small></div>'
       '<div class="barras-v">' + "".join(f'<i style="--h:{h}%;--d:{0.4 + k * 0.06:.2f}s"></i>' for k, h in enumerate((42, 66, 50, 82, 58, 36, 72))) + "</div>"
       '<div class="dias-v">' + "".join(f"<span>{dd}</span>" for dd in "MTWTFSS") + "</div></div>"
       + f'<div class="pregunta-grande" style="left:46cqw;top:94cqw;--d:.9s">{ic("question-mark")}</div>'
       + f'<div class="ciego" style="top:122cqw;--d:1.7s">{ic("eye-slash")} You’re paying blind.</div>',
       "golpe-suave@0.15:2/-26 bloop-baja@0.9/-26 grave@1.7/-25", ("circulo", "uva", 46, 53),
       voz="Six: how many people visited your site this week?")

ARREGLOS = [
    (1.65, "shield-check", "linear-gradient(140deg,#8a63ff,#5b2bff)", "Bot-proof forms"),
    (2.55, "tag", "linear-gradient(140deg,#ffcf5c,#f59200)", "You change your prices"),
    (3.65, "cloud-check", "linear-gradient(140deg,#5ad1ff,#2563eb)", "No PHP, daily backups"),
    (5.6, "chat-teardrop-text", "linear-gradient(140deg,#5ef0c9,#0a9e7f)", "Juditos answer 24/7"),
    (7.15, "img/juditoads.webp", None, "Guided ads"),
    (8.0, "chart-line-up", "linear-gradient(140deg,#ff7aa8,#e11d74)", "Visits in your portal"),
]


def arreglo(i, d, icono, color, texto):
    figura = f'<img src="{icono}" alt="">' if "/" in icono else ic(icono)
    estilo = f";--tc:{color}" if color else ""
    return (f'<div class="arreglo" style="--d:{d}s"><span class="tile" style="{estilo[1:]}">{figura}</span><b>{texto}</b>'
            f'<span class="n">0{i}</span><span class="ok-a">{ic("check-circle")}</span></div>')


escena("arreglos", 10.8, "7 · Cuerpo 3", "Every yes has a fix: bot-proof forms, you change your prices, no PHP with daily backups, Juditos answer 24/7, guided ads, visits in your portal.",
       "Uva. «Every yes has a fix.» y seis respuestas que entran desde la izquierda, cada una cuando la voz la nombra, con su ficha de color y un visto verde.",
       "uva",
       deco("esfera", 90, 40, 9, 0.4, c1="#ffd1f5", c2="#c03fd9", c3="#5a1270") + deco("anillo-d", 10, 146, 10, 0.6, c1="rgba(255,255,255,.35)")
       + deco("destello", 93, 104, 5, 1.0, c1="#ffd166") + deco("destello", 92, 18, 3, 1.2, c1="#fff")
       + cap(["Every yes", '<span class="ligera">has a fix.</span>'], d=0.0, clase="t-xl", estilo="font-size:12cqw")
       + '<div class="arreglos" style="top:51cqw">' + "".join(arreglo(i + 1, *a) for i, a in enumerate(ARREGLOS)) + "</div>",
       " ".join(f"burbuja@{a[0]:.2f}/-25 cristal@{a[0] + 0.35:.2f}:{i % 6}/-27" for i, a in enumerate(ARREGLOS)), ("abajo", "cierre"),
       voz="Every yes has a fix. Bot-proof forms. Prices you change. No PHP, daily backups. Juditos that answer. Guided ads. Your visits, in your portal.")

# ═══ 8 · Llamado a la acción ═══
escena("cierre", 7.2, "8 · Llamado a la acción", "All of this is fixed one chat away. → Said yes to any? Message us. WhatsApp +1 305 934 9981 · judomarketing.net · @judo.marketing",
       "Mezcla de violeta, azul y rosa. Un globo de chat en 3D con los puntos que escriben y «All of this is fixed one chat away.»; después sube «Said yes to any? Message us.» con el WhatsApp, la web y el Instagram, y «We’ll tell you honestly if we can help.». El contacto queda quieto más de 4 segundos.",
       "cierre",
       deco("esfera", 88, 44, 8, 0.3, c1="#ffe0f0", c2="#ff4fa0", c3="#8a1250") + deco("anillo-d", 92, 124, 10, 0.5, c1="rgba(255,255,255,.3)")
       + deco("destello", 10, 140, 4, 0.8, c1="#ffd166")
       + '<div class="fase sale-antes" style="--fuera:2.75s">'
       + cap(["All of this", "is fixed", '<span class="ligera">one chat away.</span>'], d=0.05, clase="t-l", estilo="font-size:10cqw")
       + f'<div class="globo-3d" style="top:63cqw;--d:.3s">{GLOBO}</div></div>'
       '<div class="fase">'
       + cap(["Said yes", "to any?"], d=2.95, clase="t-xl", top=22, estilo="font-size:12.6cqw")
       + cap(['<span class="ligera">Message us.</span>'], d=3.15, clase="t-m", top=51)
       + f'<div class="contacto-pro" style="top:65cqw"><span class="wa" style="--d:3.3s">{ic("whatsapp-logo")}+1 305 934 9981</span>'
       f'<span style="--d:3.45s">{ic("globe")}judomarketing.net</span>'
       '<span style="--d:3.6s"><img src="img/judo-logo.webp" alt="">@judo.marketing</span></div>'
       '<div class="honesto aparece" style="top:116cqw;--d:3.9s">We’ll tell you honestly if we can&nbsp;help.</div></div>',
       "golpe-suave@0.3:2/-24 barrido-suave@2.7:0.5/-27 notificacion@3.3/-23 campanita@3.9/-26",
       voz="All of this is fixed one chat away. Said yes to any? Message us on WhatsApp.")

html = cabeza + "<!-- ═══════════════ ESCENAS (las arma armar.py) ═══════════════ -->\n" + "\n\n".join(T) + \
    '\n\n<script type="application/json" id="escenas">\n' + json.dumps(ESC, ensure_ascii=False, indent=1) + "\n</script>\n\n" + pie
open(os.path.join(D, "storyboard.html"), "w", encoding="utf-8").write(html)
print(f"{len(ESC)} escenas, {sum(e['dur'] for e in ESC):.1f} s")
