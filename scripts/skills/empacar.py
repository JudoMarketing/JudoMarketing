# Junta lo compartido en cada skill de contenido, la valida y la empaca para
# subirla a cualquier cuenta de Claude.
#   python3 scripts/skills/empacar.py
#
# Qué hace:
# 1. Copia a cada skill lo que es igual en las dos:
#    - las referencias (estrategia, nichos, reglas, marca, pie de foto, emojis);
#    - los scripts (navegador, revisión de textos, marca, emojis);
#    - las marcas de la casa.
#    La fuente es scripts/skills/compartido/: se edita ahí, no en las copias.
# 2. Revisa:
#    - que el nombre y la descripción cumplan lo que pide claude.ai
#      (descripción de 200 caracteres o menos);
#    - que existan los archivos que nombra el SKILL.md.
# 3. Arma scripts/skills/dist/<nombre>.zip (y .skill, el mismo archivo), con
#    la carpeta de la skill en la raíz y sin lo generado (salida/).
import os, re, shutil, sys, zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS = os.path.join(RAIZ, ".claude", "skills")
COMP = os.path.join(RAIZ, "scripts", "skills", "compartido")
DIST = os.path.join(RAIZ, "scripts", "skills", "dist")
NOMBRES = ["judo-video-vertical", "judo-carrusel"]
REFS = ["estrategia-8-piezas.md", "nichos.md", "reglas.md", "marca.md", "pie-de-foto.md", "emojis.md"]
SCRIPTS = ["navegador.mjs", "revision-texto.js", "marca.mjs", "aplicar-marca.py", "emoji.py"]
AL_PROYECTO = ["navegador.mjs", "revision-texto.js", "aplicar-marca.py", "emoji.py"]
FUERA = {"salida", "node_modules", "__pycache__", ".DS_Store", "fuentes"}
CLAVES = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}

errores = []
os.makedirs(DIST, exist_ok=True)
for nombre in NOMBRES:
    s = os.path.join(SKILLS, nombre)
    for r in REFS:
        shutil.copy(os.path.join(COMP, r), os.path.join(s, "references", r))
    os.makedirs(os.path.join(s, "scripts"), exist_ok=True)
    for x in SCRIPTS:
        shutil.copy(os.path.join(COMP, "scripts", x), os.path.join(s, "scripts", x))
    for x in AL_PROYECTO:
        shutil.copy(os.path.join(COMP, "scripts", x), os.path.join(s, "assets", "proyecto", x))
    shutil.rmtree(os.path.join(s, "assets", "marcas"), ignore_errors=True)
    shutil.copytree(os.path.join(COMP, "marcas"), os.path.join(s, "assets", "marcas"))

    # ── Validar ──
    md = open(os.path.join(s, "SKILL.md"), encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", md, re.S)
    if not m:
        errores.append(f"{nombre}: el SKILL.md no empieza con el bloque ---")
        continue
    campos = dict(re.findall(r"^([a-z-]+):\s*(.*)$", m.group(1), re.M))
    if set(campos) - CLAVES:
        errores.append(f"{nombre}: claves que claude.ai no acepta: {', '.join(set(campos) - CLAVES)}")
    if campos.get("name") != nombre or not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", nombre) or len(nombre) > 64:
        errores.append(f"{nombre}: el name tiene que ser igual a la carpeta, en minúsculas con guiones")
    desc = campos.get("description", "")
    if not desc or len(desc) > 200 or "<" in desc:
        errores.append(f"{nombre}: la descripción tiene {len(desc)} caracteres (claude.ai acepta 200) o trae < >")
    for ref in set(re.findall(r"`((?:references|scripts|assets)/[^`*\s]+)`", md)):
        if not os.path.exists(os.path.join(s, ref.split(" ")[0])):
            errores.append(f"{nombre}: el SKILL.md nombra {ref} y no existe")
    for ref in set(re.findall(r"`([a-z0-9-]+\.md)`", md)):
        if not os.path.exists(os.path.join(s, "references", ref)):
            errores.append(f"{nombre}: el SKILL.md nombra {ref} y no está en references/")
    lineas = md.count("\n")
    if lineas > 500:
        errores.append(f"{nombre}: el SKILL.md tiene {lineas} líneas (mejor menos de 500)")

if errores:
    sys.exit("No se empacó:\n  " + "\n  ".join(errores))

for nombre in NOMBRES:
    s = os.path.join(SKILLS, nombre)
    destino = os.path.join(DIST, f"{nombre}.zip")
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for base, dirs, archivos in os.walk(s):
            dirs[:] = [d for d in dirs if d not in FUERA]
            for a in archivos:
                if a in FUERA or a.endswith(".pyc"):
                    continue
                ruta = os.path.join(base, a)
                z.write(ruta, os.path.relpath(ruta, os.path.dirname(s)))
    shutil.copy(destino, os.path.join(DIST, f"{nombre}.skill"))
    print(f"{nombre}: {os.path.getsize(destino) / 1e6:.1f} MB → scripts/skills/dist/{nombre}.zip (y .skill)")
