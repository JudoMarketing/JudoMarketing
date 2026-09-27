#!/usr/bin/env node
/**
 * Envío manual e inmediato de un archivo de borradores. Solo lo usa Junior
 * (o su chat) a mano: la sesión automática usa guardar.mjs, que deja los
 * borradores en la base y el sitio los manda a las 9:30 AM de Miami.
 *
 *   node scripts/leads/enviar.mjs --borradores /ruta/borradores.json
 *
 * Mismo formato de archivo y mismas revisiones que guardar.mjs. Respeta los
 * candados del servidor: nada a quien pidió baja, un solo correo por
 * negocio en la vida, tope diario por país, modo prueba.
 */

import { procesar } from "./guardar.mjs";

const i = process.argv.indexOf("--borradores");
const ruta = i >= 0 ? process.argv[i + 1] : null;
if (!ruta) {
  console.error("Uso: node scripts/leads/enviar.mjs --borradores /ruta/borradores.json");
  process.exit(2);
}
procesar(ruta, { ahora: true }).catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
