# Saca de storyboard.html la página de producción (salida/video.html) y la
# lista de escenas con su duración, sonidos y transiciones
# (salida/escenas.json). Avisa de lo que no cuadra antes de renderizar.
# Uso: python3 build.py [storyboard.html]
import json, os, re, sys

D = os.path.dirname(os.path.abspath(__file__))
# Con --catalogo se arman las escenas de catalogo-escenas.html con los
# estilos del storyboard, para ver o probar una escena antes de usarla.
CATALOGO = "--catalogo" in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith("--")]
SB = args[0] if args else os.path.join(D, "storyboard.html")
SAL = os.path.join(D, "salida")
os.makedirs(SAL, exist_ok=True)
src = open(SB, encoding="utf-8").read()
if CATALOGO:
    cat = open(os.path.join(D, "catalogo-escenas.html"), encoding="utf-8").read()
    src = re.sub(r"<template id=.*</script>\s*</body>", "", src, flags=re.S)  # sin las escenas del ejemplo
    src = re.sub(r'<script type="application/json" id="escenas">.*?</script>', "", src, flags=re.S) + cat

fuentes = re.search(r"<!-- FUENTES:INICIO -->(.*?)<!-- FUENTES:FIN -->", src, re.S)
fuentes = fuentes.group(1) if fuentes else ""
estilos = "\n".join(re.findall(r"<style>.*?</style>", src, re.S))
simbolos = re.search(r'<svg width="0".*?</svg>', src, re.S)
simbolos = simbolos.group(0) if simbolos else ""
lista = re.search(r'<script type="application/json" id="escenas">(.*?)</script>', src, re.S)
if not lista:
    sys.exit("Falta la lista de escenas (<script type=\"application/json\" id=\"escenas\">).")
escenas = json.loads(lista.group(1))

slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
plantillas = {}
for m in re.finditer(r'<template id="([^"]+)"([^>]*)>(.*?)</template>', src, re.S):
    atr = dict(re.findall(r'(data-[a-z-]+)="([^"]*)"', m.group(2)))
    cuerpo = m.group(3)
    # Videos reales: se abren en cuadros y el render los cambia uno por uno
    secuencias = re.findall(r'<img[^>]*class="[^"]*\bsecuencia\b[^"]*"[^>]*data-video="([^"]+)"', cuerpo)
    secuencias += re.findall(r'<img[^>]*data-video="([^"]+)"[^>]*class="[^"]*\bsecuencia\b', cuerpo)
    cuerpo = re.sub(r'data-video="([^"]+)"', lambda x: f'data-video="{x.group(1)}" data-slug="{slug(x.group(1))}"', cuerpo)
    plantillas[m.group(1)] = {"atr": atr, "html": f'<template id="{m.group(1)}">{cuerpo}</template>', "secuencias": sorted(set(secuencias))}

problemas, salida, vistos = [], [], set()
for i, e in enumerate(escenas):
    eid, pl = e.get("id"), e.get("plantilla")
    if not eid or eid in vistos:
        problemas.append(f"La escena {i + 1} no tiene id o lo repite ({eid}).")
    vistos.add(eid)
    if pl not in plantillas:
        problemas.append(f"{eid}: no existe la plantilla «{pl}».")
        continue
    dur = float(e.get("dur", 0))
    if not 0.5 <= dur <= 15:
        problemas.append(f"{eid}: dura {dur} s; tiene que estar entre 0,5 y 15.")
    atr = plantillas[pl]["atr"]
    salida.append({
        "id": eid, "plantilla": pl, "dur": round(dur, 3), "pieza": e.get("pieza", ""),
        "entrada": e.get("entrada") or atr.get("data-entrada", "fade"),
        "sfx": (e.get("sfx") or atr.get("data-sfx", "")).split(),
        "swish": (e.get("swish") or atr.get("data-swish", "si")) != "no",
        "secuencias": [{"video": v, "slug": slug(v)} for v in plantillas[pl]["secuencias"]],
    })
if problemas:
    sys.exit("No se puede armar:\n  " + "\n  ".join(problemas))

json.dump(salida, open(os.path.join(SAL, "escenas.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
mapa = {e["id"]: {"plantilla": e["plantilla"], "t": round(e["dur"] + 0.25, 3)} for e in salida}
prod = """<style>
html, body { margin: 0 !important; padding: 0 !important; background: var(--fondo) !important; }
body { width: 1080px; height: 1920px; overflow: hidden; }
.cuadro { width: 1080px !important; height: 1920px; border-radius: 0 !important; }
.mesa, .zonas { display: none !important; }
</style>"""
pagina = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>producción</title>
{fuentes}
{estilos}
{prod}
</head><body>
{simbolos}
<div class="cuadro" id="cuadro"></div>
{chr(10).join(p["html"] for p in plantillas.values())}
<script>
const ESC = {json.dumps(mapa)};
const id = new URLSearchParams(location.search).get("e");
const cuadro = document.getElementById("cuadro");
cuadro.style.setProperty("--t", ESC[id].t + "s");
cuadro.append(document.getElementById(ESC[id].plantilla).content.cloneNode(true));
for (const img of cuadro.querySelectorAll("img.secuencia[data-slug]")) img.src = `secuencias/${{img.dataset.slug}}/f00001.jpg`;
window.listo = (async () => {{
  await document.fonts.ready;
  await Promise.all([...document.images].filter((i) => i.getAttribute("src")).map((i) => i.decode().catch(() => {{}})));
  for (const a of document.getAnimations()) a.pause();
  return true;
}})();
</script></body></html>"""
open(os.path.join(SAL, "video.html"), "w", encoding="utf-8").write(pagina)
total = sum(e["dur"] for e in salida)
print(f"{len(salida)} escenas, {total:.1f} s")
if total > 62:
    print("  ⚠ Pasa de 60 s: en Reels y TikTok conviene recortar (references/estrategia-8-piezas.md, sección 7).")
piezas = {re.match(r"\s*(\d)", e["pieza"]).group(1) for e in salida if re.match(r"\s*(\d)", e.get("pieza", ""))}
faltan = [p for p in "12345678" if p not in piezas]
if faltan:
    print(f"  ⚠ Faltan piezas de la estructura: {', '.join(faltan)} (campo «pieza» de cada escena).")
