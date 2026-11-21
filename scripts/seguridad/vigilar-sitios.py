# Revisión diaria de los sitios de Judo Marketing y sus clientes (Junior,
# 20 nov 2026: «ver que los sitios estén vivos, andando y todo bien, y un
# chequeo rápido de seguridad: que no hayan sido atacados ni haya algo
# extraño»). La corre .github/workflows/sitios.yml; si algo sale mal, el
# flujo falla y GitHub manda el correo.
#
# Uso: python3 scripts/seguridad/vigilar-sitios.py [sitio …]
#
# Lista: scripts/seguridad/sitios.txt (un sitio por línea, la misma de la
# auditoría). Señas y pausas: scripts/seguridad/vigilancia.txt.
#
# Falla (y manda correo) solo con problemas reales:
#   - el sitio no contesta 200 después de 3 intentos;
#   - no tiene su seña (la firma «Judo Marketing» o el nombre del negocio):
#     contesta otra cosa, quedó a medias, lo reemplazaron o lo hackearon;
#   - redirige a otro dominio;
#   - el certificado vence en menos de 10 días (Vercel lo renueva solo mucho
#     antes: si llega a 10, la renovación falló);
#   - algo contesta como PHP o WordPress, o quedó expuesto .env, .git,
#     package.json o la configuración de Vercel;
#   - aparece texto de spam inyectado (casino, viagra, slot gacor…) o un
#     iframe escondido hacia otro dominio.
# Solo avisa, sin fallar: cabeceras de seguridad que faltan y lentitud.
import concurrent.futures as cf
import datetime as dt
import os
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (Judo Marketing, revision diaria de sitios)"
INTENTOS, ESPERA, LENTO, DIAS_CERT = 3, 20, 10.0, 10
FIRMA = re.compile(r"judo\s*marketing|judomarketing", re.I)
SPAM = re.compile(
    r"\b(viagra|cialis|levitra|slot\s?gacor|togel|judi\s(?:online|slot|bola)|situs\s(?:slot|judi|togel)"
    r"|online\scasino|casino\s(?:online|bonus)|payday\sloans?|replica\s(?:watches|rolex)|xxx\svideos?|porn(?:o|hub)?)\b",
    re.I,
)
IFRAME = re.compile(r"<iframe[^>]+(?:display\s*:\s*none|visibility\s*:\s*hidden|width=[\"']?0[\"' ]|height=[\"']?0[\"' ])[^>]*>", re.I)


def leer_lista():
    sitios = [l.strip() for l in open(f"{AQUI}/sitios.txt") if l.strip() and not l.startswith("#")]
    reglas = {}
    for l in open(f"{AQUI}/vigilancia.txt"):
        if not l.strip() or l.startswith("#"):
            continue
        partes = [p.strip() for p in l.split("|")]
        r = reglas.setdefault(partes[0], {})
        for p in partes[1:]:
            clave, _, valor = p.partition(":")
            r[clave.strip()] = valor.strip()
    return sitios, reglas


class SinRedireccion(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


directo = urllib.request.build_opener(SinRedireccion)
normal = urllib.request.build_opener()


def pedir(url, seguir=True, tope=2_000_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    t0 = time.time()
    try:
        r = (normal if seguir else directo).open(req, timeout=25)
        return r.status, r.geturl(), dict(r.headers), r.read(tope), time.time() - t0
    except urllib.error.HTTPError as e:
        return e.code, url, dict(e.headers), (e.read(4000) if e.fp else b""), time.time() - t0
    except Exception as e:
        return None, url, {}, str(e).encode()[:300], time.time() - t0


def cab(h, k):
    return next((v for kk, v in h.items() if kk.lower() == k), "")


def familia(host):
    # www.x.com y x.com son el mismo sitio; en vercel.app y github.io cuenta el nombre completo.
    host = host.lower().removeprefix("www.")
    return host if host.endswith((".vercel.app", ".github.io")) else ".".join(host.split(".")[-2:])


def dias_certificado(host):
    ctx = ssl.create_default_context()
    with socket.create_connection((host, 443), timeout=15) as s, ctx.wrap_socket(s, server_hostname=host) as t:
        vence = dt.datetime.strptime(t.getpeercert()["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=dt.timezone.utc)
    return (vence - dt.datetime.now(dt.timezone.utc)).days


def revisar(sitio, reglas):
    regla = reglas.get(sitio, {})
    host = sitio.split("/")[0]
    res = {"sitio": sitio, "problemas": [], "avisos": [], "pausa": regla.get("pausa", "")}
    for intento in range(INTENTOS):
        st, final, h, cuerpo, seg = pedir(f"https://{sitio}")
        if st == 200:
            break
        if intento < INTENTOS - 1:
            time.sleep(ESPERA)
    res["estado"] = st
    if st != 200:
        motivo = f"no contesta ({st or cuerpo.decode(errors='ignore')[:80]})"
        if res["pausa"]:
            res["avisos"].append(f"{motivo}; en pausa: {res['pausa']}")
        else:
            res["problemas"].append(f"{motivo} después de {INTENTOS} intentos")
        return res
    if res["pausa"]:
        res["avisos"].append(f"contesta otra vez: ya se puede quitar la pausa ({res['pausa']})")
    texto = cuerpo.decode("utf-8", errors="ignore")
    if familia(urllib.request.urlparse(final).hostname or "") != familia(host):
        res["problemas"].append(f"redirige a otro dominio: {final}")
    sena = regla.get("seña")
    if sena:
        if sena.lower() not in texto.lower():
            res["problemas"].append(f"no aparece «{sena}»: no es el sitio de siempre")
    elif not FIRMA.search(texto):
        res["problemas"].append("no aparece la firma «Judo Marketing»: no es el sitio de siempre")
    spam = sorted({m.group(0).lower() for m in SPAM.finditer(texto)})
    if spam:
        res["problemas"].append("texto de spam: " + ", ".join(spam[:5]))
    for m in IFRAME.finditer(texto):
        src = re.search(r"src=[\"']([^\"']+)", m.group(0))
        if src and src.group(1).startswith("http") and familia(urllib.request.urlparse(src.group(1)).hostname or "") != familia(host):
            res["problemas"].append(f"iframe escondido hacia {src.group(1)[:60]}")
    try:
        dias = dias_certificado(host)
        if dias < DIAS_CERT:
            res["problemas"].append(f"el certificado vence en {dias} días")
    except Exception as e:
        res["problemas"].append(f"certificado inválido: {str(e)[:80]}")
    # Señales de ataque: PHP o WordPress contestando, archivos que nunca deben verse.
    if "php" in cab(h, "x-powered-by").lower():
        res["problemas"].append("el servidor dice PHP: " + cab(h, "x-powered-by"))
    base = f"https://{host}"
    for ruta in ["/wp-login.php", "/xmlrpc.php", "/index.php", "/phpinfo.php"]:
        s2, _, h2, b2, _ = pedir(base + ruta, seguir=False, tope=6000)
        if "php" in cab(h2, "x-powered-by").lower() or (s2 and s2 < 300 and (b"wp-content" in b2 or b"<?php" in b2 or b"phpinfo" in b2)):
            res["problemas"].append(f"contesta como PHP: {ruta} ({s2})")
    for ruta, firma in [("/.env", b"="), ("/.git/config", b"[core]"), ("/.git/HEAD", b"ref:"),
                        ("/package.json", b'"dependencies"'), ("/.vercel/project.json", b"projectId")]:
        s2, _, _, b2, _ = pedir(base + ruta, seguir=False, tope=6000)
        inicio = b2[:500].lower()
        if s2 == 200 and firma in b2 and b"<html" not in inicio and b"<!doctype" not in inicio:
            res["problemas"].append(f"archivo expuesto: {ruta}")
    csp = cab(h, "content-security-policy")
    faltan = [n for n, ok in [("HSTS", cab(h, "strict-transport-security")),
                              ("marcos", cab(h, "x-frame-options") or "frame-ancestors" in csp),
                              ("nosniff", cab(h, "x-content-type-options"))] if not ok]
    if faltan and "cabeceras" not in regla:
        res["avisos"].append("faltan cabeceras: " + ", ".join(faltan))
    if seg > LENTO:
        res["avisos"].append(f"tardó {seg:.1f} s en contestar")
    return res


def main():
    sitios, reglas = leer_lista()
    pedidos = [a for a in sys.argv[1:] if not a.startswith("-")]
    if pedidos:
        sitios = [s for s in sitios if s in pedidos] or pedidos
    with cf.ThreadPoolExecutor(8) as ex:
        resultados = list(ex.map(lambda s: revisar(s, reglas), sitios))
    malos = [r for r in resultados if r["problemas"]]
    lineas = [f"# Revisión de sitios · {dt.datetime.now(dt.timezone.utc):%Y-%m-%d %H:%M} UTC", "",
              f"**{len(resultados) - len(malos)} de {len(resultados)} sitios bien.**", "",
              "| Sitio | Estado | Qué pasa |", "| --- | --- | --- |"]
    for r in sorted(resultados, key=lambda r: (not r["problemas"], not r["pausa"], r["sitio"])):
        icono = "❌" if r["problemas"] else ("⏸️" if r["pausa"] else "✅")
        detalle = "; ".join(r["problemas"] + r["avisos"]) or "vivo, es el sitio de siempre, sin señales de ataque"
        lineas.append(f"| {r['sitio']} | {icono} {r['estado']} | {detalle} |")
        print(f"{icono} {r['sitio']:40s} {str(r['estado']):4s} {detalle}")
    resumen = os.environ.get("GITHUB_STEP_SUMMARY")
    if resumen:
        open(resumen, "a").write("\n".join(lineas) + "\n")
    print(f"\n{len(resultados)} sitios, {len(malos)} con problemas.")
    sys.exit(1 if malos else 0)


if __name__ == "__main__":
    main()
