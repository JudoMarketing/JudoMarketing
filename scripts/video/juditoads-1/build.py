# Arma la página de producción (1080x1920) a partir del storyboard aprobado
import re, json, os
D = os.path.dirname(os.path.abspath(__file__))
SAL = f"{D}/salida"; os.makedirs(SAL, exist_ok=True)
src=open(f"{D}/storyboard.html").read()
links="\n".join(re.findall(r'<link [^>]+>', src))
estilo=re.search(r'<style>.*?</style>', src, re.S).group(0)
simbolos=re.search(r'<svg width="0".*?</svg>', src, re.S).group(0)
plantillas="\n".join(re.findall(r'<template id="f\d+">.*?</template>', src, re.S))
plantillas=plantillas.replace('<video class="vuelo" src="img/vuelo.mp4" muted loop playsinline autoplay preload="auto" aria-label="Vuelo desde el espacio hasta 66 W Flagler St, Miami"></video>','<img class="vuelo" id="vuelo" alt="">')
escenas=[]
for m in re.finditer(r'\{ id: "(e\d+)", f: "(f\d+)", t: \[([\d.]+), ([\d.]+)\]', src):
    escenas.append({"id":m.group(1),"f":m.group(2),"dur":round(float(m.group(4))-float(m.group(3)),3)})
json.dump(escenas, open(f"{SAL}/escenas.json","w"), indent=1)
prod_css='''<style>
html, body { margin: 0; padding: 0; background: #0d0a17; }
body { width: 1080px; height: 1920px; overflow: hidden; padding: 0 !important; }
.cuadro { width: 1080px !important; height: 1920px; border-radius: 0 !important; box-shadow: none !important; }
.seg, .zonas, .etiqueta-clip { display: none !important; }
.cuadro::after { opacity: .1 !important; }
.clip::before, .clip::after { display: none !important; }
.clip { background: radial-gradient(70% 45% at 30% 30%, rgba(139,92,246,.45), transparent 70%), radial-gradient(60% 40% at 80% 85%, rgba(255,197,51,.18), transparent 70%), #0d0a17 !important; }
/* En el video la salida la hace la transición: palabras y fichas se quedan juntas hasta el corte */
@keyframes golpe { 0% { opacity: 0; transform: scale(1.35) translateY(8%) } 6%, 100% { opacity: 1; transform: none } }
@keyframes chip { 0% { opacity: 0; transform: translateY(8cqw) scale(.5) } 20%, 100% { opacity: 1; transform: none } }
</style>'''
pagina=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>JuditoADS producción</title>
{links}
{estilo}
{prod_css}
</head><body>
{simbolos}
<div class="cuadro" id="cuadro"></div>
{plantillas}
<script>
const id = new URLSearchParams(location.search).get("e");
const ESC = {json.dumps({e["id"]: e["f"] for e in escenas})};
const cuadro = document.getElementById("cuadro");
cuadro.append(document.getElementById(ESC[id]).content.cloneNode(true));
if (id === "e06") {{
  const gente = cuadro.querySelector(".gente");
  for (let k = 0; k < 30; k++) {{ const d = document.createElement("div"); if (k === 15) d.className = "elegido"; d.innerHTML = '<img src="img/persona.webp" alt="">'; gente.append(d); }}
  const mira = cuadro.querySelector(".mira");
  const celda = (100 - 9 - 13 - 2.6 * 5) / 6;
  mira.style.setProperty("--fx", `${{9 + 3 * (celda + 2.6) + celda / 2 - 8.5}}cqw`);
  mira.style.setProperty("--fy", `${{62 + 2 * (celda + 3.4) + celda / 2 - 8.5}}cqw`);
}}
window.listo = (async () => {{
  await document.fonts.ready;
  await Promise.all([...document.images].filter((i) => i.getAttribute("src")).map((i) => i.decode().catch(() => {{}})));
  return true;
}})();
</script></body></html>'''
open(f"{SAL}/video.html","w").write(pagina)
print(len(escenas), "escenas", sum(e["dur"] for e in escenas), "s")
