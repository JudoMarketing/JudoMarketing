#!/bin/bash
# Uso: bash scripts/seguridad/subir-paquete.sh /ruta/del/repo rama-de-produccion paquete versión
# Ejemplo: bash scripts/seguridad/subir-paquete.sh /home/user/judito-ads claude/meta-ads-portal-5je6kf zod 4.6.7
#
# Para cuando sale una falla en un paquete que no es Next (zod, undici…).
# Deja la rama seguridad/<paquete> lista y sin subir, en una carpeta aparte
# (git worktree) para no tocar lo que haya en el clon:
# - parte del commit que GitHub tiene en la rama de producción (no del clon
#   local, que puede estar viejo: pasó con ABA y May Baykery);
# - sube el paquete a ^versión (o a la versión exacta si el repo las fija);
# - si otro paquete trae su propia copia vieja (como @vercel/cli-config con
#   zod 4.1.11), un override la iguala ("paquete": "$paquete") en vez de
#   subir de versión mayor al que la trae;
# - npm audit fix sin saltos mayores, solo en el lockfile y sin scripts;
# - dice qué avisos altos o críticos quedan.
set -e
D=$(cd "$(dirname "$0")" && pwd)
repo=$1; rama=$2; pq=$3; ver=$4
[ -n "$ver" ] || { echo "Uso: subir-paquete.sh repo rama paquete versión"; exit 1; }
cd "$repo"
git fetch -q origin "+refs/heads/$rama:refs/remotes/origin/$rama"
remoto=$(git ls-remote origin "refs/heads/$rama" | cut -f1)
[ "$remoto" = "$(git rev-parse "origin/$rama")" ] || { echo "La rama local no coincide con GitHub"; exit 1; }
wt="${TMPDIR:-/tmp}/seguridad-$(basename "$repo")"
rm -rf "$wt"; git worktree prune
git worktree add -q -B "seguridad/$pq" "$wt" "origin/$rama"
cd "$wt"
PQ="$pq" VER="$ver" node -e '
const fs=require("fs"); const {PQ,VER}=process.env;
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const lock=JSON.parse(fs.readFileSync("package-lock.json","utf8")).packages||{};
let directo=false;
for (const t of ["dependencies","devDependencies"]) if (p[t]&&p[t][PQ]) { p[t][PQ]=/^[\^~]/.test(p[t][PQ])?"^"+VER:VER; directo=true; }
const anidada=Object.keys(lock).some(k=>k.endsWith("/node_modules/"+PQ)&&k.split("node_modules/").length>2);
if (anidada||!directo) p.overrides=Object.assign({},p.overrides||{},{[PQ]:directo?"$"+PQ:"^"+VER});
fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n");'
npm install --package-lock-only --no-audit --no-fund --ignore-scripts >/dev/null 2>&1 || npm install --package-lock-only --no-audit --no-fund --ignore-scripts --legacy-peer-deps >/dev/null 2>&1
npm audit fix --package-lock-only --omit=dev --no-fund --ignore-scripts >/dev/null 2>&1 || true
echo "Carpeta: $wt (rama seguridad/$pq). Revisa el diff de package.json antes de subir:"
git diff -U0 -- package.json | grep '^[+-] ' || true
bash "$D/auditar.sh" "$wt" 2>/dev/null || npm audit --package-lock-only --omit=dev | tail -3
