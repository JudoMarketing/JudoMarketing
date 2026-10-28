# Música de fondo sintetizada aquí (sin muestras ni derechos de nadie):
# 100 golpes por minuto, cuatro acordes (Fa maj7, La m7, Re m9, Do maj7), un
# colchón suave, un arpegio con eco, bombo y platillo bajitos.
# Los cortes de escena caen en el tiempo porque las escenas duran múltiplos
# de 0,6 s (un golpe). En los bucles se va la batería y se cierra el filtro;
# vuelve de golpe en la escena que cierra el bucle. Al final queda el acorde
# de Do sonando.
# Uso: python3 musica.py   (después de build.py) → salida/musica.wav
import json, os
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, "salida")
BPM, GOLPE = 100, 0.6
COMPAS = GOLPE * 4
rng = np.random.default_rng(11)

escenas = json.load(open(os.path.join(P, "escenas.json"), encoding="utf-8"))
t, bucles = 0.0, []
for e in escenas:
    if "bucle" in e.get("pieza", "").lower():
        bucles.append((t, t + e["dur"]))
    t += e["dur"]
TOTAL = t + 0.25
CIERRE = t - escenas[-1]["dur"]  # empieza la última escena
N = int(TOTAL * SR)
tt = np.arange(N) / SR

nota = lambda m: 440 * 2 ** ((m - 69) / 12)
ACORDES = [  # (bajo, voces) en MIDI
    (41, (53, 57, 60, 64)),      # Fa maj7
    (45, (57, 60, 64, 67)),      # La m7
    (38, (50, 53, 57, 60, 64)),  # Re m9
    (36, (55, 59, 60, 64)),      # Do maj7
]


def acorde_en(c):
    """El acorde del compás c. Desde el cierre se queda en Do."""
    if c * COMPAS >= CIERRE + COMPAS:
        return ACORDES[3]
    return ACORDES[c % 4]


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


# Dónde hay batería: todo, menos los bucles y el último tramo
def con_bateria(seg):
    if any(a <= seg < b for a, b in bucles):
        return False
    return seg < TOTAL - COMPAS * 1.2


# ── Colchón ──
colchon = np.zeros(N)
compases = int(np.ceil(TOTAL / COMPAS))
for c in range(compases):
    a = c * COMPAS
    bajo, voces = acorde_en(c)
    ini, fin = int(a * SR), min(N, int((a + COMPAS + 0.8) * SR))
    t = tt[ini:fin] - a
    env = np.clip(t / 0.35, 0, 1) * np.clip((COMPAS + 0.8 - t) / 0.8, 0, 1)
    s = np.zeros(fin - ini)
    for v in voces:
        f = nota(v)
        for det in (-0.0035, 0.0, 0.0035):
            fase = rng.random() * 6.28
            s += np.sin(2 * np.pi * f * (1 + det) * t + fase) + 0.35 * np.sin(4 * np.pi * f * (1 + det) * t + fase) + 0.12 * np.sin(6 * np.pi * f * (1 + det) * t)
    colchon[ini:fin] += s * env / (len(voces) * 3)
colchon = lp(colchon, 1500)

# ── Bajo ──
bajo_s = np.zeros(N)
for c in range(compases):
    a = c * COMPAS; b, _ = acorde_en(c); f = nota(b)
    for k, (off, largo) in enumerate(((0, 1.5), (1.5 * GOLPE, 0.9), (2.5 * GOLPE, 1.3))):
        ini = int((a + off) * SR); fin = min(N, ini + int(largo * SR))
        if ini >= N:
            continue
        t = tt[ini:fin] - (a + off)
        bajo_s[ini:fin] += (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * np.clip(t / 0.015, 0, 1) * np.exp(-t / 0.7) * (1 if k == 0 else 0.7)
bajo_s = lp(bajo_s, 260)

# ── Arpegio con eco ──
arpegio = np.zeros(N)
patron = [0, 1, 2, 3, 2, 1, 3, 2]
for c in range(compases):
    a = c * COMPAS; _, voces = acorde_en(c)
    for i in range(8):
        seg = a + i * GOLPE / 2
        if seg >= TOTAL or any(x <= seg < y for x, y in bucles):
            continue
        f = nota(voces[patron[i] % len(voces)] + 12)
        ini = int(seg * SR); fin = min(N, ini + int(0.5 * SR)); t = tt[ini:fin] - seg
        arpegio[ini:fin] += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.05)) * np.exp(-t / 0.16) * np.clip(t / 0.003, 0, 1) * (1 if i % 2 == 0 else 0.7)
arpegio = lp(arpegio, 3500)
eco = int(0.45 * SR)  # corchea con puntillo
for k in range(1, 4):
    arpegio[eco * k:] += arpegio[: N - eco * k] * (0.33 ** k)

# ── Batería ──
bombo, platillo, palma = np.zeros(N), np.zeros(N), np.zeros(N)
nb = int(0.32 * SR); tb = np.arange(nb) / SR
golpe_bombo = np.sin(2 * np.pi * np.cumsum(np.geomspace(95, 46, nb)) / SR) * np.exp(-tb / 0.13) * np.clip(tb / 0.002, 0, 1)
np_ = int(0.05 * SR); tp = np.arange(np_) / SR
golpe_plat = hp(rng.standard_normal(np_), 7000) * np.exp(-tp / 0.012)
npa = int(0.18 * SR); tpa = np.arange(npa) / SR
golpe_palma = sosfilt(butter(2, [900, 2600], btype="band", fs=SR, output="sos"), rng.standard_normal(npa)) * np.exp(-tpa / 0.05)
golpes = int(TOTAL / GOLPE) + 1
primer_bucle = bucles[0][1] if bucles else 0
for g in range(golpes):
    seg = g * GOLPE
    if not con_bateria(seg):
        continue
    i = int(seg * SR)
    bombo[i:i + nb] += golpe_bombo[: N - i]
    if seg >= 3.6:  # el platillo entra después del gancho
        j = int((seg + GOLPE / 2) * SR)
        if j < N and con_bateria(seg + GOLPE / 2):
            platillo[j:j + np_] += golpe_plat[: N - j]
    if seg >= primer_bucle and g % 2 == 1:  # la palma, desde que se cierra el primer bucle
        palma[i:i + npa] += golpe_palma[: N - i]

# Bombeo: el colchón se agacha en cada bombo
bombeo = np.ones(N)
for g in range(golpes):
    seg = g * GOLPE
    if con_bateria(seg):
        i = int(seg * SR); n = min(N - i, int(GOLPE * SR)); t = np.arange(n) / SR
        bombeo[i:i + n] = 1 - 0.38 * np.exp(-t / 0.13)

# En los bucles el colchón se oscurece y baja
filtro = np.ones(N)
for a, b in bucles:
    i, j = int(a * SR), int(b * SR)
    filtro[i:j] = 0.55
oscuro = lp(colchon, 500)
mezcla_colchon = np.where(filtro < 1, oscuro * 1.2, colchon)
# Final: todo se apaga despacio en el último compás y medio
final = np.clip((TOTAL - tt) / (COMPAS * 1.2), 0, 1) ** 0.6

izq = (mezcla_colchon * bombeo * 0.55 + bajo_s * bombeo * 0.6 + arpegio * 0.22) * final + bombo * 0.55 + platillo * 0.05 + palma * 0.08
der = (mezcla_colchon * bombeo * 0.55 + bajo_s * bombeo * 0.6 + np.roll(arpegio, int(0.012 * SR)) * 0.22) * final + bombo * 0.55 + platillo * 0.06 + palma * 0.07
mus = np.stack([izq, der], axis=1)
mus = mus / (np.abs(mus).max() + 1e-9) * 10 ** (-1 / 20)
wavfile.write(os.path.join(P, "musica.wav"), SR, (mus * 32767).astype(np.int16))
print(f"música: {TOTAL:.1f} s, bucles sin batería en " + ", ".join(f"{a:.1f}–{b:.1f}" for a, b in bucles))
