# Arma una sola página con las imágenes adentro (data URI), para enseñar el
# storyboard donde no se pueden subir carpetas (un artifact de claude.ai, un
# correo). Los videos reales no se incrustan: se ven como su primer cuadro.
# Uso: python3 incrustar.py storyboard.html salida/storyboard-unico.html
import base64, mimetypes, os, re, sys

src, dst = (sys.argv[1:3] + [None, None])[:2]
if not src or not dst:
    sys.exit("Uso: python3 incrustar.py storyboard.html salida/storyboard-unico.html")
base = os.path.dirname(os.path.abspath(src))
html = open(src, encoding="utf-8").read()


def dato(m):
    ruta = os.path.join(base, m.group(2))
    if not os.path.exists(ruta):
        return m.group(0)
    tipo = mimetypes.guess_type(ruta)[0] or "image/webp"
    return f'{m.group(1)}="data:{tipo};base64,{base64.b64encode(open(ruta, "rb").read()).decode()}"'


html = re.sub(r'(src)="((?:img|marca|fotos)/[^"]+)"', dato, html)
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
open(dst, "w", encoding="utf-8").write(html)
print(f"{dst}: {os.path.getsize(dst) / 1e6:.1f} MB")
