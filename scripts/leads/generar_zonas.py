#!/usr/bin/env python3
"""
Genera scripts/leads/zonas.json: las zonas de prospección por país, a partir
de GeoNames (ciudades de más de 15.000 habitantes, dominio público).

  python3 scripts/leads/generar_zonas.py [ruta/a/cities15000.txt]

Si no se pasa la ruta, descarga el archivo de download.geonames.org. Se corre
a mano cuando haga falta rehacer la lista; el JSON generado es lo que usan
buscar.mjs e informe.mjs.

Cada zona lleva:
  id        "us:austin-tx", "es:sevilla", "uk:leeds", "de:hamburg" (o el zip
            de Florida, "33130", que se conserva tal cual por Sunbiz)
  nombre    para leerlo en el informe
  consulta  lo que se le pega a Google Places después de "in": "Austin, TX, USA"
  verificar palabras que tiene que traer la dirección para aceptar un negocio
            (Places entiende "in Austin" como zona, no como filtro)

Estados Unidos empieza con los 44 códigos postales de Florida (zips.json) y
sigue por todas las ciudades de más de 25.000 habitantes, de mayor a menor.
Reino Unido y Alemania: ciudades de más de 25.000. España: de más de 50.000.
"""

import csv
import io
import json
import math
import re
import sys
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent

DE = {
    "01": "Baden-Württemberg", "02": "Bayern", "03": "Bremen", "04": "Hamburg", "05": "Hessen",
    "06": "Niedersachsen", "07": "Nordrhein-Westfalen", "08": "Rheinland-Pfalz", "09": "Saarland",
    "10": "Schleswig-Holstein", "11": "Brandenburg", "12": "Mecklenburg-Vorpommern", "13": "Sachsen",
    "14": "Sachsen-Anhalt", "15": "Thüringen", "16": "Berlin",
}
ES = {
    "07": "Islas Baleares", "27": "Andalucía", "29": "Madrid", "31": "Región de Murcia", "32": "Navarra",
    "34": "Asturias", "39": "Cantabria", "51": "Andalucía", "52": "Aragón", "53": "Canarias",
    "54": "Castilla-La Mancha", "55": "Castilla y León", "56": "Cataluña", "57": "Extremadura",
    "58": "Galicia", "59": "País Vasco", "60": "Comunidad Valenciana", "61": "La Rioja",
    "62": "Ceuta", "63": "Melilla",
}
GB = {"ENG": "England", "SCT": "Scotland", "WLS": "Wales", "NIR": "Northern Ireland"}

PAISES = {
    "us": dict(nombre="Estados Unidos", cc="US", minpop=25000, idioma="auto", languageCode="en", regionCode="US", diarios=10, sunbiz=True,
               consulta=lambda r: f"{r['nombre']}, {r['adm']}, USA",
               nombre_z=lambda r: f"{r['nombre']}, {r['adm']}",
               sid=lambda r: f"{slug(r['ascii'])}-{r['adm'].lower()}"),
    "es": dict(nombre="España", cc="ES", minpop=50000, idioma="es", languageCode="es", regionCode="ES", diarios=0, sunbiz=False,
               consulta=lambda r: ", ".join(x for x in [r["nombre"], ES.get(r["adm"], ""), "España"] if x),
               nombre_z=lambda r: f"{r['nombre']} ({ES.get(r['adm'], '')})",
               sid=lambda r: slug(r["ascii"])),
    "uk": dict(nombre="Reino Unido", cc="GB", minpop=25000, idioma="en", languageCode="en-GB", regionCode="GB", diarios=10, sunbiz=False,
               consulta=lambda r: ", ".join(x for x in [r["nombre"], GB.get(r["adm"], ""), "UK"] if x),
               nombre_z=lambda r: f"{r['nombre']}, {GB.get(r['adm'], '')}",
               sid=lambda r: slug(r["ascii"])),
    "de": dict(nombre="Alemania", cc="DE", minpop=25000, idioma="de", languageCode="de", regionCode="DE", diarios=0, sunbiz=False,
               consulta=lambda r: ", ".join(x for x in [r["nombre"], DE.get(r["adm"], ""), "Deutschland"] if x),
               nombre_z=lambda r: f"{r['nombre']} ({DE.get(r['adm'], '')})",
               sid=lambda r: slug(r["ascii"])),
}

CLASES = {"PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLC", "PPLX"}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def leer_geonames(ruta):
    if ruta:
        texto = Path(ruta).read_text(encoding="utf8")
    else:
        print("Descargando cities15000.zip de GeoNames...", file=sys.stderr)
        datos = urllib.request.urlopen("https://download.geonames.org/export/dump/cities15000.zip", timeout=120).read()
        texto = zipfile.ZipFile(io.BytesIO(datos)).read("cities15000.txt").decode("utf8")
    filas = []
    for r in csv.reader(io.StringIO(texto), delimiter="\t", quoting=csv.QUOTE_NONE):
        filas.append(dict(gid=r[0], nombre=r[1], ascii=r[2], lat=float(r[4]), lon=float(r[5]), clase=r[7], cc=r[8], adm=r[10], pob=int(r[14])))
    return filas


def distancia_km(a, b):
    p = math.pi / 180
    x = math.cos(a["lat"] * p) * math.cos(b["lat"] * p) * (1 - math.cos((b["lon"] - a["lon"]) * p)) / 2
    return 12742 * math.asin(math.sqrt((1 - math.cos((b["lat"] - a["lat"]) * p)) / 2 + x))


def main():
    filas = leer_geonames(sys.argv[1] if len(sys.argv) > 1 else None)
    florida = json.loads((AQUI / "zips.json").read_text(encoding="utf8"))["zips"]
    salida = {
        "_nota": "Zonas de prospección por país, generadas por scripts/leads/generar_zonas.py a partir de GeoNames (ciudades por población). La sesión toma, por país, la primera zona que no se haya corrido en 60 días, en este orden. Se edita a mano si hace falta. Las 44 primeras de Estados Unidos son los códigos postales de Florida (Sunbiz se cruza solo ahí). 'diarios' es cuántos correos salen por día en ese país; 0 = país cargado pero apagado.",
        "paises": {},
    }
    for clave, p in PAISES.items():
        ciudades = [r for r in filas if r["cc"] == p["cc"] and r["pob"] >= p["minpop"] and r["clase"] in CLASES]
        ciudades.sort(key=lambda r: -r["pob"])
        # Un barrio, distrito o municipio pegado a una capital (Hortaleza,
        # Manhattan, Camden Town) no sale en la dirección de Google: la
        # dirección dice "Madrid", "New York", "London". Se acepta también el
        # nombre de la ciudad grande más cercana (más de 500.000 habitantes a
        # menos de 25 km), y "New York City" se busca como "New York".
        grandes = [r for r in ciudades if r["clase"] != "PPLX" and r["pob"] >= 500000]
        zonas, ids = [], set()
        if clave == "us":
            for z in florida:
                zonas.append({"id": z["zip"], "nombre": z["zona"], "consulta": z["zip"], "verificar": [z["zip"]]})
                ids.add(z["zip"])
        for r in ciudades:
            i = p["sid"](r)
            if i in ids:
                i = f"{i}-{r['gid']}"
            ids.add(i)
            verificar = [r["nombre"], r["ascii"]]
            if r["pob"] < 1000000:
                cerca = [g for g in grandes if g is not r and g["pob"] > r["pob"] and distancia_km(r, g) < 25]
                if cerca:
                    madre = max(cerca, key=lambda g: g["pob"])
                    verificar += [madre["nombre"], madre["ascii"]]
            verificar = list(dict.fromkeys(re.sub(r" City$", "", v) for v in verificar))
            zonas.append({"id": f"{clave}:{i}", "nombre": p["nombre_z"](r), "consulta": p["consulta"](r), "verificar": verificar, "poblacion": r["pob"]})
        salida["paises"][clave] = {k: p[k] for k in ("nombre", "idioma", "languageCode", "regionCode", "diarios", "sunbiz")}
        salida["paises"][clave]["zonas"] = zonas
        print(f"{clave}: {len(zonas)} zonas", file=sys.stderr)
    (AQUI / "zonas.json").write_text(json.dumps(salida, ensure_ascii=False, indent=0) + "\n", encoding="utf8")
    print(f"Escrito {AQUI / 'zonas.json'}", file=sys.stderr)


if __name__ == "__main__":
    main()
