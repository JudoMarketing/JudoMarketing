#!/bin/bash
# Uso: bash scripts/seguridad/parchar.sh /ruta/del/repo (en su rama de producción)
# Sube Next.js a la versión parchada de su línea y aplica los arreglos sin
# cambios de versión mayor, solo en el lockfile. Deja la rama
# seguridad/parches lista para commit; no sube nada.
set -e
d=$1; cd "$d"
git checkout -q -B seguridad/parches
nv=$(node -e "const p=require('./package-lock.json').packages['node_modules/next'];console.log(p?p.version:'')")
spec=$(node -e "const p=require('./package.json');console.log((p.dependencies||{}).next||'')")
pre=""; [[ "$spec" == ^* ]] && pre="^"; [[ "$spec" == ~* ]] && pre="~"
# La última versión publicada de la misma línea mayor (sin previas). Si la
# línea ya no recibe parches (como Next 14 en 2026), no alcanza: hay que
# migrar a una línea con soporte (docs/SEGURIDAD.md, paso 7).
mayor=${nv%%.*}
objetivo=""
[ -n "$mayor" ] && objetivo=$(npm view "next@^$mayor" version --json 2>/dev/null | python3 -c 'import json,sys;v=json.load(sys.stdin);print(v[-1] if isinstance(v,list) else v)')
[ "$objetivo" = "$nv" ] && objetivo=""
exacta=""; [ -z "$pre" ] && exacta="--save-exact"
paquetes=()
if [ -n "$objetivo" ]; then
  paquetes+=("next@${pre}${objetivo}")
  for extra in eslint-config-next @next/third-parties @next/mdx @next/bundle-analyzer @next/env @next/font; do
    node -e "const p=require('./package.json');process.exit(((p.dependencies||{})['$extra']||(p.devDependencies||{})['$extra'])?0:1)" && paquetes+=("$extra@${pre}${objetivo}") || true
  done
fi
# El postcss que Next 15 y 14 traen fijo, y el sharp que usa el optimizador
node -e "
const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));
const nv='$nv';
if (nv.startsWith('15.')||nv.startsWith('14.')) { p.overrides=Object.assign({},p.overrides||{}); p.overrides.next=Object.assign({}, typeof p.overrides.next==='object'?p.overrides.next:{}, {postcss:'^8.5.25'}); if (nv.startsWith('14.')) p.overrides.next.sharp='^0.35.5'; fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n'); }
"
if [ ${#paquetes[@]} -gt 0 ]; then npm install --package-lock-only --no-audit --no-fund --ignore-scripts $exacta "${paquetes[@]}" >/dev/null 2>&1 || npm install --package-lock-only --no-audit --no-fund --ignore-scripts --legacy-peer-deps $exacta "${paquetes[@]}" >/dev/null 2>&1; fi
# Las entradas viejas de los paquetes con override salen del lockfile para que npm las resuelva de nuevo
node -e "
const fs=require('fs');const l=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
for (const k of Object.keys(l.packages)) if (/^node_modules\/next\/node_modules\/(postcss|sharp)(\/|$)/.test(k)) delete l.packages[k];
fs.writeFileSync('package-lock.json',JSON.stringify(l,null,2)+'\n');"
npm install --package-lock-only --no-audit --no-fund --ignore-scripts >/dev/null 2>&1 || npm install --package-lock-only --no-audit --no-fund --ignore-scripts --legacy-peer-deps >/dev/null 2>&1
npm audit fix --package-lock-only --omit=dev --no-fund --ignore-scripts >/dev/null 2>&1 || true
echo "$d: next $nv → $(node -e "console.log(require('./package-lock.json').packages['node_modules/next']?.version||'-')")"
