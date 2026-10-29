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


# ── Sonidos suaves (los del video 3): poco volumen, poco brillo, nada de dibujo
# animado. En cristal, golpe-suave y aviso el número después de «:» es el
# grado (la nota), no la duración: cristal@1.2:3 suena más agudo que
# cristal@1.2:1. Así una serie de vistos sube como una escala.
ESCALA = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3]  # do pentatónico, 6.ª octava


def cristal(grado=0, nivel=-24):
    f = ESCALA[int(grado) % len(ESCALA)]; n = int(0.9 * SR); t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 1.6 * np.exp(-t / 0.08)
    s = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.32) + 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.12)
    return norm(s * np.clip(t / 0.003, 0, 1), nivel)


def sub(nivel=-16):
    n = int(0.9 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(np.geomspace(72, 42, n)) / SR) * np.exp(-t / 0.35) * np.clip(t / 0.01, 0, 1)
    return norm(paso_bajo(s, 180), nivel)


def clic_suave(nivel=-28):
    n = int(0.03 * SR); t = np.arange(n) / SR
    s = banda(rng.standard_normal(n), 2500, 6000) * np.exp(-t / 0.003) + np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.008) * 0.5
    return norm(s, nivel)


def golpe_suave(grado=0, nivel=-20):
    n = int(0.4 * SR); t = np.arange(n) / SR; f0 = 120 * (1.12 ** int(grado))
    s = np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f0 * 0.5, n)) / SR) * np.exp(-t / 0.11)
    s += paso_bajo(rng.standard_normal(n), 1200) * np.exp(-t / 0.02) * 0.35
    return norm(s * np.clip(t / 0.002, 0, 1), nivel)


def tecla(nivel=-30):
    n = int(0.025 * SR); t = np.arange(n) / SR
    s = banda(rng.standard_normal(n), 3000, 9000) * np.exp(-t / 0.0025) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.004) * 0.4
    return norm(s, nivel)


def barrido_suave(dur=0.5, nivel=-26, f0=300, f1=1800):
    n = int(dur * SR); ruido = rng.standard_normal(n); out = np.zeros(n); tramos = 20
    for k in range(tramos):
        a, b = k * n // tramos, (k + 1) * n // tramos
        fc = f0 * (f1 / f0) ** (k / (tramos - 1))
        out[a:b] = banda(ruido[max(0, a - 400):b], fc * 0.7, fc * 1.4)[-(b - a):]
    return norm(paso_bajo(out, 2600) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2, nivel)


def subida_suave(dur=1.8, nivel=-25):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    # Más tono que ruido: un soplo que se abre, no un chorro de estática
    ruido = paso_bajo(banda(rng.standard_normal(n), 300, 2200), 1800) * t ** 2.4
    tono = barrido(196, 587, dur) * t ** 1.4 * (0.65 + 0.35 * np.sin(2 * np.pi * np.cumsum(np.linspace(3, 10, n)) / SR))
    return norm(paso_bajo(ruido * 0.35 + tono * 0.65, 2400), nivel)


def aviso(grado=0, nivel=-22):
    # 0: neutro (sube una tercera), 1: alerta (baja), 2: buena noticia (sube una quinta)
    pares = {0: (1318.5, 1661.2), 1: (1568.0, 1244.5), 2: (1046.5, 1568.0)}
    a, b = pares.get(int(grado), pares[0]); n = int(0.75 * SR); t = np.arange(n) / SR
    nota = lambda f, t0: np.where(t >= t0, np.sin(2 * np.pi * f * (t - t0)) * np.exp(-np.clip(t - t0, 0, None) / 0.22) * np.clip((t - t0) / 0.004, 0, 1), 0)
    s = nota(a, 0) + nota(b, 0.11) + 0.2 * nota(a * 2, 0) + 0.2 * nota(b * 2, 0.11)
    return norm(s, nivel)


def acorde_suave(dur=4.0, nivel=-20):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in (261.6, 329.6, 392.0, 493.9, 587.3):
        for det in (-0.004, 0.004):
            s += np.sin(2 * np.pi * f * (1 + det) * t) + 0.3 * np.sin(2 * np.pi * 2 * f * (1 + det) * t)
    env_ = np.clip(t / 0.5, 0, 1) * np.clip((dur - t) / 1.6, 0, 1)
    return norm(paso_bajo(s, 2200) * env_, nivel)


def datos(nivel=-30):
    s = np.zeros(int(0.8 * SR))
    for i in range(10):
        f = ESCALA[rng.integers(2, len(ESCALA))] * 2; n = int(0.04 * SR); t = np.arange(n) / SR
        b = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012); a = int(i * 0.06 * SR)
        s[a:a + n] += b * (0.5 + 0.5 * rng.random())
    return norm(s, nivel)


# ── La máquina que se rompe y el árbitro (video 3, escena 2) ──
def rotura(nivel=-15):
    """Algo de metal que se parte: un crujido, unas notas metálicas y astillas que caen."""
    n = int(0.9 * SR); t = np.arange(n) / SR
    crujido = banda(rng.standard_normal(n), 900, 7000) * np.exp(-t / 0.05) * 1.2
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.18 / k)) / k for k, f in enumerate((1180, 1715, 2390, 3310), 1))
    golpe = np.sin(2 * np.pi * np.cumsum(np.geomspace(160, 60, n)) / SR) * np.exp(-t / 0.08)
    s = crujido + metal * 0.5 + golpe * 0.8
    for k in range(7):  # astillas que tocan el piso
        a = int((0.22 + k * 0.07 + rng.random() * 0.03) * SR); m = int(0.03 * SR)
        s[a:a + m] += banda(rng.standard_normal(m), 3000, 9000) * np.exp(-np.arange(m) / SR / 0.004) * (0.5 - k * 0.05)
    return norm(s * np.clip(t / 0.001, 0, 1), nivel)


def silbato(nivel=-20):
    """El silbato del árbitro: dos pitazos con el trino de la bolita."""
    out = np.zeros(int(0.62 * SR))
    for ini, dur in ((0.0, 0.17), (0.24, 0.36)):
        n = int(dur * SR); t = np.arange(n) / SR
        trino = 1 + 0.035 * np.sin(2 * np.pi * 38 * t)
        tono = np.sin(2 * np.pi * np.cumsum(2950 * trino) / SR) * (0.75 + 0.25 * np.sin(2 * np.pi * 38 * t))
        aire = banda(rng.standard_normal(n), 2500, 6000) * 0.12
        env_ = np.clip(t / 0.012, 0, 1) * np.clip((dur - t) / 0.03, 0, 1)
        a = int(ini * SR); out[a:a + n] += (tono + aire) * env_
    return norm(out, nivel)


def arranque(dur=0.7, nivel=-24):
    """La máquina que vuelve a andar: un zumbido que sube y se asienta."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 90 + 140 * (1 - np.exp(-t / 0.25))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    s = paso_bajo(s, 1200) * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.25, 0, 1)
    return norm(s, nivel)


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
    # suaves
    "cristal": (lambda d, n: cristal(d, n), -24, 0),
    "sub": (lambda d, n: sub(n), -16, None),
    "clic-suave": (lambda d, n: clic_suave(n), -28, None),
    "golpe-suave": (lambda d, n: golpe_suave(d, n), -20, 0),
    "tecla": (lambda d, n: tecla(n), -30, None),
    "barrido-suave": (lambda d, n: barrido_suave(d, n), -26, 0.5),
    "barrido-grave": (lambda d, n: barrido_suave(d, n, 140, 900), -23, 0.6),
    "subida-suave": (lambda d, n: subida_suave(d, n), -29, 1.8),
    "aviso": (lambda d, n: aviso(d, n), -22, 0),
    "acorde-suave": (lambda d, n: acorde_suave(d, n), -20, 4.0),
    "datos": (lambda d, n: datos(n), -30, None),
    "rotura": (lambda d, n: rotura(n), -15, None),
    "silbato": (lambda d, n: silbato(n), -20, None),
    "arranque": (lambda d, n: arranque(d, n), -24, 0.7),
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
# La música de fondo (musica.py) va por debajo de los efectos, si existe
MUSICA_DB = -9
ruta_musica = os.path.join(P, "musica.wav")
if os.path.exists(ruta_musica):
    sr_m, mus = wavfile.read(ruta_musica)
    mus = mus.astype(np.float64) / 32767
    if mus.ndim == 1:
        mus = np.stack([mus, mus], axis=1)
    k = min(len(mus), len(mezcla))
    pico_sfx = np.abs(mezcla).max() + 1e-9
    mezcla = mezcla / pico_sfx * db(-6)
    mezcla[:k] += mus[:k] * db(MUSICA_DB)
    print(f"con música de fondo ({MUSICA_DB} dB)")
mezcla = np.tanh(mezcla * 1.2) / np.tanh(1.2)  # un limitador suave
mezcla = mezcla / (np.abs(mezcla).max() + 1e-9) * db(-1.5)
wavfile.write(os.path.join(P, "sonido.wav"), SR, (mezcla * 32767).astype(np.int16))
print(f"{len(cues)} sonidos, {TOTAL:.2f} s")
