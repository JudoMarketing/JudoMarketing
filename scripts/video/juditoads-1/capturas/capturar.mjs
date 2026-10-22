// Fotografía las pantallas de JuditoADS que salen en el video, de punta a punta:
// inicio, entrada, panel, cuentas de Meta, asistente de campaña y campaña activada.
// La app tiene que estar corriendo en modo demo, con una base vacía (ver docs/VIDEOS.md).
// Uso: node capturas/capturar.mjs   → PNG en capturas/salida
import { mkdirSync } from "node:fs";
import { abrir, foto, BASE, D } from "./comun.mjs";

const S = `${D}/salida`;
mkdirSync(S, { recursive: true });
const DEMO = { nombre: "Junior Osorio", negocio: "Café Luna Miami", correo: "demo@cafeluna.test", clave: "demo-video-2026" };
const PUBLICO = "Gente de Miami que ama el café de especialidad y los postres caseros.";
const TEXTO_ANUNCIO = "☕ 2x1 en lattes todos los martes en Café Luna, Brickell. Ven con alguien que quieras.";
const espanol = async (p) => { const es = p.getByRole("button", { name: "ES", exact: true }); if (await es.count()) await es.click(); };
const siguiente = async (p, espera = 1500) => { await p.getByRole("button", { name: /Siguiente/ }).click(); await p.waitForTimeout(espera); };

// 1. Sin sesión: la página de inicio completa y la pantalla de entrada con los datos puestos
{
  const { b, p } = await abrir();
  await p.goto(`${BASE}/es`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${S}/00-landing-full.png`, fullPage: true });
  console.log("== 00-landing-full");
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await espanol(p);
  await p.locator("input[type=email], input[name=email]").first().fill("junior@cafeluna.com");
  await p.locator("input[type=password]").first().fill(DEMO.clave);
  await foto(p, S, "01b-login");
  await b.close();
}

const { b, p } = await abrir();

// 2. Cuenta de demo y panel recién creado, antes de conectar Meta
await p.goto(`${BASE}/registro`, { waitUntil: "networkidle" });
await espanol(p);
await p.waitForTimeout(500);
const campos = p.locator("input");
await campos.nth(0).fill(DEMO.nombre);
await campos.nth(1).fill(DEMO.negocio);
await campos.nth(2).fill(DEMO.correo);
await campos.nth(3).fill(DEMO.clave);
await p.locator("button[type=submit]").click();
await p.waitForURL(/\/app/, { timeout: 60000 }).catch(() => {});
if (!/\/app/.test(p.url())) {
  // La cuenta ya existía: se entra con ella
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await espanol(p);
  await p.locator("input[type=email], input[name=email]").first().fill(DEMO.correo);
  await p.locator("input[type=password]").first().fill(DEMO.clave);
  await p.locator("button[type=submit]").first().click();
  await p.waitForURL(/\/app/, { timeout: 60000 });
}
await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
await foto(p, S, "02-inicio");

// 3. Cuentas de Meta conectadas (las de demo de la app), vistas en la lista
await p.goto(`${BASE}/app/cuentas`, { waitUntil: "networkidle" });
const demo = p.getByRole("link", { name: /Activar cuentas demo/ });
if (await demo.count()) { await demo.click(); await p.waitForTimeout(4000); }
await p.goto(`${BASE}/app/cuentas`, { waitUntil: "networkidle" });
await p.getByText(/Tus cuentas publicitarias/).first().scrollIntoViewIfNeeded();
await p.evaluate(() => window.scrollBy(0, -90));
await foto(p, S, "16-cuentas-lista");

// 4. Asistente: objetivo y público, luego el paso 3 (qué anunciar)
await p.goto(`${BASE}/app/campanas/nueva`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const rubro = p.getByRole("button", { name: /Restaurante/ }); if (await rubro.count()) await rubro.click();
const objetivo = p.getByRole("button", { name: /^Interacción/ }); if (await objetivo.count()) await objetivo.click();
await siguiente(p);
const pais = p.getByRole("button", { name: "Estados Unidos", exact: true }); if (await pais.count()) await pais.click();
const publico = p.locator("textarea").first(); if (await publico.count()) await publico.fill(PUBLICO);
await siguiente(p, 2000);
await foto(p, S, "07-paso3");

// 5. Creativo nuevo con la foto de Café Luna y el paso 4 (presupuesto por día y por campaña)
await p.getByRole("button", { name: /Un creativo nuevo/ }).click();
await p.waitForTimeout(800);
await p.locator("input[type=file]").first().setInputFiles(`${D}/cafe-luna.jpg`);
await p.waitForTimeout(3000);
await p.locator("textarea").first().fill(TEXTO_ANUNCIO);
await siguiente(p, 2500);
const alPresupuesto = async () => {
  await p.evaluate(() => {
    const h = [...document.querySelectorAll("h1,h2,h3,h4,div,span")].find((e) => e.children.length === 0 && e.textContent.includes("Presupuesto") && e.textContent.includes("💰"));
    window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 150);
  });
  await p.waitForTimeout(600);
};
const tipo = p.locator("xpath=//label[contains(., 'Tipo de presupuesto')]/following::select[1]");
const monto = p.locator("xpath=//label[contains(., 'Monto')]/following::input[1]");
await alPresupuesto();
await tipo.selectOption({ index: 0 });
await monto.fill("5");
await alPresupuesto();
await foto(p, S, "17-presupuesto-dia");
await tipo.selectOption({ index: 1 });
await p.waitForTimeout(600);
await monto.fill("150");
await alPresupuesto();
await foto(p, S, "18-presupuesto-total");

// 6. Se crea con $5 diarios y se activa: la confirmación es "¡Tu campaña ya está en Meta!"
await tipo.selectOption({ index: 0 });
await monto.fill("5");
await p.getByRole("button", { name: /Crear campaña/ }).click();
await p.waitForTimeout(7000);
await p.goto(`${BASE}/app/campanas`, { waitUntil: "networkidle" });
await p.locator("a[href*='/app/campanas/c']").first().click();
await p.waitForTimeout(5000);
await p.getByRole("button", { name: /Activar campaña/ }).click();
await p.waitForTimeout(1500);
await foto(p, S, "14b-confirmar");
await b.close();
console.log("listo:", S);
