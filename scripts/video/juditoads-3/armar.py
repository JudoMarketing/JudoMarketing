# Arma storyboard.html del video 3 («Cómo funciona JuditoADS por dentro»),
# segunda versión. Cada escena tiene su propio fondo, una sola idea y su
# forma de salir (un panel del color que sigue, desde abajo, desde el lado o
# en círculo, o un corte seco en el tiempo fuerte de la música).
# Para cambiar el video: edita este archivo y corre
#   python3 armar.py && python3 build.py && node revisar.mjs
# Los estilos salen de base.html (la plantilla de la skill judo-video-vertical)
# más pro.css (el sistema visual de esta versión). Los iconos son Phosphor
# (licencia MIT, vectores/LICENSE.txt).
import json, os, re

D = os.path.dirname(os.path.abspath(__file__))
base = open(os.path.join(D, "base.html"), encoding="utf-8").read()
base = re.sub(r"<title>.*?</title>", "<title>Video · Cómo funciona JuditoADS</title>", base)
base = re.sub(r"<!-- FUENTES:INICIO -->.*?<!-- FUENTES:FIN -->", """<!-- FUENTES:INICIO -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap">
<!-- FUENTES:FIN -->""", base, flags=re.S)
base = re.sub(r"--f-display: [^;]+;", '--f-display: "Inter Tight", "Helvetica Neue", Arial, sans-serif;', base, count=1)
base = re.sub(r"--f-cuerpo: [^;]+;", '--f-cuerpo: "Inter Tight", "Helvetica Neue", Arial, sans-serif;', base, count=1)
base = base.replace("--ancho-display: 112%;", "--ancho-display: 100%;", 1)
pro = open(os.path.join(D, "pro.css"), encoding="utf-8").read()
base = base.replace("</style>", "</style>\n<style>\n" + pro + "</style>", 1)
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


def rotulo(texto, d=0.0):
    return f'<div class="rotulo-mono aparece" style="--d:{d}s">{texto}</div>'


def slab(arriba, izq, der, icono, color_icono, h=36):
    """Una capa isométrica con un icono acostado en la cara de arriba."""
    a = 115.47
    mat = f"matrix({100/256:.4f} {57.735/256:.4f} {-100/256:.4f} {57.735/256:.4f} 100 0)"
    return (f'<svg viewBox="0 0 200 {a + h:.2f}" aria-hidden="true">'
            f'<polygon points="0,57.74 100,{a} 100,{a + h} 0,{57.74 + h}" fill="{izq}"/>'
            f'<polygon points="100,{a} 200,57.74 200,{57.74 + h} 100,{a + h}" fill="{der}"/>'
            f'<polygon points="100,0 200,57.74 100,{a} 0,57.74" fill="{arriba}"/>'
            f'<polyline points="0,57.74 100,0 200,57.74" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>'
            f'<polyline points="0,57.74 100,{a} 200,57.74" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>'
            f'<g transform="{mat}"><g transform="translate(64 64) scale(.5)" fill="{color_icono}" style="color:{color_icono}">{path_de(icono)}</g></g>'
            "</svg>")


MONEDA = ('<svg viewBox="0 0 200 200" aria-hidden="true"><defs>'
          '<linearGradient id="mo-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset=".45" stop-color="#f6c443"/><stop offset="1" stop-color="#a8700c"/></linearGradient>'
          '<linearGradient id="mo-b" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffefaa"/><stop offset=".55" stop-color="#e3a926"/><stop offset="1" stop-color="#9c6608"/></linearGradient></defs>'
          '<circle cx="100" cy="100" r="96" fill="url(#mo-a)"/><circle cx="100" cy="100" r="79" fill="url(#mo-b)"/>'
          '<circle cx="100" cy="100" r="79" fill="none" stroke="#fff7d6" stroke-opacity=".55" stroke-width="2"/>'
          '<circle cx="100" cy="100" r="88" fill="none" stroke="#8a5a06" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="3 5"/>'
          f'<g transform="translate(46 46) scale(.42)" fill="#7a4d04">{path_de("currency-dollar")}</g>'
          '<ellipse cx="72" cy="58" rx="34" ry="14" fill="#fff" fill-opacity=".28" transform="rotate(-30 72 58)"/></svg>')

TARJETA = ('<svg viewBox="0 0 340 214" aria-hidden="true"><defs>'
           '<linearGradient id="tj-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2442"/><stop offset="1" stop-color="#0b0b12"/></linearGradient>'
           '<radialGradient id="tj-b" cx=".9" cy="0" r=".95"><stop offset="0" stop-color="#7b4dff" stop-opacity=".75"/><stop offset="1" stop-color="#7b4dff" stop-opacity="0"/></radialGradient>'
           '<linearGradient id="tj-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe3a0"/><stop offset="1" stop-color="#c59a3a"/></linearGradient></defs>'
           '<rect width="340" height="214" rx="22" fill="url(#tj-a)"/><rect width="340" height="214" rx="22" fill="url(#tj-b)"/>'
           '<rect x="1" y="1" width="338" height="212" rx="21" fill="none" stroke="#fff" stroke-opacity=".14"/>'
           '<rect x="30" y="72" width="50" height="38" rx="7" fill="url(#tj-c)"/>'
           '<path d="M30 91h50M48 72v38M62 72v38" stroke="#8a6a20" stroke-opacity=".5" stroke-width="1.5"/>'
           '<path d="M98 80a16 16 0 0 1 0 22M106 74a26 26 0 0 1 0 34M114 68a36 36 0 0 1 0 46" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round"/>'
           + "".join(f'<circle cx="{34 + g * 62 + k * 11}" cy="156" r="3.6" fill="#fff" fill-opacity=".75"/>' for g in range(3) for k in range(4))
           + '<rect x="222" y="148" width="58" height="16" rx="8" fill="#fff" fill-opacity=".8"/>'
           '<circle cx="270" cy="186" r="15" fill="#fff" fill-opacity=".3"/><circle cx="290" cy="186" r="15" fill="#fff" fill-opacity=".5"/>'
           '<rect x="30" y="182" width="110" height="9" rx="4.5" fill="#fff" fill-opacity=".35"/></svg>')

GRAFICA = ('<svg viewBox="0 0 300 104" aria-hidden="true"><defs><linearGradient id="gr-a" x1="0" y1="0" x2="0" y2="1">'
           '<stop offset="0" stop-color="#12b76a" stop-opacity=".28"/><stop offset="1" stop-color="#12b76a" stop-opacity="0"/></linearGradient></defs>'
           + "".join(f'<line x1="0" x2="300" y1="{y}" y2="{y}" stroke="#ebe8f2" stroke-width="1" stroke-dasharray="3 5"/>' for y in (18, 52, 86))
           + '<path class="area-pro" style="--d:1.2s" d="M0 90 C28 86 44 70 70 73 S114 60 140 52 S188 41 214 30 S264 20 300 10 L300 104 L0 104 Z" fill="url(#gr-a)"/>'
           '<path class="trazo-pro" style="--d:.8s" pathLength="1" d="M0 90 C28 86 44 70 70 73 S114 60 140 52 S188 41 214 30 S264 20 300 10"/>'
           '<g class="punto-vivo" style="--d:2.1s"><circle cx="300" cy="10" r="11" fill="#12b76a" fill-opacity=".2"/><circle cx="300" cy="10" r="5" fill="#12b76a"/></g></svg>')


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


def tarjeta(top, d, icono, titulo, sub, activa=None, ok=None, color_borde=None):
    borde = (f'<i class="borde" style="--dac:{activa}s{f";--bc:{color_borde}" if color_borde else ""}"></i>' if activa is not None else "")
    marca = f'<span class="marca-ok" style="--dok:{ok}s">{ic("check-circle")}</span>' if ok is not None else ""
    return (f'<div class="tarjeta-ui" style="top:{top}cqw;--d:{d}s">{borde}<span class="icono{" blanco" if "meta" in icono else ""}">'
            f'{icono if icono.startswith("<") else ic(icono)}</span><span><b>{titulo}</b><small>{sub}</small></span>{marca}</div>')


def aviso(top, d, color, icono, titulo, sub, bajadas=()):
    caja = (f'<div class="aviso" style="top:{top}cqw;--d:{d}s"><span class="ic" style="background:{color}">{ic(icono)}</span>'
            f'<span class="txt"><span class="de">JuditoADS · ahora</span><b>{titulo}</b><small>{sub}</small></span></div>')
    for db in bajadas:  # cada aviso nuevo empuja hacia abajo a los anteriores
        caja = f'<div class="baja" style="--db:{db}s">{caja}</div>'
    return caja


def casilla(d, icono, titulo, sub):
    figura = f'<img src="{icono}" alt="">' if "/" in icono else ic(icono)
    return (f'<div class="casilla" style="--d:{d}s"><span class="ok">{ic("check-circle")}</span><span class="ic">{figura}</span>'
            f'<span><b>{titulo}</b><small>{sub}</small></span></div>')


META_IMG = '<img src="img/meta-simbolo.png" alt="Meta">'

# ═══ 1 · Gancho ═══
escena("gancho", 3.6, "1 · Gancho", "No somos solo marketing.",
       "Fondo negro con una rejilla de puntos que deriva. El titular sube por líneas y se subraya «marketing»; el logo de Judo se dibuja de izquierda a derecha.",
       "negro",
       '<div class="puntos-fondo"></div>' + rotulo("Judo Marketing · Miami", -0.1)
       + cap(["No somos", "solo", '<span class="raya" style="--dr:.95s">marketing.</span>'], d=-0.25, paso=0.12, clase="t-xl")
       + '<div class="logo-pro" style="top:79cqw;left:46cqw;--ancho:60cqw"><div class="deriva-lenta"><img class="revela" style="--d:.3s" src="img/judo-logo.webp" alt="Judo Marketing"></div></div>',
       "sub@0 cristal@0.95:2/-24", ("abajo", "claro"),
       voz="Judo Marketing no es solo una empresa de marketing.")

escena("soluciones", 3.6, "1 · Gancho", "Soluciones complejas para problemas complejos.",
       "Fondo claro. Caen tres capas isométricas (violeta, azul y oro) y se apilan; cada una lleva su icono acostado: engranaje, gráfica y rayo.",
       "claro",
       cap(["Soluciones", "complejas"], d=0.05)
       + cap(['<span class="ligera">para problemas</span>', '<span class="ligera">complejos.</span>'], d=0.3, clase="t-m", top=49)
       + '<div class="sombra-piso" style="top:127cqw;--d:.5s"></div>'
       + f'<div class="iso cae" style="top:100cqw;width:44cqw;margin-left:-22cqw;--d:.45s">{slab("#8a5cff", "#5b2df0", "#3f17c2", "gear-six", "#fff")}</div>'
       + f'<div class="iso cae" style="top:86.4cqw;width:44cqw;margin-left:-22cqw;--d:.7s">{slab("#3c84ff", "#0866ff", "#0548c4", "chart-line-up", "#fff")}</div>'
       + f'<div class="iso cae" style="top:72.8cqw;width:44cqw;margin-left:-22cqw;--d:.95s">{slab("#ffd24d", "#f5b700", "#d08e00", "lightning", "#0b0b12")}</div>',
       "golpe-suave@0.72 golpe-suave@0.97:1 golpe-suave@1.22:2", ("lado", "violeta"),
       voz="También creamos soluciones complejas para problemas complejos.")

# ═══ 2 · Introducción ═══
escena("jads", 3.6, "2 · Introducción", "Por eso creamos JuditoADS. Así funciona por dentro ↓",
       "Fondo violeta. «Por eso creamos» y el nombre grande; el ícono de JuditoADS se levanta de acostado a de pie y lo cruza un reflejo.",
       "violeta",
       cap(["Por eso creamos"], d=0.05, clase="t-m")
       + cap(["JuditoADS."], d=0.16, clase="t-xl", top=33.5)
       + '<div class="logo-pro voltea" style="top:56cqw;--ancho:54cqw;--d:.35s"><div class="logo-app"><img src="img/juditoads.webp" alt="JuditoADS"><i class="brillo-cruza" style="--dbr:1.2s"></i></div></div>'
       + '<div class="pro-cap t-s centrado aparece" style="top:118cqw;--d:1.6s">Así funciona por dentro ↓</div>',
       "golpe-suave@0.55:1/-24 cristal@1.25:4/-23", ("circulo", "claro", 50, 46.7),
       voz="Por eso creamos JuditoADS. Así funciona por dentro.")

# ═══ 3 · Cuerpo 1: la conexión ═══
escena("conexion", 4.2, "3 · Cuerpo 1", "JuditoADS maneja tus anuncios, con tu permiso.",
       "Fondo claro. Tres tarjetas en columna: tu negocio, JuditoADS y Meta. Crece la línea de la primera a la segunda con la pastilla «tu permiso»; JuditoADS se enciende y baja un punto hasta Meta.",
       "claro",
       rotulo("Cómo se conecta")
       + cap(["JuditoADS maneja", "tus anuncios,", '<span class="color-violeta">con tu permiso.</span>'], clase="t-m")
       + tarjeta(56, 0.45, "storefront", "Tu negocio", "Tu cuenta de Meta")
       + '<div class="hilo-v" style="top:75.2cqw;height:12.8cqw;--d:1s"></div>'
       + f'<div class="en-hilo" style="top:81.6cqw;--d:1.15s"><span class="pastilla">{ic("key")} tu permiso</span></div>'
       + tarjeta(88, 0.6, '<img src="img/juditoads.webp" alt="">', "JuditoADS", "Maneja tus anuncios", activa=1.9, ok=2.05)
       + '<div class="hilo-v" style="top:107.2cqw;height:12.8cqw;--d:2.35s"></div>'
       + '<div class="viajero" style="--y0:107.5;--y1:120;--d:2.5s;--dura:.7s"></div>'
       + tarjeta(120, 0.75, META_IMG.replace(' alt="Meta"', ' alt=""').replace("<img", '<img class="meta"'), "Meta", "Facebook · Instagram", activa=3.0, color_borde="#0866ff"),
       "cristal@1.2:1/-25 clic-suave@1.95 cristal@2.1:3/-25 clic-suave@3.05/-30", ("abajo", "azul"),
       voz="Meta permite que JuditoADS maneje tus anuncios… con tu permiso.")

escena("ordenes", 3.6, "3 · Cuerpo 1", "Judito le dice a Meta qué hacer.",
       "Fondo azul de Meta. Tres pastillas (el anuncio, el público, el presupuesto) caen una por una dentro del círculo de Meta; cada una abre un anillo. Al final brotan Facebook e Instagram.",
       "azul",
       cap(["Judito le dice", "a Meta", '<span class="ligera">qué hacer.</span>'])
       + "".join(f'<div class="absorbe" style="--y0:67;--y1:99;--d:{d}s"><span class="pastilla clara grande">{ic(i)} {t}</span></div>'
                 for d, i, t in ((0.3, "megaphone", "el anuncio"), (0.9, "users-three", "el público"), (1.5, "coins", "el presupuesto")))
       + "".join(f'<div class="anillo" style="left:50cqw;top:99cqw;--ancho:42cqw;--d:{d}s"></div>' for d in (1.35, 1.95, 2.55))
       + f'<div class="circulo-blanco escala" style="left:50cqw;top:99cqw;--ancho:42cqw;--d:.15s">{META_IMG}</div>'
       + '<svg class="linea-svg" viewBox="0 0 100 177.78" aria-hidden="true"><path pathLength="1" d="M40 117 L31 126" style="--d:2.45s"/><path pathLength="1" d="M60 117 L69 126" style="--d:2.45s"/></svg>'
       + '<div class="circulo-blanco fb escala" style="left:26cqw;top:132cqw;--ancho:17cqw;--d:2.55s"><img src="img/facebook.svg" alt="Facebook"></div>'
       + '<div class="circulo-blanco ig escala" style="left:74cqw;top:132cqw;--ancho:17cqw;--d:2.65s"><img src="img/instagram.svg" alt="Instagram"></div>',
       "clic-suave@1.3 clic-suave@1.9/-29 clic-suave@2.5/-28 cristal@2.6:5/-25", ("circulo", "negro", 50, 55.7),
       voz="Tú conectas tu cuenta, y Judito le dice a Meta qué hacer.")

# ═══ 4 · Bucle abierto ═══
escena("bucle-dinero", 1.8, "4 · Bucle abierto", "¿Y tu dinero?",
       "Negro. Una luz dorada desde arriba y una moneda que gira despacio en el aire.",
       "negro",
       '<div class="luz-cenital" style="--d:0s"></div>'
       + cap(["¿Y tu", "dinero?"], d=-0.1, paso=0.12, clase="t-xl centrado", top=26)
       + f'<div class="objeto-pro flota-pro" style="top:70cqw;--ancho:44cqw;perspective:120cqw"><div class="gira-lento">{MONEDA}</div></div>',
       "subida-suave@0:1.8", ("corte",),
       voz="¿Y tu dinero?")

# ═══ 5 · Cuerpo 2: el dinero ═══
escena("veinte", 3.0, "5 · Cuerpo 2", "A Judo solo le pagas $20 al mes.",
       "Corte seco a fondo claro en el tiempo fuerte. El «$20» cuenta desde cero; abajo, el recibo del plan.",
       "claro",
       rotulo("Lo que pagas")
       + cap(["A Judo solo", "le pagas"], clase="t-m")
       + cap(['$<span class="cuenta" style="--hasta:20;--d:.25s;--dc:1.1s"></span>'], d=0.1, clase="t-xxl color-violeta", top=46)
       + cap(['<span class="ligera">al mes.</span>'], d=0.3, top=83)
       + '<div class="recibo" style="top:104cqw;--d:1.2s"><img src="img/juditoads.webp" alt=""><span><b>Plan JuditoADS</b><small>Cobro mensual</small></span><span class="precio-r">$20</span></div>',
       "sub@0/-20 tecla@0.3 tecla@0.38/-29 tecla@0.47/-30 tecla@0.6/-31 tecla@0.8/-32 cristal@1.0:4/-23 clic-suave@1.3/-30", ("lado", "violeta"),
       voz="A Judo solo le pagas veinte dólares al mes.")

escena("eliges", 2.4, "5 · Cuerpo 2", "Tu presupuesto lo eliges tú.",
       "Fondo violeta. Una tarjeta de «Presupuesto diario» (marcada como ejemplo): el cursor arrastra el deslizador y el monto sube de $2 a $12 por día.",
       "violeta",
       cap(["Tu presupuesto", '<span class="ligera">lo eliges tú.</span>'])
       + '<div class="ui-tarjeta" style="top:56cqw;--d:.2s"><div class="cab-ui"><span>Presupuesto diario</span><span class="etiqueta-ejemplo">Ejemplo</span></div>'
       '<div class="monto">$<span class="cuenta" style="--desde:2;--hasta:12;--d:.7s;--dc:1.1s"></span><small> / día</small></div>'
       f'<div class="riel" style="--desde-p:4.2%;--hasta-p:45.8%;--d:.7s;--dc:1.1s"><i class="lleno"></i><b class="perilla">{ic("cursor-click")}</b></div>'
       '<div class="riel-marcas"><span>$1</span><span>$25</span></div></div>',
       "clic-suave@0.68/-27 tecla@0.76/-30 tecla@0.86/-31 tecla@0.98/-31 tecla@1.14/-32 tecla@1.36/-33", ("abajo", "oro"),
       voz="Tu presupuesto lo eliges tú…")

escena("directo", 3.0, "5 · Cuerpo 2", "Y se lo pagas directo a Meta.",
       "Fondo oro. La tarjeta de crédito entra volando desde la izquierda, se detiene y se mete en el círculo de Meta, que abre un anillo y muestra el visto bueno.",
       "oro",
       cap(["Y se lo pagas", "directo a Meta."], estilo="font-size:10.4cqw")
       + '<div class="anillo" style="left:62cqw;top:104cqw;--ancho:44cqw;--anillo:rgba(11,11,18,.45);--d:1.85s"></div>'
       + f'<div class="vuela-a-meta" style="top:86cqw;width:58cqw;margin-left:-29cqw;--d:.25s;--dx:12cqw;--dy:-.3cqw">{TARJETA}</div>'
       + f'<div class="circulo-blanco escala" style="left:62cqw;top:104cqw;--ancho:44cqw;z-index:8;--d:.15s">{META_IMG}</div>'
       + f'<div class="icono-pro escala" style="left:79cqw;top:84cqw;--ancho:13cqw;height:13cqw;margin-left:-6.5cqw;z-index:9;--c:#0b7a4b;--d:1.95s"><span class="chapa">{ic("check-circle")}</span></div>',
       "barrido-suave@0.25:0.7/-25 golpe-suave@1.85:1/-23 cristal@1.95:5/-24", ("circulo", "negro", 62, 58.5),
       voz="…y se lo pagas directo a Meta.")

escena("no-tocamos", 3.6, "5 · Cuerpo 2", "No tocamos tu presupuesto.",
       "Negro. Un escudo verde con su halo y un anillo que se dibuja alrededor.",
       "negro",
       cap(["No tocamos", '<span class="color-verde">tu presupuesto.</span>'], estilo="font-size:10.4cqw")
       + '<div class="halo" style="top:58cqw;--ancho:84cqw;--d:.2s"></div>'
       + '<svg class="circulo-traza" style="top:66cqw;--ancho:60cqw;--c:rgba(18,183,106,.75);--d:.45s" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="1" transform="rotate(-90 50 50)"/></svg>'
       + f'<div class="icono-pro escala" style="top:78cqw;--ancho:36cqw;height:36cqw;--c:#12b76a;--d:.3s">{ic("shield-check")}</div>',
       "sub@0.3/-21 cristal@1.2:3/-24", ("abajo", "claro"),
       voz="Nosotros no tocamos tu dinero ni tu presupuesto.")

# ═══ 6 · Bucle abierto ═══
escena("bucle-funciona", 1.8, "6 · Bucle abierto", "¿Y cómo sabes si funciona?",
       "Fondo claro. La pregunta grande y una lupa violeta que recorre el cuadro.",
       "claro",
       cap(["¿Y cómo", "sabes si", "funciona?"], d=-0.1, paso=0.1, clase="t-xl centrado", top=24)
       + f'<div class="icono-pro" style="top:80cqw;--ancho:40cqw;height:40cqw;--c:#6e3bff"><div class="lupa" style="width:100%;height:100%">{ic("magnifying-glass")}</div></div>',
       "subida-suave@0:1.8", ("corte",),
       voz="¿Y cómo sabes si funciona?")

# ═══ 7 · Cuerpo 3: la información ═══
escena("meta-cuenta", 3.6, "7 · Cuerpo 3", "Meta le cuenta a Judito cómo va tu anuncio…",
       "Corte seco a azul en el tiempo fuerte. El tablero de una campaña de ejemplo (Café Luna, Miami): las cifras cuentan, la gráfica se dibuja y se enciende el punto en vivo.",
       "azul",
       rotulo("Lo que ves")
       + cap(["Meta le cuenta", "a Judito cómo va", '<span class="ligera">tu anuncio…</span>'], clase="t-m")
       + '<div class="tablero" style="top:56cqw;--d:.3s"><div class="cab"><span>CAFÉ LUNA · MIAMI</span><span class="etiqueta-ejemplo">Ejemplo</span></div>'
       '<div class="cifras"><div><b>18,4 mil</b><small>lo vieron</small></div><div><b><span class="cuenta" style="--hasta:612;--d:.7s;--dc:1.4s"></span></b><small>clics</small></div></div>'
       + GRAFICA + '<div class="pie-tab"><i class="vivo"></i>Actualizado hace 5 min</div></div>',
       "sub@0/-20 datos@0.7 cristal@2.1:4/-25", ("lado", "negro"),
       voz="Meta le cuenta a Judito cómo va tu anuncio…")

escena("te-avisa", 5.4, "7 · Cuerpo 3", "…y Judito te lo explica y te avisa.",
       "Negro, como la pantalla bloqueada. Llegan tres avisos de JuditoADS y cada uno empuja hacia abajo al anterior: un consejo, que Meta frenó el anuncio, y que va bien.",
       "negro",
       cap(["…y Judito", "te lo explica", '<span class="ligera">y te avisa.</span>'])
       + aviso(63, 1.0, "#f5b700", "lightbulb", "Consejo de Judito", "Prueba con 3 imágenes.", bajadas=(2.1, 3.2))
       + aviso(63, 2.1, "#f04438", "warning-circle", "Meta frenó tu anuncio", "Falta el pago en tu cuenta.", bajadas=(3.2,))
       + aviso(63, 3.2, "#12b76a", "chart-line-up", "Tu anuncio va bien", "18,4 mil personas lo vieron."),
       "aviso@1.0:0 aviso@2.1:1 aviso@3.2:2", ("abajo", "violeta"),
       voz="…y Judito te lo explica, y te avisa si algo falla. Para que no botes tu dinero.")

# ═══ 8 · Llamado a la acción ═══
escena("necesitas", 7.8, "8 · Llamado a la acción", "Solo necesitas: cuenta de Meta, página de Facebook, tu Instagram si tienes y una tarjeta en tu cuenta de anuncios.",
       "Fondo violeta. Cuatro huecos punteados; cada uno se llena con su ficha cuando la voz la nombra y se marca con un visto.",
       "violeta",
       rotulo("Para empezar")
       + cap(["Solo", "necesitas:"])
       + '<div class="rejilla" style="top:52cqw">' + "".join(f'<i class="hueco" style="--d:{0.35 + i * 0.08:.2f}s;--fuera:{f}s"></i>' for i, f in enumerate((1.6, 3.2, 4.8, 6.2))) + "</div>"
       + '<div class="rejilla" style="top:52cqw">'
       + casilla(1.4, "img/meta-simbolo.png", "Cuenta de&nbsp;Meta", "La que ya usas.")
       + casilla(3.0, "img/facebook.svg", "Página de&nbsp;Facebook", "Desde ahí salen tus&nbsp;anuncios.")
       + casilla(4.6, "img/instagram.svg", "Instagram", "Si tienes, también se&nbsp;conecta.")
       + casilla(6.0, "credit-card", "Una tarjeta", "En tu cuenta de&nbsp;anuncios.")
       + "</div>",
       "cristal@1.9:1/-24 cristal@3.5:2/-24 cristal@5.1:3/-24 cristal@6.5:4/-24", ("circulo", "claro", 50, 50),
       voz="Para empezar, solo necesitas tu cuenta de Meta… con una página de Facebook… tu Instagram, si lo tienes… y una tarjeta en tu cuenta de anuncios.")

escena("listo", 3.0, "8 · Llamado a la acción", "Y listo. Ya anuncias como un profesional.",
       "Fondo claro. «Y listo.» y, debajo, los tres en fila (tú, JuditoADS y Meta) unidos por una línea por la que corren dos puntos.",
       "claro",
       cap(["Y listo."], clase="t-xl centrado", top=24)
       + cap(['<span class="ligera">Ya anuncias como</span>', '<span class="ligera">un profesional.</span>'], d=0.25, clase="t-m centrado", top=42)
       + '<svg class="linea-svg" style="--c:rgba(11,11,18,.35)" viewBox="0 0 100 177.78" aria-hidden="true"><path pathLength="1" d="M20 82 L80 82" style="--d:.55s"/></svg>'
       + '<div class="viajero-h" style="top:82cqw;--x0:20;--x1:80;--d:1.1s"></div><div class="viajero-h" style="top:82cqw;--x0:20;--x1:80;--d:1.7s"></div>'
       + '<div class="fila-nodos" style="top:70cqw">'
       f'<div class="nodo-f" style="left:20cqw;--tam:24cqw;--d:.35s"><span class="disco">{ic("storefront")}</span><span>Tú</span></div>'
       '<div class="nodo-f" style="left:50cqw;--tam:24cqw;--d:.5s"><span class="disco app"><img src="img/juditoads.webp" alt="JuditoADS"></span><span>JuditoADS</span></div>'
       f'<div class="nodo-f" style="left:80cqw;--tam:24cqw;--d:.65s"><span class="disco blanco">{META_IMG}</span><span>Meta</span></div></div>',
       "cristal@0.4:1/-25 cristal@0.55:3/-25 cristal@0.7:5/-25 datos@1.1/-30", ("abajo", "mezcla"),
       voz="Y listo: ya puedes anunciarte en redes como todo un profesional.")

escena("cierre", 6.0, "8 · Llamado a la acción", "Pruébalo gratis. 14 días · sin tarjeta → ¿Necesitas ayuda? Escríbeme.",
       "Fondo de color mezclado. El ícono de JuditoADS con «Pruébalo gratis. 14 días · sin tarjeta»; después sube «¿Necesitas ayuda? Escríbeme.» con WhatsApp, Instagram y la dirección.",
       "mezcla",
       '<div class="fase sale-antes" style="--fuera:2.45s">'
       '<div class="logo-pro voltea" style="top:19cqw;--ancho:36cqw;--d:.05s"><div class="logo-app"><img src="img/juditoads.webp" alt="JuditoADS"><i class="brillo-cruza" style="--dbr:.7s"></i></div></div>'
       + cap(["Pruébalo", "gratis."], d=0.15, clase="t-xl centrado", top=62)
       + '<div class="pro-cap t-s centrado aparece" style="top:94cqw;--d:.6s;font-size:6.4cqw;font-weight:600">14 días · sin tarjeta</div></div>'
       '<div class="fase">'
       + cap(["¿Necesitas", "ayuda?"], d=2.75, top=30)
       + cap(['<span class="ligera">Escríbeme.</span>'], d=2.95, clase="t-m", top=56)
       + f'<div class="contacto-pro" style="top:72cqw"><span style="--d:3.1s">{ic("whatsapp-logo")}+1 305 934 9981</span>'
       '<span style="--d:3.25s"><img src="img/judo-logo.webp" alt="">@judo.marketing</span>'
       f'<span style="--d:3.4s">{ic("cursor-click")}judomarketing.net/juditoads</span></div>'
       '<div class="legal aparece" style="top:128cqw;--d:3.3s">Meta, Facebook e Instagram son marcas de Meta Platforms,&nbsp;Inc.</div></div>',
       "acorde-suave@0.05:4 cristal@0.75:5/-25 barrido-suave@2.4:0.5/-27 aviso@3.15:2/-26",
       voz="Pruébalo gratis catorce días. Y si necesitas ayuda para empezar, escríbeme.")

html = cabeza + "<!-- ═══════════════ ESCENAS (las arma armar.py) ═══════════════ -->\n" + "\n\n".join(T) + \
    '\n\n<script type="application/json" id="escenas">\n' + json.dumps(ESC, ensure_ascii=False, indent=1) + "\n</script>\n\n" + pie
open(os.path.join(D, "storyboard.html"), "w", encoding="utf-8").write(html)
print(f"{len(ESC)} escenas, {sum(e['dur'] for e in ESC):.1f} s")
