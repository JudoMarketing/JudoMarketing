# Arma storyboard.html del video 3 («Cómo funciona JuditoADS»).
# El mapa conceptual se repite en casi todas las escenas con distinto estado
# (qué ya estaba, qué entra, qué viaja). Escribirlo a mano 15 veces se presta
# a que un nodo quede corrido entre escena y escena y se note el salto; aquí
# se escribe una sola vez. Para cambiar el video: edita este archivo y corre
#   python3 armar.py && python3 build.py
# Los estilos salen de base.html (la plantilla de la skill judo-video-vertical).
import json, re

base = open("base.html", encoding="utf-8").read()
base = re.sub(r"<title>.*?</title>", "<title>Video · Cómo funciona JuditoADS</title>", base)
inicio = base.index("<!-- ═══════════════ ESCENAS")
fin = base.index("<script>\n// ── Mesa de revisión")
cabeza, pie = base[:inicio], base[fin:]

# ── Las piezas del mapa (coordenadas en cqw) ──
NODOS = {
    "tu":   dict(x=26, y=70, tam=22, img="img/negocio.webp", nombre='<span class="nombre izq">Tú</span>', clase=""),
    "jads": dict(x=62, y=96, tam=27, img="img/juditoads.webp", nombre="", clase="cuadrado lleno"),
    "meta": dict(x=30, y=128, tam=22, img="img/meta-simbolo.png", nombre='<span class="nombre izq">Meta</span>', clase="blanco", imgpct="74%"),
}
LINEAS = {
    "l1": ("M34 76 Q46 76 52 86", "", (34, 76), (44.5, 78.5), (52, 86)),        # tú → JuditoADS
    "l2": ("M54 108 Q50 120 38 122", "", (54, 108), (48, 117.5), (38, 122)),   # JuditoADS → Meta
    "l3": ("M21 79 Q8 99 23 119", "dinero", (21, 79), (15, 99), (23, 119)),    # tú → Meta, sin pasar por nosotros
}
FASE = {"tu": "0s", "jads": "-1.1s", "meta": "-2s"}


def nodo(k, d=None, foco=False, insignia=None):
    n = NODOS[k]
    clases = " ".join(c for c in ["nodo", n["clase"], "ya" if d is None else "", "foco" if foco else ""] if c)
    estilo = f"--x:{n['x']};--y:{n['y']};--tam:{n['tam']}cqw;--fase:{FASE[k]}" + (f";--d:{d}s" if d is not None else "") + (f";--img:{n['imgpct']}" if n.get("imgpct") else "")
    extra = f'<img class="insignia golpea encima" src="{insignia[0]}" alt="" style="--d:{insignia[1]}s">' if insignia else ""
    return f'<div class="{clases}" style="{estilo}"><img src="{n["img"]}" alt="">{n["nombre"]}{extra}</div>'


def linea(k, d=None):
    d_, tipo, *_ = LINEAS[k]
    return f'<path class="linea {tipo} {"ya" if d is None else ""}" pathLength="1" d="{d_}"' + (f' style="--d:{d}s"' if d is not None else "") + "/>"


def flujo(k, d=0, vuelve=False):
    return f'<path class="flujo{" vuelve" if vuelve else ""}" pathLength="1" d="{LINEAS[k][0]}" style="--d:{d}s"/>'


def paquete(k, d, contenido, vuelve=False, dura=1.2, chip=None):
    _, _, a, m, b = LINEAS[k]
    if vuelve:
        a, b = b, a
    estilo = f"--x0:{a[0]};--y0:{a[1]};--xm:{m[0]};--ym:{m[1]};--x1:{b[0]};--y1:{b[1]};--d:{d}s;--dura:{dura}s"
    if chip:
        return f'<div class="paquete chip" style="{estilo};color:{chip}">{contenido}</div>'
    return f'<img class="paquete" src="{contenido}" alt="" style="{estilo}">'


def rotulo(x, y, texto, d=None, clase="", icono=None):
    anim = f' entra" style="--x:{x};--y:{y};--d:{d}s"' if d is not None else f'" style="--x:{x};--y:{y}"'
    ic = f'<img src="img/{icono}.webp" alt="">' if icono else ""
    return f'<div class="rotulo {clase}{anim}>{ic}{texto}</div>'


def mapa(nodos="", lineas="", resto="", estilo=""):
    return (f'<div class="mapa" style="{estilo}"><svg class="lineas" viewBox="0 0 100 177.78" aria-hidden="true">{lineas}</svg>'
            f"{nodos}{resto}</div>")


TODO_YA = nodo("tu") + nodo("jads") + nodo("meta")
LINEAS_YA = linea("l1") + linea("l2")

# ── La red del gancho: el logo de Judo con sus piezas alrededor ──
import math
SAT = ["pieza", "grafica", "cohete", "campana", "llave", "escudo", "moneda", "check"]
def red(dibujar=True, fluir=False, luz=""):
    cx, cy, r = 50, 98, 31
    lineas, nodos = "", ""
    for i, ic in enumerate(SAT):
        a = -math.pi / 2 + i * 2 * math.pi / len(SAT)
        x, y = cx + r * math.cos(a), cy + r * 1.05 * math.sin(a)
        x0, y0 = cx + 15 * math.cos(a), cy + 15 * math.sin(a)
        x1, y1 = cx + (r - 7) * math.cos(a), cy + (r - 7) * 1.05 * math.sin(a)
        d = f"M{x0:.1f} {y0:.1f} L{x1:.1f} {y1:.1f}"
        retraso = 0.55 + i * 0.12
        lineas += f'<path class="linea{"" if dibujar else " ya"}" pathLength="1" d="{d}" style="--d:{retraso:.2f}s;--dura:.5s"/>'
        if fluir:
            lineas += f'<path class="flujo" pathLength="1" d="{d}" style="--d:{0.1 + i * 0.05:.2f}s"/>'
        nodos += (f'<div class="nodo{"" if dibujar else " ya"}" style="--x:{x:.1f};--y:{y:.1f};--tam:13cqw;--fase:{-i * 0.35:.2f}s;--d:{retraso + 0.3:.2f}s">'
                  f'<img src="img/{ic}.webp" alt=""></div>')
    centro = f'<div class="nodo cuadrado{"" if dibujar else " ya"}" style="--x:{cx};--y:{cy};--tam:28cqw;--img:80%;--d:0s;background:#0b0a10"><img src="img/judo-logo.webp" alt="Judo Marketing"></div>'
    return mapa(centro + nodos, lineas, estilo=luz)


def bucle(palabras, emoji, dur, tam=9.6):
    t = dur + 0.25
    partes, d = [], 0.0
    for p in palabras:
        if p == "<br>":
            partes.append("<br>")
            continue
        partes.append(f'<span class="w" style="--d:{d:.2f}s">{p}</span>')
        d += 0.12
    return (f'<div class="pulso" aria-hidden="true"></div><div class="cap bucle" style="font-size:{tam}cqw">{" ".join(partes)}</div>'
            f'<img class="emoji" src="img/{emoji}.webp" alt="" style="--d:{d + 0.1:.2f}s">'
            f'<div class="puntos" aria-hidden="true" style="--d:{d + 0.4:.2f}s"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i></div>')


ESC, T = [], []
def escena(id_, dur, pieza, texto, ve, cuerpo, sfx, entrada="corte", voz=""):
    T.append(f'<template id="{id_}" data-sfx="{sfx}" data-entrada="{entrada}">\n  {cuerpo}\n</template>')
    ESC.append({"id": f"e{len(ESC) + 1:02d}", "plantilla": id_, "dur": dur, "pieza": pieza, "texto": texto, "ve": ve, "voz": voz})


# 1 · Gancho
escena("gancho-red", 3.4, "1 · Gancho", "Judo Marketing no es solo marketing.",
       "El logo de Judo aparece y a su alrededor se dibuja una red de piezas.",
       '<div class="cap arriba" style="font-size:9cqw">Judo Marketing<br>no es solo <span class="hl">marketing</span>.</div>' + red(),
       "grave@0.05 brillo@0.2 " + " ".join(f"pop@{0.85 + i * 0.12:.2f}" for i in range(8)), entrada="fade",
       voz="Judo Marketing no es solo una empresa de marketing.")
escena("gancho-red-2", 3.4, "1 · Gancho", "Creamos soluciones complejas para problemas complejos.",
       "La red se enciende: por cada línea corren datos.",
       '<div class="cap arriba" style="font-size:8.2cqw">Creamos soluciones<br>para problemas<br><span class="hl">complejos</span>.</div>' + red(False, True),
       "subida@0:1.2 brillo@1.2",
       voz="También creamos soluciones complejas para problemas complejos.")
# 2 · Introducción
escena("intro-jads", 3.8, "2 · Introducción", "Por eso creamos JuditoADS. Así funciona por dentro:",
       "La red se apaga y el logo de JuditoADS entra grande al centro.",
       '<div class="cap arriba" style="font-size:9cqw">Por eso creamos<br><span class="hl">JuditoADS</span>.<span class="sub">Así funciona por dentro:</span></div>'
       + red(False, False, "--luz-d:0s;--luz-hasta:0")
       + '<img class="logo-grande" src="img/juditoads.webp" alt="JuditoADS" style="--y:61.9cqw;--ancho:54cqw;--radio:14cqw;--d:.35s">',
       "whoosh-suave@0.1 grave@0.35 brillo@0.4", entrada="fade",
       voz="Por eso creamos JuditoADS. Te muestro cómo funciona por dentro.")
# 3 · Cuerpo 1: la conexión
escena("conexion", 4.2, "3 · Cuerpo 1", "Meta deja que JuditoADS maneje tus anuncios, con tu permiso.",
       "La cámara se aleja del logo y aparece el mapa: tú arriba, JuditoADS al centro, Meta abajo. Se dibujan las líneas y una llave viaja de ti a JuditoADS.",
       '<div class="cap arriba" style="font-size:7.4cqw">Meta deja que JuditoADS<br>maneje tus anuncios,<br><span class="hl">con tu permiso</span>.</div>'
       + mapa(nodo("jads") + nodo("tu", 0.9) + nodo("meta", 1.3),
              linea("l1", 1.6) + linea("l2", 2.0),
              paquete("l1", 2.4, "img/llave.webp", dura=1.1) + rotulo(48, 67, "tu permiso", 2.9),
              "--cam-desde:translate(-24cqw,-14.2cqw) scale(2);--cam-hasta:none;--cam-dura:1.1s"),
       "whoosh@0.05 pop@0.9 pop@1.3 swish@1.6 swish@2.0 plop@2.45 tap@3.4",
       voz="Meta permite que JuditoADS maneje tus anuncios… con tu permiso.")
escena("instrucciones", 3.5, "3 · Cuerpo 1", "Tú conectas tu cuenta y Judito le dice a Meta qué hacer.",
       "Por la línea de JuditoADS a Meta bajan las órdenes: el anuncio, el público, el presupuesto.",
       '<div class="cap arriba" style="font-size:7.4cqw">Tú conectas tu cuenta y<br>Judito le dice a Meta<br><span class="hl">qué hacer</span>.</div>'
       + mapa(TODO_YA, LINEAS_YA + flujo("l2", 0.2),
              rotulo(48, 67, "tu permiso")
              + paquete("l2", 0.3, "el anuncio", chip="var(--acento)") + paquete("l2", 1.0, "el público", chip="var(--acento)")
              + paquete("l2", 1.7, "el presupuesto", chip="var(--acento)")),
       "swish@0.35 swish@1.05 swish@1.75 bip@1.3 bip@2.0 bip@2.7",
       voz="Tú conectas tu cuenta, y Judito le dice a Meta qué hacer.")
# 4 · Bucle abierto
escena("bucle-dinero", 2.4, "4 · Bucle abierto", "¿Y tu dinero? Aquí viene lo importante…",
       "El mapa se apaga; la frase entra palabra por palabra, la bolsa de dinero y tres puntos.",
       mapa(TODO_YA, LINEAS_YA, "", "--luz-d:0s;--luz-hasta:.18")
       + bucle(["¿Y", "tu", "dinero?", "<br>", '<span class="hl">Aquí viene</span>', "<br>", '<span class="hl">lo importante</span>…'], "bolsa", 2.4, 8.2),
       "pop@0 pop@0.12 pop@0.24 pop-fuerte@0.36 pop-fuerte@0.48 plop@0.6 bip@1.0 subida@0:2.5", entrada="fade",
       voz="¿Y tu dinero? Aquí viene lo importante…")
# 5 · Cuerpo 2: el dinero
escena("veinte", 2.8, "5 · Cuerpo 2", "A Judo solo le pagas $20 al mes.",
       "Vuelve el mapa. De ti a JuditoADS viaja una moneda y aparece «$20 al mes».",
       '<div class="cap arriba" style="font-size:8.4cqw">A Judo solo le pagas<br><span class="hl">$20 al mes</span>.</div>'
       + mapa(nodo("tu") + nodo("jads", foco=True) + nodo("meta"), LINEAS_YA,
              paquete("l1", 0.4, "img/moneda.webp", dura=1.1) + rotulo(48, 67, "$20 al mes", 1.3),
              "--luz-desde:.18;--luz-d:0s;--luz-hasta:1"),
       "plop@0.45 caja@1.3", entrada="fade",
       voz="A Judo solo le pagas veinte dólares al mes.")
escena("presupuesto", 3.6, "5 · Cuerpo 2", "Tu presupuesto lo eliges tú y va directo a Meta.",
       "Se dibuja una línea dorada de ti a Meta, por fuera de JuditoADS, y por ella bajan monedas.",
       '<div class="cap arriba" style="font-size:7.6cqw">Tu presupuesto<br>lo eliges tú y va<br><span class="hl">directo a Meta</span>.</div>'
       + mapa(TODO_YA, LINEAS_YA + linea("l3", 0.2),
              rotulo(48, 67, "$20 al mes") + paquete("l3", 0.9, "img/moneda.webp") + paquete("l3", 1.5, "img/moneda.webp") + paquete("l3", 2.1, "img/moneda.webp")
              + rotulo(34, 100, "tu presupuesto", 1.0)),
       "swish@0.25 moneda@0.9 plop@1.5 plop@2.1 pop@1.0")
escena("no-tocamos", 3.0, "5 · Cuerpo 2", "Nosotros no tocamos tu dinero ni tu presupuesto.",
       "A JuditoADS le cae un escudo; las monedas siguen bajando directo a Meta.",
       '<div class="cap arriba" style="font-size:8.4cqw"><span class="hl">No tocamos</span><br>tu dinero ni<br>tu presupuesto.</div>'
       + mapa(nodo("tu") + nodo("jads", insignia=("img/escudo.webp", 0.45)) + nodo("meta"), LINEAS_YA + linea("l3") + flujo("l3", 0.1),
              rotulo(48, 67, "$20 al mes") + rotulo(34, 100, "tu presupuesto") + paquete("l3", 0.5, "img/moneda.webp") + paquete("l3", 1.4, "img/moneda.webp")
              + rotulo(70, 117, "no lo tocamos", 0.9)),
       "sello@0.45 campana@0.95")
# 6 · Bucle abierto
escena("bucle-funciona", 2.2, "6 · Bucle abierto", "¿Y cómo sabes si está funcionando?",
       "El mapa se apaga; la frase palabra por palabra, la carita que piensa y los tres puntos.",
       mapa(TODO_YA, LINEAS_YA + linea("l3"), "", "--luz-d:0s;--luz-hasta:.18")
       + bucle(["¿Y", "cómo", "sabes", "<br>", "si", '<span class="hl">está</span>', '<span class="hl">funcionando</span>?'], "pensando", 2.2),
       "pop@0 pop@0.12 pop@0.24 pop@0.36 pop@0.48 pop-fuerte@0.6 plop@0.75 bip@1.1 subida@0:2.3", entrada="fade",
       voz="¿Y cómo sabes si está funcionando?")
# 7 · Cuerpo 3: la información
escena("meta-cuenta", 2.8, "7 · Cuerpo 3", "Meta le cuenta a Judito cómo va tu anuncio…",
       "Vuelve el mapa. De Meta a JuditoADS suben gráficas por una línea verde.",
       '<div class="cap arriba" style="font-size:7.6cqw">Meta le cuenta<br>a Judito cómo va<br><span class="hl">tu anuncio</span>…</div>'
       + mapa(TODO_YA, LINEAS_YA + linea("l3") + flujo("l2", 0.2, vuelve=True),
              paquete("l2", 0.3, "img/grafica.webp", vuelve=True) + paquete("l2", 1.1, "img/grafica.webp", vuelve=True),
              "--luz-desde:.18;--luz-d:0s;--luz-hasta:1"),
       "bip@0.35 bip@1.15 campana@1.45", entrada="fade",
       voz="Meta le cuenta a Judito cómo va tu anuncio…")
escena("te-avisa", 4.8, "7 · Cuerpo 3", "…y Judito te lo explica y te avisa si algo falla.",
       "De JuditoADS a ti suben la gráfica, la campana y la alerta; junto a ti aparecen tres avisos.",
       '<div class="cap arriba" style="font-size:8cqw">…y Judito<br>te lo explica<br>y te avisa<br><span class="hl">si algo falla</span>.</div>'
       + mapa(TODO_YA, LINEAS_YA + linea("l3") + flujo("l1", 0.1, vuelve=True) + flujo("l2", 0, vuelve=True),
              paquete("l1", 0.2, "img/grafica.webp", vuelve=True) + paquete("l1", 1.2, "img/campana.webp", vuelve=True) + paquete("l1", 2.2, "img/alerta.webp", vuelve=True)
              + rotulo(64, 59, "cómo va", 1.25, "datos", "grafica") + rotulo(66, 68, "si Meta lo frena", 2.25, "datos", "campana") + rotulo(64, 77, "qué cambiar", 3.25, "datos", "foco")),
       "bip@0.25 pop-agudo@1.3 campana@1.35 pop-agudo@2.3 sello@2.35/-14 pop-agudo@3.3 brillo@3.3",
       voz="…y Judito te lo explica, y te avisa si algo falla. Para que no botes tu dinero.")
# 8 · Llamado a la acción: lo que necesitas y el paso siguiente
escena("necesitas", 8.2, "8 · Llamado a la acción", "Para empezar solo necesitas: tu cuenta de Meta, una página de Facebook, tu Instagram si tienes, y una tarjeta en tu cuenta de anuncios.",
       "Una lista con los logos de Meta, Facebook e Instagram y la tarjeta, que se marcan una por una.",
       '<div class="cap arriba" style="font-size:8.4cqw">Para empezar,<br><span class="hl">solo necesitas</span>:</div>'
       '<ul class="lista iconos" style="--y:50cqw;gap:6.4cqw;font-size:6cqw">'
       '<li class="entra" style="--d:.5s"><img src="img/meta-simbolo.png" alt="Meta"><span>Cuenta de Meta</span></li>'
       '<li class="entra" style="--d:2.1s"><img src="img/facebook.svg" alt="Facebook"><span>Página de Facebook<small>Desde ahí salen tus anuncios.</small></span></li>'
       '<li class="entra" style="--d:3.9s"><img src="img/instagram.svg" alt="Instagram"><span>Tu Instagram<small>Si tienes, también se conecta.</small></span></li>'
       '<li class="entra" style="--d:5.6s"><img src="img/tarjeta.webp" alt=""><span>Una tarjeta<small>En tu cuenta de anuncios: ahí Meta cobra tu presupuesto.</small></span></li>'
       "</ul>",
       "pop@0.55 pop@2.15 pop@3.95 pop@5.65", entrada="smoothup",
       voz="Para empezar, solo necesitas tu cuenta de Meta con una página de Facebook… tu Instagram, si lo tienes, y una tarjeta en tu cuenta de anuncios.")
escena("listo", 3.2, "8 · Llamado a la acción", "Y listo: ya anuncias como un profesional.",
       "Vuelve el mapa completo, con todas las líneas corriendo a la vez.",
       '<div class="cap arriba" style="font-size:7cqw">Y listo:<br>ya anuncias como<br><span class="hl">un profesional</span>.</div>'
       + mapa(nodo("tu", 0.05) + nodo("jads", 0.15) + nodo("meta", 0.25),
              linea("l1", 0.3) + linea("l2", 0.45) + linea("l3", 0.6) + flujo("l1", 0.9) + flujo("l2", 0.9) + flujo("l3", 0.9),
              paquete("l2", 1.0, "img/cohete.webp", dura=1.4)),
       "acorde@0.3 brillo@0.9 whoosh-suave@1.0", entrada="zoomin",
       voz="Y listo: ya puedes anunciarte en redes como todo un profesional.")
escena("cierre", 6.5, "8 · Llamado a la acción", "Pruébalo gratis 14 días · judomarketing.net/juditoads → contacto",
       "El logo de JuditoADS con «Pruébalo gratis 14 días» y después la tarjeta de contacto.",
       '<div class="cap arriba funde" style="--fuera:2.3s;font-size:9cqw">Pruébalo gratis<br><span class="hl">14 días</span><span class="sub">judomarketing.net/juditoads</span></div>'
       '<img class="logo-grande funde" src="img/juditoads.webp" alt="JuditoADS" style="--y:62cqw;--ancho:44cqw;--radio:11cqw;--d:.1s;--fuera:2.3s">'
       '<div class="final entra" style="--d:2.5s"><h3>¿Necesitas ayuda para <span class="hl">empezar</span>?</h3><p>Escríbeme:</p>'
       '<div class="contacto"><span><img src="img/judo-logo.webp" alt="">@judo.marketing</span><span>WhatsApp +1 305 934 9981</span></div></div>'
       '<div class="credito" style="bottom:40cqw;text-align:center;right:4cqw">Meta, Facebook e Instagram son marcas de Meta Platforms, Inc.</div>',
       "brillo@0.2 whoosh-baja@2.2 acorde-final@2.5", entrada="fade",
       voz="Pruébalo gratis catorce días. Y si necesitas ayuda para empezar, escríbeme.")

html = cabeza + "<!-- ═══════════════ ESCENAS (las arma armar.py) ═══════════════ -->\n" + "\n\n".join(T) + \
    '\n\n<script type="application/json" id="escenas">\n' + json.dumps(ESC, ensure_ascii=False, indent=1) + "\n</script>\n\n" + pie
open("storyboard.html", "w", encoding="utf-8").write(html)
print(f"{len(ESC)} escenas, {sum(e['dur'] for e in ESC):.1f} s")
