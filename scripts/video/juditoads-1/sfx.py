# Efectos de sonido del video, sintetizados aquí (sin muestras de terceros)
# y colocados en el tiempo exacto de cada golpe, toque y transición.
import json, os, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "salida")
rng = np.random.default_rng(7)
db = lambda d: 10 ** (d / 20)

def env(n, ataque=0.004, caida=0.12):
    t = np.arange(n) / SR
    a = np.clip(t / max(ataque, 1e-4), 0, 1)
    return a * np.exp(-t / caida)

def banda(x, f1, f2, orden=2):
    return sosfilt(butter(orden, [f1, f2], btype="band", fs=SR, output="sos"), x)

def paso_bajo(x, f, orden=2):
    return sosfilt(butter(orden, f, btype="low", fs=SR, output="sos"), x)

def barrido(f0, f1, dur, fase=0):
    n = int(dur * SR); f = np.geomspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + fase)

def whoosh(dur=0.45, f0=600, f1=3200, nivel=-17):
    n = int(dur * SR); ruido = rng.standard_normal(n)
    # banda que se mueve: se arma con tramos cortos
    salida = np.zeros(n); tramos = 24
    for k in range(tramos):
        a, b = k * n // tramos, (k + 1) * n // tramos
        fc = f0 * (f1 / f0) ** (k / (tramos - 1))
        seg = banda(ruido[max(0, a - 400):b], fc * 0.6, min(fc * 1.6, SR / 2 - 100))[-(b - a):]
        salida[a:b] = seg
    t = np.linspace(0, 1, n); forma = np.sin(np.pi * t) ** 1.6
    return salida * forma / (np.abs(salida).max() + 1e-9) * db(nivel)

def pop(nivel=-15, f0=950, f1=320):
    s = barrido(f0, f1, 0.09) * env(int(0.09 * SR), 0.002, 0.035)
    clic = banda(rng.standard_normal(int(0.012 * SR)), 1500, 6000) * env(int(0.012 * SR), 0.0005, 0.003)
    s[: len(clic)] += clic * 0.6
    return s / np.abs(s).max() * db(nivel)

def tap(nivel=-14):
    n = int(0.05 * SR)
    s = banda(rng.standard_normal(n), 1800, 7000) * env(n, 0.0005, 0.006) + np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * env(n, 0.001, 0.012) * 0.4
    return s / np.abs(s).max() * db(nivel)

def campana(f=1320, dur=1.2, nivel=-16, parciales=((1, 1), (2.76, .45), (5.4, .2), (8.9, .08))):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m, a in parciales:
        s += a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (0.5 / m ** 0.6))
    s *= np.clip(t / 0.002, 0, 1)
    return s / np.abs(s).max() * db(nivel)

def acorde(notas=(1046.5, 1318.5, 1568.0), sep=0.07, nivel=-15):
    partes = [campana(f, 1.4, 0) for f in notas]
    n = int(sep * SR) * (len(notas) - 1) + len(partes[0]); s = np.zeros(n)
    for i, p in enumerate(partes): s[i * int(sep * SR): i * int(sep * SR) + len(p)] += p
    return s / np.abs(s).max() * db(nivel)

def brillo(nivel=-18):
    notas = [1568, 1976, 2349, 2794, 3136, 3729]
    s = np.zeros(int(0.9 * SR))
    for i, f in enumerate(notas):
        c = campana(f, 0.6, 0, ((1, 1), (2, .3)))
        a = int(i * 0.045 * SR); s[a: a + len(c)] += c * (0.9 - i * 0.08)
    return s / np.abs(s).max() * db(nivel)

def sello(nivel=-9):
    n = int(0.35 * SR); t = np.arange(n) / SR
    golpe = np.sin(2 * np.pi * np.cumsum(np.geomspace(140, 45, n)) / SR) * np.exp(-t / 0.09)
    ruido = paso_bajo(rng.standard_normal(n), 2500) * np.exp(-t / 0.025)
    s = golpe + ruido * 0.5
    return s / np.abs(s).max() * db(nivel)

def bloop(subir=True, nivel=-16):
    s = (barrido(260, 880, 0.16) if subir else barrido(880, 220, 0.18)) * env(int((0.16 if subir else 0.18) * SR), 0.01, 0.07)
    return s / np.abs(s).max() * db(nivel)

def caja(nivel=-12):
    ka = banda(rng.standard_normal(int(0.06 * SR)), 2000, 6000) * env(int(0.06 * SR), 0.001, 0.015)
    ching = campana(2637, 1.0, 0, ((1, 1), (2.01, .6), (3.02, .3), (4.2, .15)))
    s = np.zeros(int(0.06 * SR) + len(ching)); s[: len(ka)] += ka * 0.8; s[int(0.05 * SR):][: len(ching)] += ching
    return s / np.abs(s).max() * db(nivel)

def moneda(nivel=-15):
    dur = 0.85; n = int(dur * SR); t = np.arange(n) / SR
    giro = (0.5 + 0.5 * np.sin(2 * np.pi * (6 + 18 * t) * t)) * np.exp(-t / 0.6)
    s = banda(rng.standard_normal(n), 3000, 9000) * giro * 0.3
    clink = campana(3520, 0.6, 0, ((1, 1), (1.47, .7), (2.1, .3)))
    out = np.zeros(n + len(clink)); out[:n] += s; out[n - int(0.05 * SR): n - int(0.05 * SR) + len(clink)] += clink
    return out / np.abs(out).max() * db(nivel)

def plop(nivel=-13):
    s = barrido(420, 120, 0.14) * env(int(0.14 * SR), 0.003, 0.05) + paso_bajo(rng.standard_normal(int(0.14 * SR)), 900) * env(int(0.14 * SR), 0.001, 0.02) * 0.4
    return s / np.abs(s).max() * db(nivel)

def bip(nivel=-24):
    n = int(0.05 * SR); s = np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, 0.002, 0.015)
    return s / np.abs(s).max() * db(nivel)

def grave(nivel=-11):
    n = int(0.6 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(np.geomspace(90, 38, n)) / SR) * np.exp(-t / 0.22) * np.clip(t / 0.004, 0, 1)
    return s / np.abs(s).max() * db(nivel)

def subida(dur=1.0, nivel=-20):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    s = banda(rng.standard_normal(n), 800, 8000) * t ** 2 * 0.6 + barrido(200, 1200, dur) * t ** 2 * 0.4
    return s / np.abs(s).max() * db(nivel)

def vuelo(dur=3.8, nivel=-15):
    # viento largo que baja de tono mientras se acerca al suelo
    w = whoosh(dur, 4000, 300, 0)
    n = len(w); t = np.linspace(0, 1, n)
    retumbo = paso_bajo(rng.standard_normal(n), 140) * (t ** 1.5) * 2.5
    s = w + retumbo * np.sin(np.pi * np.clip(t, 0, 1)) ** 0.5
    return s / np.abs(s).max() * db(nivel)

escenas = json.load(open(f"{P}/escenas.json"))
EXTRA = 0.25
inicio = {}; t = 0.0
for e in escenas:
    inicio[e["id"]] = t; t += e["dur"]
TOTAL = t + EXTRA
L = {e["id"]: e["dur"] + EXTRA for e in escenas}

# (escena, segundo dentro de la escena, sonido)
cues = []
add = lambda e, s, snd: cues.append((inicio[e] + s, snd))
k = L["e01"] / 3.0
add("e01", 0.0, grave(-13))
for d in (0, .15, .3, .42, .56): add("e01", d * k, pop(-17))
for d in (1.3, 1.45, 1.6): add("e01", d * k, pop(-16, 1200, 420))
add("e15", 0.0, moneda(-14))
k = L["e02"] / 3.4
add("e02", 0.08 * k * 3.4 / 3.4, brillo(-19)); add("e02", 0.24 * 3.4 * k, bloop(True, -16)); add("e02", 0.25 * 3.4 * k, pop(-18, 1400, 700))
add("e02", 0.555 * 3.4 * k, sello(-9)); add("e02", 0.74 * 3.4 * k, bloop(False, -17))
k = L["e03"] / 3.6
for i in range(9): add("e03", (0.11 * i + 0.79) * k, plop(-19 + i * 0.3))
add("e03", 0.49 * 3.6 * k, caja(-12)); add("e03", 0.82 * 3.6 * k, whoosh(0.4, 3000, 700, -16))
add("e04", 0.0, vuelo(L["e04"] - 0.9, -14)); add("e04", L["e04"] - 1.22, tap(-16)); add("e04", L["e04"] - 1.15, pop(-15))
k = L["e05"] / 3.4
add("e05", 0.02, grave(-12)); add("e05", 0.06, brillo(-20)); add("e05", 0.32 * 3.4 * k, whoosh(0.35, 500, 2500, -18))
k = L["e06"] / 4.0
for s in np.arange(0.1, 0.68 * 4.0 * k, 0.42): add("e06", float(s), bip(-26))
add("e06", 0.755 * 4.0 * k, campana(1568, 1.2, -15))
k = L["e07"] / 2.4
for i in range(4): add("e07", (0.05 * 2.4 + i * 0.12) * k, pop(-17, 1100 + i * 120, 500))
k = L["e08"] / 3.0
add("e08", 0.44 * 3.0 * k, tap(-13))
k = L["e09"] / 3.4
add("e09", 0.44 * 3.4 * k, tap(-13)); add("e09", 0.54 * 3.4 * k, campana(1760, 1.0, -17))
k = L["e10"] / 4.0
add("e10", 0.1 * 4 * k, whoosh(0.28, 900, 3500, -18)); add("e10", 0.54 * 4 * k, whoosh(0.28, 900, 3500, -18))
k = L["e11"] / 4.5
add("e11", 0.09 * 4.5 * k, pop(-15)); add("e11", 0.49 * 4.5 * k, pop(-15, 1100, 380)); add("e11", 0.8 * 4.5 * k, sello(-11))
add("e12", 0.15, acorde(nivel=-15)); add("e12", 0.4, whoosh(0.5, 2500, 6000, -24))
k = L["e13"] / 6.0
for i in range(3): add("e13", (2.0 * i + 0.25) * k, brillo(-21))
k = L["e14"] / 5.0
add("e14", 0.02, caja(-11)); add("e14", 0.33 * 5 * k, plop(-12)); add("e14", 0.66 * 5 * k, sello(-11))
k = L["e16"] / 8.0
add("e16", (0.44 * 8 - 2.3) * k, tap(-13)); add("e16", 0.27 * 8 * k, whoosh(0.5, 2500, 400, -15))
add("e16", 0.33 * 8 * k, acorde((784, 988, 1175, 1568), 0.06, -16))
# transiciones entre escenas: un swish corto y bajo en cada corte
for e in escenas[1:]:
    if e["id"] in ("e04",): continue
    cues.append((inicio[e["id"]] - 0.12, whoosh(0.26, 1200, 4500, -23)))

n = int(TOTAL * SR) + SR
mezcla = np.zeros((n, 2))
for i, (t0, snd) in enumerate(cues):
    a = int(max(0, t0) * SR); b = min(n, a + len(snd)); s = snd[: b - a]
    pan = ((i * 37) % 11 - 5) / 40  # paneo leve para que respire
    mezcla[a:b, 0] += s * (1 - pan); mezcla[a:b, 1] += s * (1 + pan)
# sala corta para pegar todo
ir_n = int(0.35 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.09); ir /= np.abs(ir).sum()
for c in range(2): mezcla[:, c] = mezcla[:, c] * 0.86 + fftconvolve(mezcla[:, c], ir)[:n] * 0.9
mezcla = mezcla[: int(TOTAL * SR)]
pico = np.abs(mezcla).max(); mezcla = mezcla / pico * db(-1.5)
wavfile.write(f"{P}/sonido.wav", SR, (mezcla * 32767).astype(np.int16))
print(f"{len(cues)} sonidos, {TOTAL:.2f} s")
