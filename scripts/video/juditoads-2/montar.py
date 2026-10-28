# Une las escenas con transiciones y pone el sonido
import json, os, subprocess
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "salida")
FF = subprocess.run(["python3", "-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"], capture_output=True, text=True).stdout.strip()
escenas = json.load(open(f"{P}/escenas.json"))
X = 0.25
# La transición de entrada de cada escena, según su plantilla
transiciones = {"f02": "smoothleft", "f03": "fade", "f04": "circleopen", "f05": "zoomin", "f06": "smoothup",
                "f17": "zoomin", "f07": "smoothup", "f08": "slideup", "f09": "smoothleft", "f10": "smoothleft",
                "f11": "smoothleft", "f12": "zoomin", "f18": "zoomin", "f13": "smoothup", "f14": "zoomin", "f16": "smoothup"}
entradas = []
for e in escenas: entradas += ["-i", f"{P}/clips/{e['id']}.mp4"]
entradas += ["-i", f"{P}/sonido.wav"]
filtros = []; prev = "[0:v]"; t = 0.0
for i, e in enumerate(escenas[1:], start=1):
    t += escenas[i - 1]["dur"]
    out = f"[v{i}]"
    filtros.append(f"{prev}[{i}:v]xfade=transition={transiciones.get(e['f'], 'fade')}:duration={X}:offset={t:.3f}{out}")
    prev = out
filtros.append(f"{prev}format=yuv420p[vf]")
salida = f"{P}/JuditoADS-video2-es.mp4"
cmd = [FF, "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtros), "-map", "[vf]", "-map", f"{len(escenas)}:a",
       "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-r", "60", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida]
subprocess.run(cmd, check=True)
print("listo:", salida)
