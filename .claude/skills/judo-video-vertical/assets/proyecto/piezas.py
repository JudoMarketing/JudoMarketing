# Piezas vectoriales de la capa pro, listas para pegar en una plantilla del
# storyboard (references/estilo-pro.md). Imprime el SVG.
# Uso:
#   python3 piezas.py moneda                   una moneda dorada con su $
#   python3 piezas.py tarjeta                  una tarjeta de crédito genérica
#   python3 piezas.py grafica                  la gráfica que se dibuja (va dentro de .tablero)
#   python3 piezas.py capa ARRIBA IZQ DER ICONO [COLOR]
#                                              una capa isométrica con un icono acostado
#                                              (ej.: capa "#8a5cff" "#5b2df0" "#3f17c2" gear-six "#fff")
#   python3 piezas.py icono NOMBRE             el icono Phosphor en línea (si hace falta
#                                              dentro de otro SVG; en HTML usa .ico)
# Los iconos están en vectores/ (Phosphor, licencia MIT, vectores/LICENSE.txt).
import os, re, sys

D = os.path.dirname(os.path.abspath(__file__))


def icono(nombre):
    ruta = os.path.join(D, "vectores", f"{nombre}.svg")
    if not os.path.exists(ruta):
        sys.exit(f"No está vectores/{nombre}.svg. Los que hay: " + ", ".join(sorted(f[:-4] for f in os.listdir(os.path.join(D, "vectores")) if f.endswith(".svg"))))
    return open(ruta, encoding="utf-8").read().strip().replace("<svg ", '<svg aria-hidden="true" ', 1)


def trazos(nombre):
    return re.search(r"<svg[^>]*>(.*)</svg>", icono(nombre), re.S).group(1)


def capa(arriba, izq, der, nombre, color="#fff", h=36):
    a = 115.47
    mat = f"matrix({100 / 256:.4f} {57.735 / 256:.4f} {-100 / 256:.4f} {57.735 / 256:.4f} 100 0)"
    return (f'<svg viewBox="0 0 200 {a + h:.2f}" aria-hidden="true">'
            f'<polygon points="0,57.74 100,{a} 100,{a + h} 0,{57.74 + h}" fill="{izq}"/>'
            f'<polygon points="100,{a} 200,57.74 200,{57.74 + h} 100,{a + h}" fill="{der}"/>'
            f'<polygon points="100,0 200,57.74 100,{a} 0,57.74" fill="{arriba}"/>'
            '<polyline points="0,57.74 100,0 200,57.74" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>'
            f'<polyline points="0,57.74 100,{a} 200,57.74" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>'
            f'<g transform="{mat}"><g transform="translate(64 64) scale(.5)" fill="{color}">{trazos(nombre)}</g></g></svg>')


def moneda():
    return ('<svg viewBox="0 0 200 200" aria-hidden="true"><defs>'
            '<linearGradient id="mo-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset=".45" stop-color="#f6c443"/><stop offset="1" stop-color="#a8700c"/></linearGradient>'
            '<linearGradient id="mo-b" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffefaa"/><stop offset=".55" stop-color="#e3a926"/><stop offset="1" stop-color="#9c6608"/></linearGradient></defs>'
            '<circle cx="100" cy="100" r="96" fill="url(#mo-a)"/><circle cx="100" cy="100" r="79" fill="url(#mo-b)"/>'
            '<circle cx="100" cy="100" r="79" fill="none" stroke="#fff7d6" stroke-opacity=".55" stroke-width="2"/>'
            '<circle cx="100" cy="100" r="88" fill="none" stroke="#8a5a06" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="3 5"/>'
            f'<g transform="translate(46 46) scale(.42)" fill="#7a4d04">{trazos("currency-dollar")}</g>'
            '<ellipse cx="72" cy="58" rx="34" ry="14" fill="#fff" fill-opacity=".28" transform="rotate(-30 72 58)"/></svg>')


def tarjeta():
    puntos = "".join(f'<circle cx="{34 + g * 62 + k * 11}" cy="156" r="3.6" fill="#fff" fill-opacity=".75"/>' for g in range(3) for k in range(4))
    return ('<svg viewBox="0 0 340 214" aria-hidden="true"><defs>'
            '<linearGradient id="tj-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2442"/><stop offset="1" stop-color="#0b0b12"/></linearGradient>'
            '<radialGradient id="tj-b" cx=".9" cy="0" r=".95"><stop offset="0" stop-color="#7b4dff" stop-opacity=".75"/><stop offset="1" stop-color="#7b4dff" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="tj-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe3a0"/><stop offset="1" stop-color="#c59a3a"/></linearGradient></defs>'
            '<rect width="340" height="214" rx="22" fill="url(#tj-a)"/><rect width="340" height="214" rx="22" fill="url(#tj-b)"/>'
            '<rect x="1" y="1" width="338" height="212" rx="21" fill="none" stroke="#fff" stroke-opacity=".14"/>'
            '<rect x="30" y="72" width="50" height="38" rx="7" fill="url(#tj-c)"/>'
            '<path d="M30 91h50M48 72v38M62 72v38" stroke="#8a6a20" stroke-opacity=".5" stroke-width="1.5"/>'
            '<path d="M98 80a16 16 0 0 1 0 22M106 74a26 26 0 0 1 0 34M114 68a36 36 0 0 1 0 46" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round"/>'
            + puntos + '<rect x="222" y="148" width="58" height="16" rx="8" fill="#fff" fill-opacity=".8"/>'
            '<circle cx="270" cy="186" r="15" fill="#fff" fill-opacity=".3"/><circle cx="290" cy="186" r="15" fill="#fff" fill-opacity=".5"/>'
            '<rect x="30" y="182" width="110" height="9" rx="4.5" fill="#fff" fill-opacity=".35"/></svg>')


def grafica():
    rayas = "".join(f'<line x1="0" x2="300" y1="{y}" y2="{y}" stroke="#ebe8f2" stroke-width="1" stroke-dasharray="3 5"/>' for y in (18, 52, 86))
    curva = "M0 90 C28 86 44 70 70 73 S114 60 140 52 S188 41 214 30 S264 20 300 10"
    return ('<svg viewBox="0 0 300 104" aria-hidden="true"><defs><linearGradient id="gr-a" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#12b76a" stop-opacity=".28"/><stop offset="1" stop-color="#12b76a" stop-opacity="0"/></linearGradient></defs>'
            + rayas + f'<path class="area-pro" style="--d:1.2s" d="{curva} L300 104 L0 104 Z" fill="url(#gr-a)"/>'
            f'<path class="trazo-pro" style="--d:.8s" pathLength="1" d="{curva}"/>'
            '<g class="punto-vivo" style="--d:2.1s"><circle cx="300" cy="10" r="11" fill="#12b76a" fill-opacity=".2"/><circle cx="300" cy="10" r="5" fill="#12b76a"/></g></svg>')


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__ or open(__file__, encoding="utf-8").read().split("import os")[0])
    if a[0] == "moneda": print(moneda())
    elif a[0] == "tarjeta": print(tarjeta())
    elif a[0] == "grafica": print(grafica())
    elif a[0] == "icono" and len(a) == 2: print(icono(a[1]))
    elif a[0] == "capa" and len(a) >= 5: print(capa(a[1], a[2], a[3], a[4], *(a[5:6] or ["#fff"])))
    else: sys.exit("No entiendo. Mira el uso al principio de piezas.py.")
