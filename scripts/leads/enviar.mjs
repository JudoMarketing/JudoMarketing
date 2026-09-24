#!/usr/bin/env node
/**
 * Entrega los borradores que la sesión escribió y deja registro de la corrida.
 *
 * Por defecto los GUARDA en el sitio (accion "borradores"): el sitio los
 * manda solo, una vez al día, desde /api/leads/cron (9:30 AM de Miami), con
 * los candados: nada a quien pidió baja, un solo correo por negocio en la
 * vida, tope diario por país, y en modo prueba todo va al correo de prueba.
 * Así la sesión automática, que no puede mandar correos reales, deja el
 * trabajo listo y el envío lo hace el servidor.
 *
 *   node scripts/leads/enviar.mjs --borradores /ruta/borradores-us.json
 *   node scripts/leads/enviar.mjs --borradores /ruta/borradores.json --ahora   (manda ya)
 *
 * Formato del archivo:
 * {
 *   "zip": "33130", "pais": "us", "zona": "Downtown Miami",
 *   "encontrados": 100, "con_correo": 38,
 *   "resumen": "texto corto de la corrida para el registro",
 *   "aprendizajes": ["lo que esta corrida enseñó y la siguiente debe saber"],
 *   "borradores": [
 *     { "lead_id": "uuid", "idioma": "es", "rubro": "restaurante",
 *       "asunto": "...", "saludo": "...", "parrafos": ["...", "..."], "ps": "...",
 *       "adjunto_pdf": "/ruta/al/informe.pdf" }
 *   ]
 * }
 *
 * adjunto_pdf es opcional: el informe de presencia en línea que genera
 * scripts/leads/informe.mjs para los negocios con website. Los correos con
 * adjunto salen en lotes de 4 para no pasar el tamaño máximo de petición.
 *
 * aprendizajes es la memoria entre corridas: se guarda junto al resumen en
 * leads_corridas y la siguiente sesión lo lee con GET /api/leads?memoria=1
 * antes de elegir. Máximo 10 negocios por corrida: una corrida por país y
 * por día. "zona" es el nombre legible de la zona; va en el pie del correo.
 *
 * Entorno: LEADS_SECRET (obligatorio), LEADS_SITE (opcional).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const SITE = (process.env.LEADS_SITE ?? "https://www.judomarketing.net").replace(/\/$/, "");
const SECRETO = process.env.LEADS_SECRET;
// Diez negocios por día, elegidos con criterio. Diez buenos valen más que
// veinte regulares: cada correo ignorado baja la reputación del dominio.
const MAX_POR_CORRIDA = 10;

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
  if (palabras < 45) problemas.push(`muy corto (${palabras} palabras)`);
  if (palabras > 125) problemas.push(`muy largo (${palabras} palabras; la guía pide entre 60 y 110)`);
  if ((b.asunto ?? "").length > 70) problemas.push("asunto largo");
  if (/[!]{2,}|GRATIS|FREE!!!|\$\$\$/.test(todo)) problemas.push("suena a spam");
  return problemas;
}

async function main() {
  const i = process.argv.indexOf("--borradores");
  const ruta = i >= 0 ? process.argv[i + 1] : null;
  const ahora = process.argv.includes("--ahora");
  if (!ruta) {
    console.error("Uso: node scripts/leads/enviar.mjs --borradores /ruta/borradores.json [--ahora]");
    process.exit(2);
  }
  const archivo = JSON.parse(await readFile(ruta, "utf8"));
  const borradores = archivo.borradores ?? [];
  const lugar = typeof archivo.zona === "string" ? archivo.zona.split("/")[0].trim().slice(0, 80) : undefined;
  if (!borradores.length) throw new Error("El archivo no trae borradores");
  if (borradores.length > MAX_POR_CORRIDA) throw new Error(`Son ${borradores.length} borradores; el máximo por corrida es ${MAX_POR_CORRIDA}`);
  for (const b of borradores) {
    if (b.adjunto_pdf) await readFile(b.adjunto_pdf).catch(() => { throw new Error(`No existe el adjunto ${b.adjunto_pdf}`); });
  }

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

  // Adjuntos a base64, y envío por lotes (4 con adjunto por petición).
  const listos = [];
  for (const b of borradores) {
    const { adjunto_pdf, ...resto } = b;
    if (lugar && !resto.lugar) resto.lugar = lugar;
    if (adjunto_pdf) {
      const contenido = await readFile(adjunto_pdf);
      if (contenido.length > 1_500_000) throw new Error(`${adjunto_pdf} pesa ${Math.round(contenido.length / 1024)} KB; el máximo es 1.500 KB`);
      resto.adjunto = { nombre: path.basename(adjunto_pdf).replace(/[^\w.-]/g, "_"), base64: contenido.toString("base64") };
    }
    listos.push(resto);
  }
  const lotes = [];
  let actual = [];
  for (const b of listos) {
    actual.push(b);
    if (actual.length >= (actual.some((x) => x.adjunto) ? 4 : MAX_POR_CORRIDA)) {
      lotes.push(actual);
      actual = [];
    }
  }
  if (actual.length) lotes.push(actual);

  let modo = "prueba";
  const resultados = [];
  for (const lote of lotes) {
    const r = await api({ accion: ahora ? "enviar" : "borradores", borradores: lote });
    if (r.modo) modo = r.modo;
    resultados.push(...r.resultados);
  }
  const ok = resultados.filter((r) => r.ok);
  const mal = resultados.filter((r) => !r.ok);
  if (ahora) console.log(`Modo ${modo}: ${ok.length} enviados, ${mal.length} rechazados.`);
  else console.log(`${ok.length} borradores guardados, ${mal.length} rechazados. El sitio los manda hoy a las 9:30 AM de Miami (/api/leads/cron).`);
  for (const r of ok) console.log(`  ✓ ${r.lead_id} → ${r.a}`);
  for (const r of mal) console.log(`  ✗ ${r.lead_id}: ${r.motivo}`);

  if (archivo.zip) {
    // El resumen y los aprendizajes quedan en leads_corridas: es lo que la
    // siguiente corrida lee para no repetir errores y afinar el criterio.
    const aprendizajes = (archivo.aprendizajes ?? []).filter((x) => typeof x === "string" && x.trim());
    const resumen = [
      archivo.zona ? `${archivo.pais ?? "us"} · ${archivo.zona}` : "",
      ahora ? "" : `${ok.length} borradores guardados para el envío del sitio`,
      archivo.resumen ?? "",
      aprendizajes.length ? "Aprendizajes: " + aprendizajes.map((x) => x.trim()).join(" · ") : "",
    ]
      .filter(Boolean)
      .join("\n");
    await api({
      accion: "corrida",
      zip: archivo.zip,
      encontrados: archivo.encontrados ?? 0,
      con_correo: archivo.con_correo ?? 0,
      enviados: ahora && modo === "real" ? ok.length : 0,
      resumen,
    });
    console.log(`Corrida registrada${aprendizajes.length ? ` con ${aprendizajes.length} aprendizajes` : ""}.`);
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
