# Hojas de revisión del video final: un cuadro cada 2 s y los cuadros de
# justo antes de cada corte. Míralas antes de entregar.
# Uso: python3 qa.py salida/video.mp4 [--portada 2.8]
#   → salida/qa-cada2s.jpg, salida/qa-cortes.jpg y salida/portada.jpg
# La portada sale del segundo 0,4 si no se pide otro. Elige uno donde el
# gancho ya está entero (el texto completo, el objeto quieto).
import io, json, os, subprocess, sys
from PIL import Image, ImageDraw

D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, "salida")
args = sys.argv[1:]
PORTADA = float(args[args.index("--portada") + 1]) if "--portada" in args else 0.4
args = [a for i, a in enumerate(args) if a != "--portada" and (i == 0 or args[i - 1] != "--portada")]
mp4 = args[0] if args else sys.exit("Uso: python3 qa.py salida/video.mp4 [--portada 2.8]")
r = subprocess.run(["python3", "-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"], capture_output=True, text=True)
FF = r.stdout.strip() or "ffmpeg"
esc = json.load(open(os.path.join(P, "escenas.json"), encoding="utf-8"))
total = sum(e["dur"] for e in esc)
cada2 = [(x * 2.0, f"{x * 2:.0f}s") for x in range(int(total // 2) + 1)]
t, cortes = 0.0, []
for e in esc:
    t += e["dur"]; cortes.append((round(t - 0.3, 2), f"{e['id']} {t - 0.3:.1f}s"))


def cuadro(seg):
    out = subprocess.run([FF, "-loglevel", "error", "-ss", str(seg), "-i", mp4, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    return Image.open(io.BytesIO(out.stdout)).convert("RGB")


for nombre, lista in (("cada2s", cada2), ("cortes", cortes)):
    W, H, C = 180, 320, 8
    filas = (len(lista) + C - 1) // C
    hoja = Image.new("RGB", (W * C, (H + 18) * filas), (20, 20, 28)); d = ImageDraw.Draw(hoja)
    for k, (seg, etq) in enumerate(lista):
        try:
            im = cuadro(seg).resize((W, H))
        except Exception:
            continue
        c, f = k % C, k // C
        hoja.paste(im, (c * W, f * (H + 18) + 18)); d.text((c * W + 4, f * (H + 18) + 3), etq, fill=(255, 255, 0))
    hoja.save(os.path.join(P, f"qa-{nombre}.jpg"), quality=86)
cuadro(PORTADA).save(os.path.join(P, "portada.jpg"), quality=92)
print("Hojas en salida/qa-cada2s.jpg y salida/qa-cortes.jpg; portada en salida/portada.jpg")
