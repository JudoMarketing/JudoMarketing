# Pone una voz grabada (la del dueño o un locutor) encima del video: la
# calza con un desfase, baja los efectos mientras la voz habla y deja la voz
# limpia y pareja.
# Uso: python3 voz.py salida/video.mp4 voz.m4a [--desfase 0.0] [--efectos -9]
#   --desfase  segundos que se corre la voz (negativo la adelanta)
#   --efectos  cuánto bajan los efectos debajo de la voz, en dB (por defecto -9)
# Sale salida/<video>-con-voz.mp4
import os, subprocess, sys

if len(sys.argv) < 3:
    sys.exit("Uso: python3 voz.py video.mp4 voz.(m4a|mp3|wav) [--desfase s] [--efectos dB]")
video, voz = sys.argv[1], sys.argv[2]
op = dict(zip(sys.argv[3::2], sys.argv[4::2]))
desfase = float(op.get("--desfase", 0))
efectos = float(op.get("--efectos", -9))
r = subprocess.run(["python3", "-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"], capture_output=True, text=True)
FF = r.stdout.strip() or "ffmpeg"
salida = os.path.splitext(video)[0] + "-con-voz.mp4"
retraso = max(0, int(desfase * 1000))
recorte = max(0, -desfase)
# La voz: filtro de graves, compresión suave y volumen parejo. Los efectos se
# comprimen con la voz como llave (bajan cuando ella habla).
voz_f = (f"[1:a]atrim=start={recorte},asetpts=PTS-STARTPTS,adelay={retraso}|{retraso},"
         "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-1.5:LRA=7,"
         "aformat=channel_layouts=stereo,asplit=2[vz][llave]")
fx_f = f"[0:a]volume={10 ** (efectos / 40):.3f}[fx];[fx][llave]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[fxb]"
mezcla = "[vz][fxb]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89[a]"
subprocess.run([FF, "-y", "-loglevel", "error", "-i", video, "-i", voz, "-filter_complex", f"{voz_f};{fx_f};{mezcla}",
                "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida], check=True)
print("listo:", salida)
