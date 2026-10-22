#!/bin/bash
# Compara un preview de Vercel contra el sitio en producción, ruta por ruta:
# mismo código de respuesta y mismo <title>.
# Uso: bash scripts/seguridad/comparar.sh URL_COMPARTIDA_DEL_PREVIEW https://dominio-real "/rutas /extra"
# La URL compartida (con ?_vercel_share=…) sale de get_access_to_vercel_url.
# Rutas: las del sitemap de producción (hasta 40), la portada, robots y
# sitemap, más las extra.
share=$1; prod=$2; extra=$3
H=$(mktemp -d); jar=$H/jar
base=$(echo "$share" | sed 's#/?_vercel_share.*##')
curl -s -o /dev/null -c $jar -b $jar -L "$share"
rutas=$(curl -sL "$prod/sitemap.xml" | grep -oE "<loc>[^<]+" | sed -E 's#<loc>https?://[^/]+##' | head -40)
dif=0; n=0
for r in / $rutas $extra /robots.txt /sitemap.xml; do
  n=$((n+1))
  a=$(curl -s -o $H/a.html -w "%{http_code}" -b $jar "$base$r"); b=$(curl -s -o $H/b.html -w "%{http_code}" "$prod$r")
  ta=$(grep -o '<title>[^<]*' $H/a.html | head -1); tb=$(grep -o '<title>[^<]*' $H/b.html | head -1)
  if [ "$a" != "$b" ] || [ "$ta" != "$tb" ]; then dif=$((dif+1)); echo "  DIFERENTE $r preview=$a prod=$b | ${ta:0:45} | ${tb:0:45}"; fi
done
rm -rf $H
echo "$n rutas, $dif diferentes"
