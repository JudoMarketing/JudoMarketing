#!/usr/bin/env node
/**
 * Manda los borradores que la sesión escribió y deja registro de la corrida.
 * El envío real lo hace el sitio (/api/leads), que aplica los candados:
 * nada a quien pidió baja, nada dos veces en 120 días, tope diario, y en
 * modo prueba todo va al correo de prueba en vez de al negocio.
 *
 *   node scripts/leads/enviar.mjs --borradores /ruta/borradores.json
 *
 * Formato del archivo:
 * {
 *   "zip": "33130", "encontrados": 100, "con_correo": 38,
 *   "resumen": "texto corto de la corrida para el registro",
 *   "borradores": [
 *     { "lead_id": "uuid", "idioma": "es", "rubro": "restaurante",
 *       "asunto": "...", "saludo": "...", "parrafos": ["...", "..."], "ps": "..." }
 *   ]
 * }
 *
 * Entorno: LEADS_SECRET (obligatorio), LEADS_SITE (opcional).
 */

import { readFile } from "node:fs/promises";

const SITE = (process.env.LEADS_SITE ?? "https://www.judomarketing.net").replace(/\/$/, "");
const SECRETO = process.env.LEADS_SECRET;

async function api(cuerpo) {
  if (!SECRETO) throw new Error("Falta LEADS_SECRET en el entorno");
  const res = await fetch(`${SITE}/api/leads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SECRETO}`, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/api/leads → ${res.status}: ${datos.error ?? "sin detalle"}`);
  return datos;
}

function revisarLocal(b) {
  const problemas = [];
  const todo = [b.asunto, b.saludo, ...(b.parrafos ?? []), b.ps ?? ""].join(" ");
  if (/[—–]/.test(todo)) problemas.push("raya larga");
  if (/\b(garantiz|guarantee|100% seguro|primer lugar en google|#1 on google|first page of google)\b/i.test(todo)) problemas.push("promesa que no se puede cumplir");
  const palabras = (b.parrafos ?? []).join(" ").split(/\s+/).length;
  if (palabras < 60) problemas.push(`muy corto (${palabras} palabras)`);
  if (palabras > 220) problemas.push(`muy largo (${palabras} palabras)`);
  if ((b.asunto ?? "").length > 70) problemas.push("asunto largo");
  if (/[!]{2,}|GRATIS|FREE!!!|\$\$\$/.test(todo)) problemas.push("suena a spam");
  return problemas;
}

async function main() {
  const i = process.argv.indexOf("--borradores");
  const ruta = i >= 0 ? process.argv[i + 1] : null;
  if (!ruta) {
    console.error("Uso: node scripts/leads/enviar.mjs --borradores /ruta/borradores.json");
    process.exit(2);
  }
  const archivo = JSON.parse(await readFile(ruta, "utf8"));
  const borradores = archivo.borradores ?? [];
  if (!borradores.length) throw new Error("El archivo no trae borradores");
  if (borradores.length > 20) throw new Error(`Son ${borradores.length} borradores; el máximo por corrida es 20`);

  let conProblemas = 0;
  for (const b of borradores) {
    const p = revisarLocal(b);
    if (p.length) {
      conProblemas++;
      console.error(`Revisar ${b.lead_id}: ${p.join(", ")}`);
    }
  }
  if (conProblemas) {
    console.error(`${conProblemas} borradores con problemas. Corrígelos y vuelve a correr; no se mandó nada.`);
    process.exit(1);
  }

  const { modo, resultados } = await api({ accion: "enviar", borradores });
  const ok = resultados.filter((r) => r.ok);
  const mal = resultados.filter((r) => !r.ok);
  console.log(`Modo ${modo}: ${ok.length} enviados, ${mal.length} rechazados.`);
  for (const r of ok) console.log(`  ✓ ${r.lead_id} → ${r.a}`);
  for (const r of mal) console.log(`  ✗ ${r.lead_id}: ${r.motivo}`);

  if (archivo.zip) {
    await api({
      accion: "corrida",
      zip: archivo.zip,
      encontrados: archivo.encontrados ?? 0,
      con_correo: archivo.con_correo ?? 0,
      enviados: modo === "real" ? ok.length : 0,
      resumen: archivo.resumen ?? "",
    });
    console.log("Corrida registrada.");
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
