# Une las escenas con sus transiciones y pone el sonido.
# Uso: python3 montar.py [nombre-del-video]   → salida/<nombre>.mp4
# Transiciones (data-entrada de cada plantilla): fade, fadeblack, zoomin,
# smoothleft, smoothright, smoothup, smoothdown, slideup, slideleft,
# circleopen, wipeleft, o «corte» para un corte seco.
import json, os, re, subprocess, sys

D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, "salida")


def ffmpeg():
    r = subprocess.run(["python3", "-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"], capture_output=True, text=True)
    return r.stdout.strip() or "ffmpeg"


FF = ffmpeg()
escenas = json.load(open(os.path.join(P, "escenas.json"), encoding="utf-8"))
nombre = sys.argv[1] if len(sys.argv) > 1 else re.sub(r"[^a-z0-9]+", "-", os.path.basename(D).lower()).strip("-") or "video"
faltan = [e["id"] for e in escenas if not os.path.exists(os.path.join(P, "clips", f"{e['id']}.mp4"))]
if faltan:
    sys.exit(f"Faltan clips: {', '.join(faltan)}. Corre node render.mjs {' '.join(faltan)}")
if not os.path.exists(os.path.join(P, "sonido.wav")):
    sys.exit("Falta salida/sonido.wav: corre python3 sfx.py")

entradas = []
for e in escenas:
    entradas += ["-i", os.path.join(P, "clips", f"{e['id']}.mp4")]
entradas += ["-i", os.path.join(P, "sonido.wav")]
filtros, prev, t = [], "[0:v]", 0.0
for i, e in enumerate(escenas[1:], start=1):
    t += escenas[i - 1]["dur"]
    tipo, dur = (("fade", 0.04) if e.get("entrada") == "corte" else (e.get("entrada") or "fade", 0.25))
    # La escena nueva siempre arranca en su segundo (el sonido cuenta con eso);
    # en un corte seco se pierde la cola de la anterior.
    filtros.append(f"{prev}[{i}:v]xfade=transition={tipo}:duration={dur}:offset={t:.3f}[v{i}]")
    prev = f"[v{i}]"
filtros.append(f"{prev}format=yuv420p[vf]")
salida = os.path.join(P, f"{nombre}.mp4")
subprocess.run([FF, "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtros), "-map", "[vf]", "-map", f"{len(escenas)}:a",
                "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-r", "60",
                "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida], check=True)
print("listo:", salida)
