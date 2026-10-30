# La voz de cada frase, en el segundo de su escena.
#
# Los tiempos y las frases viven en voz.json (uno por video):
#   {"video": "salida/video.mp4", "fin": 56.1, "silabas_por_segundo": 5.5,
#    "bloques": [[{"t": 0.0, "texto": "Te llegué por…"}, {"t": 2.6, "texto": "…"}], […]]}
# "t" es el segundo en que empieza la escena de esa frase (sale de
# salida/escenas.json del video final, no del storyboard). Cada bloque es una
# generación de ElevenLabs.
#
# Uso:
#   python3 calzar-voz.py voz.json --guion
#       Mide cada frase contra su escena (sílabas ÷ sílabas por segundo) y
#       escribe los bloques para ElevenLabs con las pausas que calzan.
#   python3 calzar-voz.py voz.json bloque-1.mp3 bloque-2.mp3 …
#       Corta cada bloque en sus frases (por los silencios más largos), pone
#       cada frase en el segundo de su escena (si no cabe, la acelera hasta un
#       12 %) y mezcla la voz con el video con voz.py.
import json, os, re, subprocess, sys

D = os.path.dirname(os.path.abspath(__file__))
FF = subprocess.run(["python3", "-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"],
                    capture_output=True, text=True).stdout.strip() or "ffmpeg"
ACELERA_MAX = 1.12


def silabas(texto):
    """Cuenta aproximada de sílabas en español: grupos de vocales, con los
    hiatos (dos vocales fuertes o una débil con tilde) contados como dos."""
    t = re.sub(r"(?i)juditoads", "juditoeids", texto.lower())
    t = re.sub(r"[^a-záéíóúüñ ]", " ", t)
    n = 0
    for palabra in t.split():
        for g in re.findall(r"[aeiouáéíóúü]+", palabra):
            fuertes = sum(c in "aeoáéóíú" for c in g)
            n += max(1, fuertes) if len(g) > 1 else 1
    return n


def habla(texto, sps):
    """Segundos que tarda en decirse, sin el silencio del final."""
    cuerpo = texto.rstrip(" .…!?")
    pausas = len(re.findall(r"(\.\.\.|…|[,:;.?!])\s", cuerpo))
    return silabas(texto) / sps + 0.25 * pausas


def frases(cfg):
    planas = [f for b in cfg["bloques"] for f in b]
    siguientes = [f["t"] for f in planas[1:]] + [cfg["fin"]]
    for f, sig in zip(planas, siguientes):
        f["hueco"] = round(sig - f["t"], 2)
    return planas


def guion(cfg):
    sps = cfg.get("silabas_por_segundo", 5.5)
    frases(cfg)
    malas = 0
    print(f"{'escena':>13}  {'hueco':>5}  {'voz':>5}  frase")
    for b in cfg["bloques"]:
        for f in b:
            d = habla(f["texto"], sps)
            ok = d <= f["hueco"] * 0.95
            malas += not ok
            print(f"{f['t']:5.1f}–{f['t'] + f['hueco']:5.1f}  {f['hueco']:4.1f}s  {d:4.1f}s  {'' if ok else '⚠ NO CABE  '}{f['texto']}")
    print()
    for i, b in enumerate(cfg["bloques"], 1):
        partes = []
        for j, f in enumerate(b):
            partes.append(f["texto"])
            if j < len(b) - 1:
                # Al menos 0,6 s: más que la pausa de una coma, para poder cortar ahí
                pausa = min(2.0, max(0.6, round(f["hueco"] - habla(f["texto"], sps), 1)))
                partes.append(f'<break time="{pausa}s" />\n')
        print(f"── Bloque {i} · {b[0]['t']:.1f} s a {b[-1]['t'] + b[-1]['hueco']:.1f} s ──")
        print(" ".join(partes).replace(" \n ", "\n").replace("\n ", "\n"))
        print()
    if malas:
        sys.exit(f"{malas} frases no caben en su escena: recórtalas (no se alarga la escena).")


def tramos_de_voz(archivo):
    """Los tramos con voz de un audio: [(inicio, fin)]."""
    r = subprocess.run([FF, "-i", archivo, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"],
                       capture_output=True, text=True)
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).groups()
    largo = int(h) * 3600 + int(m) * 60 + float(s)
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    tramos, cursor = [], 0.0
    for a, b in zip(ini, fin + [largo] * (len(ini) - len(fin))):
        if a - cursor > 0.05:
            tramos.append((cursor, a))
        cursor = b
    if largo - cursor > 0.05:
        tramos.append((cursor, largo))
    return tramos


def partir(tramos, esperado):
    """Junta los tramos en tantas frases como trae el bloque. Corta en los
    silencios largos que dejan frases del largo esperado (una coma o unos «...»
    también hacen silencio, pero más corto y en otro lugar)."""
    n = len(esperado)
    if len(tramos) < n:
        raise ValueError(f"el audio tiene {len(tramos)} tramos de voz y el bloque {n} frases")
    huecos = [tramos[i + 1][0] - tramos[i][1] for i in range(len(tramos) - 1)]
    total, total_esp = tramos[-1][1] - tramos[0][0], sum(esperado)

    def grupos_de(cortes):
        g, desde = [], 0
        for c in list(cortes) + [len(tramos) - 1]:
            g.append((tramos[desde][0], tramos[c][1])); desde = c + 1
        return g

    def puntaje(cortes):
        g = grupos_de(cortes)
        forma = sum(abs((z - a) / total - e / total_esp) for (a, z), e in zip(g, esperado))
        return sum(huecos[c] for c in cortes) - 3 * forma

    from itertools import combinations
    from math import comb
    if comb(len(huecos), n - 1) <= 300000:
        mejor = max(combinations(range(len(huecos)), n - 1), key=puntaje)
    else:
        mejor = sorted(sorted(range(len(huecos)), key=lambda i: huecos[i], reverse=True)[: n - 1])
    return grupos_de(mejor)


def calzar(cfg, audios):
    planas = frases(cfg)
    if len(audios) != len(cfg["bloques"]):
        sys.exit(f"voz.json tiene {len(cfg['bloques'])} bloques y llegaron {len(audios)} audios")
    entradas, filtros, etiquetas, k = [], [], [], 0
    libre = 0.0  # cuándo termina la frase anterior: la siguiente no la pisa
    print(f"{'escena':>6}  {'voz':>5}  {'hueco':>5}  ajuste")
    for i, (b, audio) in enumerate(zip(cfg["bloques"], audios)):
        entradas += ["-i", audio]
        grupos = partir(tramos_de_voz(audio), [habla(f["texto"], cfg.get("silabas_por_segundo", 5.5)) for f in b])
        filtros.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=mono,asplit={len(b)}" +
                       "".join(f"[b{i}_{j}]" for j in range(len(b))))
        for j, ((a, z), f) in enumerate(zip(grupos, b)):
            dur = z - a
            cabe = f["hueco"] - 0.08
            tempo = 1.0
            nota = ""
            if dur > cabe:
                tempo = min(ACELERA_MAX, dur / cabe)
                nota = f"acelerada {round((tempo - 1) * 100)} %"
                if dur / tempo > cabe:
                    nota += f"; aun así pisa la escena siguiente {dur / tempo - cabe:.1f} s"
            inicio = max(f["t"], libre + 0.08)
            if inicio > f["t"] + 0.01:
                nota = (nota + "; " if nota else "") + f"entra {inicio - f['t']:.1f} s tarde para no pisar la anterior"
            libre = inicio + dur / tempo
            retraso = int(round(inicio * 1000))
            filtros.append(f"[b{i}_{j}]atrim=start={max(0, a - 0.03):.3f}:end={z + 0.06:.3f},asetpts=PTS-STARTPTS,"
                           f"atempo={tempo:.4f},adelay={retraso}|{retraso}[f{k}]")
            etiquetas.append(f"[f{k}]")
            print(f"{f['t']:6.1f}  {dur:4.1f}s  {f['hueco']:4.1f}s  {nota or 'cabe'}  {f['texto'][:48]}")
            k += 1
    filtros.append("".join(etiquetas) + f"amix=inputs={k}:normalize=0:duration=longest,apad=whole_dur={cfg['fin']},"
                   f"atrim=end={cfg['fin']}[voz]")
    salida_voz = os.path.join(os.path.dirname(os.path.abspath(cfg["_ruta"])), "salida", "voz-calzada.wav")
    os.makedirs(os.path.dirname(salida_voz), exist_ok=True)
    subprocess.run([FF, "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtros),
                    "-map", "[voz]", "-ar", "48000", salida_voz], check=True)
    print("voz:", salida_voz)
    video = os.path.join(os.path.dirname(os.path.abspath(cfg["_ruta"])), cfg["video"])
    subprocess.run(["python3", os.path.join(D, "voz.py"), video, salida_voz], check=True)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("Uso: python3 calzar-voz.py voz.json --guion | bloque-1.mp3 bloque-2.mp3 …")
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    cfg["_ruta"] = sys.argv[1]
    if sys.argv[2] == "--guion":
        guion(cfg)
    else:
        calzar(cfg, sys.argv[2:])
