# Pasa las pantallas de la app en inglés (capturas/salida, de
# capturas/capturar.mjs) a img/, a 780 px de ancho (el teléfono simulado a 2x).
# Lo demás de img/ (emojis, lámpara, logos) es lo mismo del video en español:
# se rehace con ../juditoads-1/preparar-img.py y se copia.
import os
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
IMG, CAPTURAS = f"{D}/img", f"{D}/capturas/salida"
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
