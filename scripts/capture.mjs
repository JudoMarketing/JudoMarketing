// Capturas de verificación visual. Uso: SCRATCH=/ruta node scripts/capture.mjs
import { chromium } from "playwright-core";

const out = process.env.SCRATCH || ".";
const base = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const cap = async (url, name, wait = 2200) => {
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
};

await cap("/es", "v2-hero");
await cap("/es/contacto", "v2-contact");
await cap("/es/nosotros", "v2-about");
await page.setViewportSize({ width: 390, height: 844 });
await cap("/es", "v2-mobile");
await browser.close();
console.log("capturas ok");
