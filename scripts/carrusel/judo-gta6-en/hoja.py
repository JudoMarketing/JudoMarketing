# Una sola imagen con todas las láminas en fila, para mirarlas juntas como se
# ven al deslizar. Uso: python3 hoja.py   → salida/hoja.jpg
import glob, os
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
fs = sorted(glob.glob(os.path.join(D, "salida", "[0-9][0-9].png")))
if not fs:
    raise SystemExit("No hay láminas: corre node render.mjs")
ims = [Image.open(f).convert("RGB") for f in fs]
w = 360; h = round(ims[0].height * w / ims[0].width); sep = 12
hoja = Image.new("RGB", (len(ims) * (w + sep) + sep, h + 2 * sep), (20, 20, 28))
for i, im in enumerate(ims):
    hoja.paste(im.resize((w, h)), (sep + i * (w + sep), sep))
hoja.save(os.path.join(D, "salida", "hoja.jpg"), quality=88)
print("salida/hoja.jpg")
