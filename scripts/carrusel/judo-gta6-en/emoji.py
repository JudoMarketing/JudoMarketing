# Baja un emoji 3D de Microsoft Fluent (licencia MIT) por su nombre en inglés
# y lo deja listo para usar (WEBP con un enfoque suave).
# Uso: python3 emoji.py "light bulb" img/foco.webp [--lado 320]
# El nombre es el de la carpeta del repositorio fluentui-emoji: en inglés, con
# espacios, sin apóstrofos ni puntos ("Nine oclock", "Bullseye" para 🎯).
# Prueba variantes solas (mayúscula inicial, tono de piel por defecto). Si no
# lo encuentra, dice dónde buscar el nombre.
import io, os, ssl, sys, urllib.parse, urllib.request
from PIL import Image, ImageFilter

if len(sys.argv) < 3:
    sys.exit('Uso: python3 emoji.py "light bulb" img/foco.webp [--lado 320]')
nombre, destino = sys.argv[1].strip(), sys.argv[2]
lado = int(sys.argv[sys.argv.index("--lado") + 1]) if "--lado" in sys.argv else 320
BASE = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets"


def contexto():
    for ca in (os.environ.get("SSL_CERT_FILE"), os.environ.get("REQUESTS_CA_BUNDLE"), "/root/.ccr/ca-bundle.crt"):
        if ca and os.path.exists(ca):
            return ssl.create_default_context(cafile=ca)
    return ssl.create_default_context()


def bajar(ruta):
    try:
        with urllib.request.urlopen(f"{BASE}/{urllib.parse.quote(ruta)}", timeout=20, context=contexto()) as r:
            return r.read()
    except Exception:
        return None


carpeta = nombre[0].upper() + nombre[1:].lower().replace("'", "").replace("’", "").replace(".", "")
archivo = carpeta.lower().replace(" ", "_").replace("-", "_")
datos = None
for ruta in (f"{carpeta}/3D/{archivo}_3d.png", f"{carpeta}/Default/3D/{archivo}_3d_default.png"):
    datos = bajar(ruta)
    if datos:
        break
if not datos:
    sys.exit(f"No encontré «{nombre}». Busca el nombre exacto de la carpeta en "
             "https://github.com/microsoft/fluentui-emoji/tree/main/assets o en references/emojis.md.")
im = Image.open(io.BytesIO(datos)).convert("RGBA").resize((lado, lado), Image.LANCZOS)
r, g, b, a = im.split()
rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.UnsharpMask(radius=2, percent=50, threshold=2))
os.makedirs(os.path.dirname(os.path.abspath(destino)), exist_ok=True)
Image.merge("RGBA", (*rgb.split(), a)).save(destino, "WEBP", quality=94)
print(f"{destino} ({lado} px) desde «{carpeta}»")
