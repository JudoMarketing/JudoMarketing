# Pone la marca de una empresa en un proyecto (storyboard del video o
# carrusel): reescribe el bloque de variables CSS y el de las letras, copia el
# logo a marca/ y mide el contraste.
# Uso: python3 aplicar-marca.py marca.json storyboard.html
import json, os, re, shutil, ssl, sys, urllib.parse, urllib.request

if len(sys.argv) < 3:
    sys.exit("Uso: python3 aplicar-marca.py marca.json archivo.html")
ruta_marca, ruta_html = sys.argv[1], sys.argv[2]
m = json.load(open(ruta_marca, encoding="utf-8"))
html = open(ruta_html, encoding="utf-8").read()


def lum(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contraste(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)


def mover(h, k):
    h = h.lstrip("#")
    return "#" + "".join(f"{max(0, min(255, int(h[i:i + 2], 16) + k)):02x}" for i in (0, 2, 4))


fondo = m.get("fondo", "#0d0a17")
oscuro = lum(fondo) < 0.2
texto = m.get("texto", "#ffffff" if oscuro else "#141414")
acento = m.get("acento", "#ffc533")
acento_texto = m.get("acento-texto", "#141414")
primario = m.get("primario", acento)
display = m.get("fuente-display", "Archivo")
cuerpo = m.get("fuente-cuerpo", "Inter")

# ── Letras: se prueba que Google Fonts las tenga, de más pesos a menos ──
def contexto_ssl():
    for ca in (os.environ.get("SSL_CERT_FILE"), os.environ.get("REQUESTS_CA_BUNDLE"), "/root/.ccr/ca-bundle.crt"):
        if ca and os.path.exists(ca):
            return ssl.create_default_context(cafile=ca)
    return ssl.create_default_context()


def existe(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15, context=contexto_ssl()) as r:
            return r.status == 200
    except Exception as e:  # sin red o sin la familia
        return None if "urlopen error" in str(e) and "HTTP" not in str(e) else False


def familia(nombre, pesos):
    base = urllib.parse.quote_plus(nombre)
    for p in pesos:
        parte = f"family={base}:wght@{p}" if p else f"family={base}"
        estado = existe(f"https://fonts.googleapis.com/css2?{parte}&display=swap")
        if estado is None:
            print(f"  · No pude comprobar {nombre} (sin red): la dejo con todos los pesos.")
            return parte
        if estado:
            return parte
    print(f"  ⚠ Google Fonts no tiene «{nombre}». Uso Inter en su lugar.")
    return None


partes = []
f_display = familia(display, ["500;600;700;800;900", "400;700", ""])
if not f_display:
    display, f_display = "Inter", "family=Inter:wght@500;600;700;800;900"
partes.append(f_display)
if cuerpo != display:
    f_cuerpo = familia(cuerpo, ["400;500;600;700", "400;700", ""])
    if not f_cuerpo:
        cuerpo, f_cuerpo = "Inter", "family=Inter:wght@400;500;600;700"
    partes.append(f_cuerpo)
fuentes = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{"&".join(partes)}&display=swap">')

variables = f""":root {{
  --fondo: {fondo};
  --superficie: {m.get("superficie", mover(fondo, 14 if oscuro else -10))};
  --texto: {texto};
  --acento: {acento};
  --acento-texto: {acento_texto};
  --primario: {primario};
  --primario-hondo: {mover(primario, -40)};
  --ok: {m.get("ok", "#34d399")};
  --alerta: {m.get("alerta", "#ff4d4d")};
  --f-display: "{display}", "Arial Narrow", Arial, sans-serif;
  --f-cuerpo: "{cuerpo}", "Segoe UI", Arial, sans-serif;
  --ancho-display: {m.get("ancho-display", "112%" if display == "Archivo" else "100%")};
  --sombra-texto: {"0 .6cqw 2.4cqw rgba(0,0,0,.55)" if oscuro else "none"};
  --esquema: {"dark" if oscuro else "light"};
}}"""

n1 = len(re.findall(r"/\* MARCA:INICIO \*/.*?/\* MARCA:FIN \*/", html, flags=re.S))
n2 = len(re.findall(r"<!-- FUENTES:INICIO -->.*?<!-- FUENTES:FIN -->", html, flags=re.S))
if n1 != 1 or n2 != 1:
    sys.exit("El HTML no tiene los bloques MARCA y FUENTES (uno de cada uno).")
html = re.sub(r"/\* MARCA:INICIO \*/.*?/\* MARCA:FIN \*/", lambda _: f"/* MARCA:INICIO */\n{variables}\n/* MARCA:FIN */", html, flags=re.S)
html = re.sub(r"<!-- FUENTES:INICIO -->.*?<!-- FUENTES:FIN -->", lambda _: f"<!-- FUENTES:INICIO -->\n{fuentes}\n<!-- FUENTES:FIN -->", html, flags=re.S)
open(ruta_html, "w", encoding="utf-8").write(html)

# ── El logo a marca/ junto al HTML ──
logo = m.get("logo")
if logo:
    origen = logo if os.path.isabs(logo) else os.path.join(os.path.dirname(os.path.abspath(ruta_marca)), logo)
    if os.path.exists(origen):
        destino = os.path.join(os.path.dirname(os.path.abspath(ruta_html)), "marca")
        os.makedirs(destino, exist_ok=True)
        ext = os.path.splitext(origen)[1].lower() or ".png"
        if os.path.abspath(origen) != os.path.abspath(os.path.join(destino, "logo" + ext)):
            shutil.copy(origen, os.path.join(destino, "logo" + ext))
        print(f"  · Logo copiado a marca/logo{ext}")
    else:
        print(f"  ⚠ No encontré el logo en {origen}")

# ── Contraste ──
print(f"Marca «{m.get('nombre', '')}» aplicada en {ruta_html}")
for nombre, a, b, minimo in (("texto sobre fondo", texto, fondo, 4.5), ("letra sobre acento", acento_texto, acento, 4.5),
                             ("acento sobre fondo", acento, fondo, 3.0)):
    c = contraste(a, b)
    print(f"  {'✓' if c >= minimo else '⚠'} {nombre}: {c:.2f}:1 (mínimo {minimo}:1)")
