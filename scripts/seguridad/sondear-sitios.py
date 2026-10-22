# Revisa desde afuera cada sitio de scripts/seguridad/sitios.txt:
#  - si algo en el servidor contesta como PHP (X-Powered-By, wp-login, .php);
#  - si quedó expuesto algo que nunca debe verse (.env, .git, package.json);
#  - qué cabeceras de seguridad faltan.
# Uso: python3 scripts/seguridad/sondear-sitios.py [--json salida.json]
# Sale con código 1 si encuentra PHP o archivos expuestos.
import json, os, sys, urllib.request, urllib.error, concurrent.futures as cf

AQUI = os.path.dirname(os.path.abspath(__file__))
sitios = [l.strip() for l in open(f"{AQUI}/sitios.txt") if l.strip() and not l.startswith("#")]

class SinRedireccion(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
abrir = urllib.request.build_opener(SinRedireccion)

def pedir(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Judo Marketing, revision de seguridad)"})
    try:
        r = abrir.open(req, timeout=20); return r.status, dict(r.headers), r.read(4000)
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read(4000) if e.fp else b""
    except Exception as e:
        return None, {}, str(e).encode()

def cab(h, k):
    for kk, v in h.items():
        if kk.lower() == k: return v
    return ""

def sondear(sitio):
    host = sitio.split("/")[0]; base = f"https://{host}"
    st, h, _ = pedir(f"https://{sitio}")
    loc = cab(h, "location")
    if st in (301, 302, 307, 308) and loc.startswith("https://"):
        st, h, _ = pedir(loc)
    csp = cab(h, "content-security-policy")
    r = {"sitio": sitio, "estado": st, "servidor": "vercel" if cab(h, "x-vercel-id") else cab(h, "server"),
         "php": [], "expuesto": [],
         "faltan": [n for n, ok in [("hsts", cab(h, "strict-transport-security")), ("csp", csp),
                                     ("marcos", cab(h, "x-frame-options") or "frame-ancestors" in csp),
                                     ("nosniff", cab(h, "x-content-type-options")), ("referrer", cab(h, "referrer-policy"))] if not ok]}
    if "php" in cab(h, "x-powered-by").lower(): r["php"].append("X-Powered-By: " + cab(h, "x-powered-by"))
    for ruta in ["/index.php", "/wp-login.php", "/xmlrpc.php", "/wp-json/", "/phpinfo.php"]:
        s2, h2, b2 = pedir(base + ruta)
        pw = cab(h2, "x-powered-by").lower()
        if "php" in pw or (s2 and s2 < 300 and (b"wp-content" in b2 or b"<?php" in b2)):
            r["php"].append(f"{ruta} {s2}")
    for ruta, firma in [("/.env", b"="), ("/.git/config", b"[core]"), ("/.git/HEAD", b"ref:"),
                        ("/package.json", b'"dependencies"'), ("/.vercel/project.json", b"projectId")]:
        s2, _, b2 = pedir(base + ruta)
        if s2 == 200 and firma in b2 and b"<html" not in b2[:500].lower() and b"<!doctype" not in b2[:500].lower():
            r["expuesto"].append(ruta)
    return r

with cf.ThreadPoolExecutor(10) as ex:
    res = list(ex.map(sondear, sitios))
graves = 0
for r in res:
    alerta = r["php"] or r["expuesto"]
    graves += bool(alerta)
    print(f"{'⚠ ' if alerta else '  '}{r['sitio']:42s} {str(r['estado']):4s} {r['servidor'][:12]:12s} "
          f"php={r['php'] or '-'} expuesto={r['expuesto'] or '-'} faltan={','.join(r['faltan']) or '-'}")
if "--json" in sys.argv:
    json.dump(res, open(sys.argv[sys.argv.index("--json") + 1], "w"), indent=1, ensure_ascii=False)
print(f"\n{len(res)} sitios, {graves} con PHP o archivos expuestos")
sys.exit(1 if graves else 0)
