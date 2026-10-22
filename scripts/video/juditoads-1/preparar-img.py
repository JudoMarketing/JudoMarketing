# Prepara las imágenes del video en img/ a partir de sus fuentes:
#  - pantallas de JuditoADS (capturas/salida, de capturas/capturar.mjs)
#  - emojis 3D de Microsoft Fluent (licencia MIT), bajados a fuentes/
#  - la lámpara 3D (fuentes/lampara.png, de lampara/render.mjs)
#  - los logos de Judo Marketing y de JuditoADS
# Cada parte se hace solo si su fuente existe; lo demás queda como está en img/.
import os, subprocess, urllib.parse
from PIL import Image, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
IMG, FUENTES, CAPTURAS = f"{D}/img", f"{D}/fuentes", f"{D}/capturas/salida"
REPO = os.path.abspath(f"{D}/../../..")
JADS = os.environ.get("JADS_REPO", "/home/user/judito-ads")
os.makedirs(FUENTES, exist_ok=True)

# Pantallas de la app a 780 px de ancho (el teléfono simulado a 2x)
PANTALLAS = {"01b-login": "login", "02-inicio": "panel", "16-cuentas-lista": "cuentas-lista", "07-paso3": "paso3",
             "17-presupuesto-dia": "presupuesto-dia", "18-presupuesto-total": "presupuesto-total", "14b-confirmar": "lista"}
for src, dst in PANTALLAS.items():
    if os.path.exists(f"{CAPTURAS}/{src}.png"):
        Image.open(f"{CAPTURAS}/{src}.png").convert("RGB").save(f"{IMG}/{dst}.webp", "WEBP", quality=93)
        print("pantalla", dst)
if os.path.exists(f"{CAPTURAS}/00-landing-full.png"):
    lf = Image.open(f"{CAPTURAS}/00-landing-full.png").convert("RGB")
    lf.crop((0, 0, 780, min(lf.height, 3470))).save(f"{IMG}/landing-largo.webp", "WEBP", quality=92)
    print("pantalla landing-largo")

# Emojis 3D de Fluent (github.com/microsoft/fluentui-emoji, MIT)
FLUENT = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets"
for ruta in ["Man genie/3D/man_genie_3d.png", "Glasses/3D/glasses_3d.png", "Hamburger/3D/hamburger_3d.png",
             "Bust in silhouette/3D/bust_in_silhouette_3d.png", "Light bulb/3D/light_bulb_3d.png",
             "Round pushpin/3D/round_pushpin_3d.png", "Cloud/3D/cloud_3d.png"]:
    f = f"{FUENTES}/{os.path.basename(ruta)}"
    if not os.path.exists(f):
        subprocess.run(["curl", "-sfL", "-o", f, f"{FLUENT}/{urllib.parse.quote(ruta)}"], check=True)

# El genio lleva los lentes de Fluent puestos encima
g = Image.open(f"{FUENTES}/man_genie_3d.png").convert("RGBA")
gl = Image.open(f"{FUENTES}/glasses_3d.png").convert("RGBA")
gl = gl.crop(gl.getbbox()); w = 96
gl = gl.resize((w, int(gl.height * w / gl.width)), Image.LANCZOS)
genio = g.copy(); genio.alpha_composite(gl, (128 - w // 2, 88 - gl.height // 2))
genio.save(f"{FUENTES}/genio-lentes.png")

# Íconos de 256 px agrandados con Lanczos y un enfoque suave
def subir(src, dst, lado, enfoque=True):
    im = Image.open(src).convert("RGBA").resize((lado, lado), Image.LANCZOS)
    if enfoque:
        r, g, b, a = im.split()
        rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        im = Image.merge("RGBA", (*rgb.split(), a))
    im.save(f"{IMG}/{dst}", "WEBP", quality=94)
subir(f"{FUENTES}/genio-lentes.png", "genio.webp", 640)
subir(f"{FUENTES}/hamburger_3d.png", "hamburguesa.webp", 420)
subir(f"{FUENTES}/bust_in_silhouette_3d.png", "persona.webp", 256, False)
subir(f"{FUENTES}/light_bulb_3d.png", "foco.webp", 160, False)
subir(f"{FUENTES}/round_pushpin_3d.png", "pin.webp", 256, False)
subir(f"{FUENTES}/cloud_3d.png", "nube.webp", 400)
print("emojis 3D")

if os.path.exists(f"{FUENTES}/lampara.png"):
    l = Image.open(f"{FUENTES}/lampara.png").convert("RGBA")
    l.crop(l.getbbox()).save(f"{IMG}/lampara.webp", "WEBP", quality=94)
    print("lámpara")

# Logos: el de Judo en blanco y en negro (para la etiqueta blanca del mapa)
lg = Image.open(f"{REPO}/public/brand/logo-white-transparent.png").convert("RGBA")
lg.save(f"{IMG}/judo-logo.webp", "WEBP", quality=94)
negro = Image.new("RGBA", lg.size, (16, 12, 24, 255)); negro.putalpha(lg.split()[3])
negro = negro.crop(negro.getbbox()); negro.thumbnail((300, 300))
negro.save(f"{IMG}/judo-logo-negro.webp", "WEBP", quality=94)
if os.path.exists(f"{JADS}/public/brand/juditoads.png"):
    Image.open(f"{JADS}/public/brand/juditoads.png").convert("RGB").resize((820, 820), Image.LANCZOS).save(f"{IMG}/juditoads.webp", "WEBP", quality=93)
print("logos")
