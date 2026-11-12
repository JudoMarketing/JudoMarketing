# Prueba de un guion de voz ANTES de entregarlo: lo lee una voz de prueba,
# pone cada frase en el segundo de su escena con calzar-voz.py y transcribe el
# resultado para ver qué se oye y dónde cae.
#
# Junior, 12 de noviembre de 2026: «crea una versión con el guion ya puesto de
# borrador, escúchala y verifica que el mensaje esté claro, concuerde con las
# imágenes y no deje ideas a medias o fuera de tiempo». Medir sílabas no
# alcanza: un guion de «Five cents» cabía en los tiempos y aun así cortaba las
# ideas y decía otra cosa que la pantalla.
#
# Uso (desde la carpeta del video, la que tiene voz.json y calzar-voz.py):
#   python3 ../borrador-voz.py voz.json [--salida carpeta]
#
# Necesita un entorno con piper-tts y faster-whisper (la primera vez baja la
# voz de Piper y el modelo de Whisper de Hugging Face):
#   python3 -m venv ~/.voz-prueba && ~/.voz-prueba/bin/pip install piper-tts faster-whisper
#   VOZ_PRUEBA=~/.voz-prueba python3 ../borrador-voz.py voz.json
#
# Deja en --salida (por defecto ./salida/borrador):
#   bloque-N.wav            los bloques leídos por la voz de prueba
#   <video>-borrador.mp4    el video con la voz de prueba calzada
#   transcripcion.txt       lo que se oye, con sus segundos
# y escribe en pantalla la tabla de calzar-voz.py (qué frase se acelera o entra
# tarde) y la transcripción al lado de la escena que le toca.
#
# Ojo: la voz de prueba es robótica y pronuncia mal nombres como «Judito» o
# «guru»; Whisper los oye raro. Lo que se revisa aquí es que cada frase sea una
# idea completa, que diga lo que muestra su escena y que entre a tiempo, no la
# pronunciación (esa la da ElevenLabs).
import json, os, subprocess, sys, urllib.request

if len(sys.argv) < 2:
    sys.exit("Uso: python3 borrador-voz.py voz.json [--salida carpeta]")
ruta = os.path.abspath(sys.argv[1])
carpeta = os.path.dirname(ruta)
op = dict(zip(sys.argv[2::2], sys.argv[3::2]))
sal = os.path.abspath(op.get("--salida", os.path.join(carpeta, "salida", "borrador")))
os.makedirs(sal, exist_ok=True)
venv = os.path.expanduser(os.environ.get("VOZ_PRUEBA", "~/.voz-prueba"))
py, piper = os.path.join(venv, "bin", "python"), os.path.join(venv, "bin", "piper")
if not os.path.exists(piper):
    sys.exit(f"Falta el entorno de la voz de prueba en {venv} (ver el encabezado de este script).")

cfg = json.load(open(ruta, encoding="utf-8"))
idioma = cfg.get("idioma", "es")
VOCES = {"en": "en/en_US/ryan/high/en_US-ryan-high", "es": "es/es_MX/claude/high/es_MX-claude-high"}
base = VOCES.get(idioma, VOCES["es"])
modelo = os.path.join(venv, os.path.basename(base) + ".onnx")
for ext in (".onnx", ".onnx.json"):
    destino = modelo if ext == ".onnx" else modelo + ".json"
    if not os.path.exists(destino):
        print("bajando la voz de prueba", os.path.basename(destino))
        urllib.request.urlretrieve(f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{base}{ext}", destino)

silencio = os.path.join(sal, "silencio.wav")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
                "-t", "0.5", silencio], check=True)
bloques = []
for i, b in enumerate(cfg["bloques"], 1):
    partes = []
    for j, f in enumerate(b):
        w = os.path.join(sal, f"b{i}_{j}.wav")
        subprocess.run([piper, "-m", modelo, "-f", w], input=f["texto"], text=True, capture_output=True, check=True)
        partes.append(w)
    lista = os.path.join(sal, f"lista-{i}.txt")
    with open(lista, "w") as fh:
        for k, p in enumerate(partes):
            fh.write(f"file '{p}'\n")
            if k < len(partes) - 1:
                fh.write(f"file '{silencio}'\n")
    salida_bloque = os.path.join(sal, f"bloque-{i}.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista,
                    "-ar", "22050", salida_bloque], check=True)
    bloques.append(salida_bloque)

subprocess.run(["python3", os.path.join(carpeta, "calzar-voz.py"), ruta, *bloques], check=True, cwd=carpeta)
video = os.path.join(carpeta, cfg["video"])
con_voz = os.path.splitext(video)[0] + "-con-voz.mp4"
borrador = os.path.join(sal, os.path.basename(os.path.splitext(video)[0]) + "-borrador.mp4")
os.replace(con_voz, borrador)

transcribir = f"""
from faster_whisper import WhisperModel
m = WhisperModel({'"small.en"' if idioma == "en" else '"small"'}, device="cpu", compute_type="int8")
segs, _ = m.transcribe({borrador!r}{'' if idioma == 'en' else ', language="es"'})
for s in segs:
    print(f"{{s.start:5.1f}}\\t{{s.end:5.1f}}\\t{{s.text.strip()}}")
"""
r = subprocess.run([py, "-c", transcribir], capture_output=True, text=True, check=True)
oido = [l.split("\t") for l in r.stdout.strip().splitlines() if l.count("\t") == 2]
open(os.path.join(sal, "transcripcion.txt"), "w").write(r.stdout)

frases = [f for b in cfg["bloques"] for f in b]
print("\nLo que se oye, al lado de la escena que le toca:\n")
for k, f in enumerate(frases):
    fin = frases[k + 1]["t"] if k + 1 < len(frases) else cfg["fin"]
    aqui = [t for a, z, t in oido if f["t"] - 0.3 <= float(a) < fin - 0.2]
    print(f"{f['t']:5.1f}–{fin:5.1f}  guion: {f['texto']}")
    print(f"             se oye: {' / '.join(aqui) or '(nada: revisar)'}\n")
print("borrador:", borrador)
