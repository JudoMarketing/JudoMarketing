import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Kill switch universal de service workers.
 *
 * Cuando un navegador va a revisar si hay version nueva de un service worker,
 * manda la cabecera `Sec-Fetch-Dest: serviceworker` (o la vieja
 * `Service-Worker: script`). Da igual en que ruta lo haya registrado Wix:
 * respondemos siempre con este archivo, que se instala y se autodestruye.
 * Asi no dependemos de adivinar el nombre del archivo que uso el sitio viejo.
 */
const KILL_SWITCH = `self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",(e)=>{e.waitUntil((async()=>{
try{const k=await caches.keys();await Promise.all(k.map((x)=>caches.delete(x)))}catch{}
try{await self.registration.unregister()}catch{}
try{const w=await self.clients.matchAll({type:"window"});for(const c of w)c.navigate(c.url)}catch{}
})())});
self.addEventListener("fetch",()=>{});`;

function esPeticionDeServiceWorker(request: NextRequest) {
  return (
    request.headers.get("sec-fetch-dest") === "serviceworker" ||
    request.headers.get("service-worker") === "script"
  );
}

export default function middleware(request: NextRequest) {
  if (esPeticionDeServiceWorker(request)) {
    return new NextResponse(KILL_SWITCH, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store, max-age=0, must-revalidate",
        "service-worker-allowed": "/",
      },
    });
  }

  // Archivos con extension (imagenes, pdf, js sueltos): van directo a estatico.
  if (/\.[^/]+$/.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Dejamos pasar los .js/.png sueltos para poder atrapar el service worker
  // viejo; api, _next y _vercel siguen fuera.
  matcher: "/((?!api|trpc|reparar|_next|_vercel).*)",
};
