#!/bin/bash
# Uso: bash scripts/seguridad/auditar.sh /ruta/del/repo
# Una línea con las versiones de Next y React y las vulnerabilidades de
# producción (críticas y altas por nombre). Solo lee el lockfile: no instala.
d=$1
cd "$d" || exit 1
nv=$(node -e "try{const p=require('./package-lock.json').packages||{};const g=n=>(p['node_modules/'+n]||{}).version||'-';console.log('next='+g('next')+' react='+g('react'))}catch(e){console.log('sin-lock')}")
tmp=$(mktemp)
npm audit --package-lock-only --omit=dev --json > "$tmp" 2>/dev/null
python3 - "$d" "$nv" "$tmp" <<'PY'
import json, sys
d, nv, f = sys.argv[1:4]
try: a = json.load(open(f))
except Exception: print(f"{d:40s} {nv} ERROR-AUDIT"); sys.exit()
m = a.get("metadata", {}).get("vulnerabilities", {})
graves = sorted(n for n, x in a.get("vulnerabilities", {}).items() if x["severity"] in ("critical", "high"))
print(f"{d:40s} {nv:32s} crit={m.get('critical',0)} high={m.get('high',0)} mod={m.get('moderate',0)} | {','.join(graves)}")
PY
rm -f "$tmp"
