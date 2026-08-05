import { NextRequest, NextResponse } from "next/server";
import { fetchSiteStatus } from "./lib/judo-kit";

/**
 * Judo Site Kit: kill switch.
 * Consulta el estado del sitio en el panel central con caché de 60s.
 * Si Administración lo deshabilitó, todo el sitio muestra la página
 * de suspensión. Fail-open: si el panel no responde, el sitio sigue vivo.
 */

let cachedStatus = "activo";
let cachedAt = 0;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // La propia página de suspensión y los assets siempre pasan
  if (
    pathname.startsWith("/judo-suspendido") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (Date.now() - cachedAt > 60_000) {
    cachedStatus = await fetchSiteStatus();
    cachedAt = Date.now();
  }

  if (cachedStatus === "deshabilitado") {
    const url = req.nextUrl.clone();
    url.pathname = "/judo-suspendido";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|favicon.ico).*)",
};
