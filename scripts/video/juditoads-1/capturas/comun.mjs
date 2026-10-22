// Teléfono simulado (390x844 a 2x) para fotografiar JuditoADS como se ve en un iPhone
import { chromium } from "playwright-core";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHROME } from "../navegador.mjs";

export const D = dirname(fileURLToPath(import.meta.url));
export const BASE = process.env.JADS_URL || "http://localhost:3020";

export async function abrir({ estado } = {}) {
  const b = await chromium.launch({ executablePath: CHROME });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "es-US", storageState: estado });
  const p = await ctx.newPage();
  return { b, ctx, p };
}

// Lista corta de botones y títulos visibles: sirve para ver en la consola en qué pantalla quedó
export async function textos(p) {
  for (let i = 0; i < 5; i++) {
    try {
      await p.waitForLoadState("networkidle");
      return (await p.$$eval("button, a, h1, h2, h3, label", (els) => els.map((e) => e.tagName[0] + ":" + e.innerText.trim().replace(/\s+/g, " ")).filter((x) => x.length > 2 && x.length < 120))).slice(0, 70);
    } catch { await p.waitForTimeout(1500); }
  }
  return [];
}

export async function foto(p, S, n) {
  await p.waitForTimeout(1500);
  const t = await textos(p);
  await p.screenshot({ path: `${S}/${n}.png` });
  console.log("==", n, p.url(), "\n ", t.join(" | "));
}
