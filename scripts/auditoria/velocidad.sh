#!/bin/bash
# Lighthouse (móvil) sobre las páginas principales y un resumen en una línea
# por página. Es la parte "velocidad" de la auditoría semanal.
#
#   bash scripts/auditoria/velocidad.sh [carpeta de salida]
#
# Necesita Chromium (en la nube de Claude: /opt/pw-browsers/chromium-*/chrome-linux/chrome).
set -u
SALIDA="${1:-/tmp/velocidad}"; mkdir -p "$SALIDA"
export CHROME_PATH="${CHROME_PATH:-$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"
for par in "https://www.judomarketing.net/|home|mobile" "https://www.judomarketing.net/|home|desktop" "https://www.judomarketing.net/es|es-home|mobile" "https://www.judomarketing.net/services|services|mobile" "https://www.judomarketing.net/showcase|showcase|mobile" "https://www.judomarketing.net/contact|contact|mobile" "https://www.judomarketing.net/juditoads|juditoads|mobile" "https://www.judomarketing.net/juditos|juditos|mobile"; do
  IFS='|' read -r u n s <<< "$par"; extra=""; [ "$s" = "desktop" ] && extra="--preset=desktop"
  npx --yes lighthouse@12 "$u" --quiet --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --ignore-certificate-errors" --only-categories=performance,seo,accessibility,best-practices --output=json --output-path="$SALIDA/lh-$n-$s.json" $extra >/dev/null 2>"$SALIDA/lh-$n-$s.err" || echo "fallo $n $s: $(tail -1 "$SALIDA/lh-$n-$s.err")"
done
python3 - "$SALIDA" <<'PY'
import json,glob,sys
for f in sorted(glob.glob(sys.argv[1]+"/lh-*.json")):
    d=json.load(open(f))
    if 'categories' not in d or d.get('runtimeError'): print(f.split('/')[-1],"ERROR",(d.get('runtimeError') or {}).get('message','')[:80]); continue
    c=d['categories']; a=d['audits']
    sc=lambda k: round(c[k]['score']*100) if c.get(k) and c[k].get('score') is not None else None
    v=lambda k: a.get(k,{}).get('displayValue','-')
    fails=[k for k,x in a.items() if x.get('score') is not None and x['score']<0.5 and x.get('scoreDisplayMode') in ('binary','numeric')]
    print(f"{f.split('/')[-1].replace('lh-','').replace('.json','')}: rendimiento={sc('performance')} seo={sc('seo')} accesibilidad={sc('accessibility')} practicas={sc('best-practices')} | LCP={v('largest-contentful-paint')} TBT={v('total-blocking-time')} CLS={v('cumulative-layout-shift')} | fallos: {', '.join(fails[:10])}")
PY
