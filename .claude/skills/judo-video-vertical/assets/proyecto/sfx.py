# Efectos de sonido sintetizados aquí (sin muestras de terceros: no hay
# derechos que pagar) y colocados en el segundo exacto que pide cada escena
# en su data-sfx. Sale salida/sonido.wav.
#
# Formato de cada sonido en data-sfx: nombre@segundo[:duración][/nivel]
#   pop@0.35        un pop a los 0,35 s de empezada la escena
#   subida@0:1.7    una subida que dura 1,7 s desde el inicio
#   sello@1.2/-6    un sello más fuerte (nivel en dB)
# La lista de nombres está en SONIDOS, abajo, y en references/sonido.md.
# Uso: python3 sfx.py
import json, os, re, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, "salida")
rng = np.random.default_rng(7)
db = lambda d: 10 ** (d / 20)


def env(n, ataque=0.004, caida=0.12):
    t = np.arange(n) / SR
    return np.clip(t / max(ataque, 1e-4), 0, 1) * np.exp(-t / caida)


def banda(x, f1, f2, orden=2):
    return sosfilt(butter(orden, [f1, f2], btype="band", fs=SR, output="sos"), x)


def paso_bajo(x, f, orden=2):
    return sosfilt(butter(orden, f, btype="low", fs=SR, output="sos"), x)


def barrido(f0, f1, dur, fase=0):
    n = int(dur * SR)
    return np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR + fase)


def norm(s, nivel):
    return s / (np.abs(s).max() + 1e-9) * db(nivel)


def whoosh(dur=0.45, f0=600, f1=3200, nivel=-17):
    n = int(dur * SR); ruido = rng.standard_normal(n); salida = np.zeros(n); tramos = 24
    for k in range(tramos):
        a, b = k * n // tramos, (k + 1) * n // tramos
        fc = f0 * (f1 / f0) ** (k / (tramos - 1))
        salida[a:b] = banda(ruido[max(0, a - 400):b], fc * 0.6, min(fc * 1.6, SR / 2 - 100))[-(b - a):]
    return norm(salida * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6, nivel)


def pop(nivel=-17, f0=950, f1=320):
    s = barrido(f0, f1, 0.09) * env(int(0.09 * SR), 0.002, 0.035)
    clic = banda(rng.standard_normal(int(0.012 * SR)), 1500, 6000) * env(int(0.012 * SR), 0.0005, 0.003)
    s[: len(clic)] += clic * 0.6
    return norm(s, nivel)


def tap(nivel=-13):
    n = int(0.05 * SR)
    s = banda(rng.standard_normal(n), 1800, 7000) * env(n, 0.0005, 0.006) + np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * env(n, 0.001, 0.012) * 0.4
    return norm(s, nivel)


def campana(f=1320, dur=1.2, nivel=-16, parciales=((1, 1), (2.76, .45), (5.4, .2), (8.9, .08))):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m, a in parciales:
        s += a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (0.5 / m ** 0.6))
    return norm(s * np.clip(t / 0.002, 0, 1), nivel)


def acorde(notas=(1046.5, 1318.5, 1568.0), sep=0.07, nivel=-15):
    partes = [campana(f, 1.4, 0) for f in notas]
    s = np.zeros(int(sep * SR) * (len(notas) - 1) + len(partes[0]))
    for i, p in enumerate(partes):
        s[i * int(sep * SR): i * int(sep * SR) + len(p)] += p
    return norm(s, nivel)


def brillo(nivel=-19):
    s = np.zeros(int(0.9 * SR))
    for i, f in enumerate([1568, 1976, 2349, 2794, 3136, 3729]):
        c = campana(f, 0.6, 0, ((1, 1), (2, .3))); a = int(i * 0.045 * SR)
        s[a: a + len(c)] += c * (0.9 - i * 0.08)
    return norm(s, nivel)


def sello(nivel=-9):
    n = int(0.35 * SR); t = np.arange(n) / SR
    golpe = np.sin(2 * np.pi * np.cumsum(np.geomspace(140, 45, n)) / SR) * np.exp(-t / 0.09)
    return norm(golpe + paso_bajo(rng.standard_normal(n), 2500) * np.exp(-t / 0.025) * 0.5, nivel)


def bloop(subir=True, nivel=-16):
    d = 0.16 if subir else 0.18
    return norm((barrido(260, 880, d) if subir else barrido(880, 220, d)) * env(int(d * SR), 0.01, 0.07), nivel)


def caja(nivel=-12):
    ka = banda(rng.standard_normal(int(0.06 * SR)), 2000, 6000) * env(int(0.06 * SR), 0.001, 0.015)
    ching = campana(2637, 1.0, 0, ((1, 1), (2.01, .6), (3.02, .3), (4.2, .15)))
    s = np.zeros(int(0.06 * SR) + len(ching)); s[: len(ka)] += ka * 0.8; s[int(0.05 * SR):][: len(ching)] += ching
    return norm(s, nivel)


def moneda(nivel=-14):
    n = int(0.85 * SR); t = np.arange(n) / SR
    giro = (0.5 + 0.5 * np.sin(2 * np.pi * (6 + 18 * t) * t)) * np.exp(-t / 0.6)
    clink = campana(3520, 0.6, 0, ((1, 1), (1.47, .7), (2.1, .3)))
    out = np.zeros(n + len(clink)); out[:n] += banda(rng.standard_normal(n), 3000, 9000) * giro * 0.3
    out[n - int(0.05 * SR): n - int(0.05 * SR) + len(clink)] += clink
    return norm(out, nivel)


def plop(nivel=-14):
    n = int(0.14 * SR)
    s = barrido(420, 120, 0.14) * env(n, 0.003, 0.05) + paso_bajo(rng.standard_normal(n), 900) * env(n, 0.001, 0.02) * 0.4
    return norm(s, nivel)


def bip(nivel=-26):
    n = int(0.05 * SR)
    return norm(np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, 0.002, 0.015), nivel)


def grave(nivel=-12):
    n = int(0.6 * SR); t = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * np.cumsum(np.geomspace(90, 38, n)) / SR) * np.exp(-t / 0.22) * np.clip(t / 0.004, 0, 1), nivel)


def subida(dur=1.0, nivel=-18):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    s = banda(rng.standard_normal(n), 800, 8000) * t ** 2 * 0.6 + barrido(200, 1200, dur) * t ** 2 * 0.4
    return norm(s, nivel)


def viento(dur=3.8, nivel=-14):
    w = whoosh(dur, 4000, 300, 0); n = len(w); t = np.linspace(0, 1, n)
    retumbo = paso_bajo(rng.standard_normal(n), 140) * (t ** 1.5) * 2.5
    return norm(w + retumbo * np.sin(np.pi * t) ** 0.5, nivel)


# nombre: (función que recibe duración y nivel, nivel por defecto, duración por defecto)
SONIDOS = {
    "pop": (lambda d, n: pop(n), -17, None),
    "pop-fuerte": (lambda d, n: pop(n, 1200, 420), -14, None),
    "pop-agudo": (lambda d, n: pop(n, 1400, 700), -18, None),
    "tap": (lambda d, n: tap(n), -13, None),
    "campana": (lambda d, n: campana(1760, 1.0, n), -17, None),
    "campana-grave": (lambda d, n: campana(1568, 1.2, n), -15, None),
    "acorde": (lambda d, n: acorde(nivel=n), -15, None),
    "acorde-final": (lambda d, n: acorde((784, 988, 1175, 1568), 0.06, n), -16, None),
    "brillo": (lambda d, n: brillo(n), -19, None),
    "sello": (lambda d, n: sello(n), -9, None),
    "bloop-sube": (lambda d, n: bloop(True, n), -16, None),
    "bloop-baja": (lambda d, n: bloop(False, n), -17, None),
    "caja": (lambda d, n: caja(n), -12, None),
    "moneda": (lambda d, n: moneda(n), -14, None),
    "plop": (lambda d, n: plop(n), -14, None),
    "bip": (lambda d, n: bip(n), -26, None),
    "grave": (lambda d, n: grave(n), -12, None),
    "subida": (lambda d, n: subida(d, n), -18, 1.0),
    "whoosh": (lambda d, n: whoosh(d, 3000, 700, n), -16, 0.4),
    "whoosh-suave": (lambda d, n: whoosh(d, 500, 2500, n), -18, 0.35),
    "whoosh-baja": (lambda d, n: whoosh(d, 2500, 400, n), -15, 0.5),
    "swish": (lambda d, n: whoosh(d, 900, 3500, n), -18, 0.28),
    "viento": (lambda d, n: viento(d, n), -14, 3.8),
}
FORMA = re.compile(r"^([a-z-]+)@([\d.]+)(?::([\d.]+))?(?:/(-?[\d.]+))?$")

escenas = json.load(open(os.path.join(P, "escenas.json"), encoding="utf-8"))
EXTRA = 0.25
inicio, t = {}, 0.0
for e in escenas:
    inicio[e["id"]] = t; t += e["dur"]
TOTAL = t + EXTRA

cues, errores = [], []
for e in escenas:
    for token in e.get("sfx", []):
        m = FORMA.match(token)
        if not m or m.group(1) not in SONIDOS:
            errores.append(f"{e['id']}: «{token}» no es un sonido válido")
            continue
        fn, nivel, dur_def = SONIDOS[m.group(1)]
        seg = float(m.group(2))
        dur = float(m.group(3)) if m.group(3) else (dur_def or 0)
        nivel = float(m.group(4)) if m.group(4) else nivel
        if seg > e["dur"] + EXTRA:
            errores.append(f"{e['id']}: «{token}» cae después de que termina la escena ({e['dur']} s)")
        cues.append((inicio[e["id"]] + seg, fn(dur, nivel)))
if errores:
    sys.exit("Sonidos con problemas:\n  " + "\n  ".join(errores) + "\nNombres válidos: " + ", ".join(SONIDOS))

# Un swish corto y bajo en cada corte, salvo donde la escena pide que no
for e in escenas[1:]:
    if e.get("swish", True):
        cues.append((inicio[e["id"]] - 0.12, whoosh(0.26, 1200, 4500, -23)))

n = int(TOTAL * SR) + SR
mezcla = np.zeros((n, 2))
for i, (t0, snd) in enumerate(cues):
    a = int(max(0, t0) * SR); b = min(n, a + len(snd)); s = snd[: b - a]
    pan = ((i * 37) % 11 - 5) / 40  # paneo leve para que respire
    mezcla[a:b, 0] += s * (1 - pan); mezcla[a:b, 1] += s * (1 + pan)
# Una sala corta para pegar todo
ir_n = int(0.35 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.09); ir /= np.abs(ir).sum()
for c in range(2):
    mezcla[:, c] = mezcla[:, c] * 0.86 + fftconvolve(mezcla[:, c], ir)[:n] * 0.9
mezcla = mezcla[: int(TOTAL * SR)]
mezcla = mezcla / (np.abs(mezcla).max() + 1e-9) * db(-1.5)
wavfile.write(os.path.join(P, "sonido.wav"), SR, (mezcla * 32767).astype(np.int16))
print(f"{len(cues)} sonidos, {TOTAL:.2f} s")
