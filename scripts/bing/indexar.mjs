#!/usr/bin/env node
/**
 * Bing (y con él Copilot, DuckDuckGo y Yahoo): que sepan que existimos.
 *
 * Dos caminos, y este script hace los dos:
 *
 *  1. IndexNow (la clave ya existe: src/lib/indexnow.ts y public/<clave>.txt):
 *     un aviso "estas URLs cambiaron" que Bing acepta de cualquier
 *     sitio que demuestre ser el dueño con un archivo de clave en su raíz
 *     (public/<clave>.txt). No necesita cuenta. Es lo primero que se corre.
 *
 *  2. Bing Webmaster Tools (necesita BING_WEBMASTER_API_KEY, se saca en
 *     bing.com/webmasters → Settings → API access): da de alta el sitio si
 *     falta, manda el sitemap y las URLs por la cola oficial, y dice cuánta
 *     cuota queda. Si el sitio está sin verificar, imprime qué falta.
 *
 *   node scripts/bing/indexar.mjs                 (IndexNow + Webmaster si hay llave)
 *   node scripts/bing/indexar.mjs --solo-indexnow
 *
 * Las URLs salen del sitemap del sitio, así que nunca hay que editar esto.
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITIO = "https://www.judomarketing.net";
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public");
const soloIndexNow = process.argv.includes("--solo-indexnow");

async function urlsDelSitemap() {
  const xml = await (await fetch(`${SITIO}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/** La clave de IndexNow es el nombre del archivo hexadecimal de 32 letras en public/. */
function claveIndexNow() {
  const f = readdirSync(PUBLIC).find((n) => /^[0-9a-f]{32}\.txt$/.test(n));
  if (!f) throw new Error("No hay archivo de clave IndexNow en public/ (32 hexadecimales .txt)");
  return f.replace(/\.txt$/, "");
}

async function indexNow(urls) {
  const key = claveIndexNow();
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "www.judomarketing.net", key, keyLocation: `${SITIO}/${key}.txt`, urlList: urls }),
  });
  console.log(`IndexNow: ${res.status} ${res.status === 200 || res.status === 202 ? "aceptado" : await res.text()} (${urls.length} URLs)`);
}

const API = "https://ssl.bing.com/webmaster/api.svc/json";
async function bing(metodo, cuerpo) {
  const llave = process.env.BING_WEBMASTER_API_KEY;
  const res = await fetch(`${API}/${metodo}?apikey=${llave}`, {
    method: cuerpo ? "POST" : "GET",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${metodo} → ${res.status}: ${JSON.stringify(datos).slice(0, 200)}`);
  return datos.d;
}

async function webmaster(urls) {
  if (!process.env.BING_WEBMASTER_API_KEY) {
    console.log("Bing Webmaster: sin BING_WEBMASTER_API_KEY; solo se hizo IndexNow.");
    return;
  }
  const sitios = await bing("GetUserSites");
  let sitio = (sitios ?? []).find((s) => s.Url.replace(/\/$/, "") === SITIO);
  if (!sitio) {
    console.log("Bing Webmaster: el sitio no está; dándolo de alta...");
    await bing("AddSite", { siteUrl: `${SITIO}/` });
    sitio = ((await bing("GetUserSites")) ?? []).find((s) => s.Url.replace(/\/$/, "") === SITIO);
  }
  console.log(`Bing Webmaster: ${SITIO} · verificado: ${sitio?.IsVerified ? "sí" : "NO"}`);
  if (!sitio?.IsVerified) {
    console.log("  Falta verificar: en bing.com/webmasters → Settings → Verify ownership → HTML meta tag, copiar el código y ponerlo en Vercel como NEXT_PUBLIC_BING_VERIFICATION (el sitio ya lo imprime). Después: node scripts/bing/indexar.mjs otra vez.");
    try {
      await bing("VerifySite", { siteUrl: `${SITIO}/` });
      console.log("  Verificación pedida.");
    } catch (e) {
      console.log(`  (${e.message})`);
    }
    return;
  }
  await bing("SubmitFeed", { siteUrl: `${SITIO}/`, feedUrl: `${SITIO}/sitemap.xml` });
  console.log("  Sitemap enviado.");
  const cuota = await bing("GetUrlSubmissionQuota", undefined).catch(() => null);
  if (cuota) console.log(`  Cuota diaria de URLs: ${cuota.DailyQuota}, mensual: ${cuota.MonthlyQuota}`);
  await bing("SubmitUrlBatch", { siteUrl: `${SITIO}/`, urlList: urls });
  console.log(`  ${urls.length} URLs enviadas a la cola de Bing.`);
}

const urls = await urlsDelSitemap();
await indexNow(urls);
if (!soloIndexNow) await webmaster(urls);
