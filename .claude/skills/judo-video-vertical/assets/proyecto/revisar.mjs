// Revisa cada escena antes del render completo y avisa lo que un ojo cansado
// deja pasar:
// - una palabra sola en la última línea;
// - el resaltado partido en dos líneas;
// - texto fuera del cuadro o debajo de los botones de Reels y TikTok;
// - texto montado sobre otra cosa;
// - contraste bajo y letra demasiado chica;
// - texto que no se alcanza a leer en lo que dura en pantalla;
// - en la capa pro, una línea con máscara más ancha que su titular.
// Uso: node revisar.mjs [e01 e02 …]   (después de python3 build.py)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, servir } from "./navegador.mjs";

const D = dirname(fileURLToPath(import.meta.url));
const P = join(D, "salida");
const solo = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const escenas = JSON.parse(readFileSync(join(P, "escenas.json"), "utf8")).filter((e) => !solo.length || solo.includes(e.id));
const PASO = 0.25, PALABRAS_POR_SEGUNDO = 4;
const OPCIONES = {
  minPx: 24,
  zonas: [
    { l: 0, t: 0, r: 1080, b: 152, motivo: "cae en la franja de arriba, que tapa la app" },
    { l: 0, t: 1536, r: 1080, b: 1920, motivo: "cae en la franja de abajo, que tapan el texto y los botones de la app" },
    { l: 929, t: 1037, r: 1080, b: 1536, motivo: "queda debajo de los botones de la derecha" },
  ],
  otros: "img:not(.foto img):not(.secuencia), .tel, .objeto, .globo, .tarjeta, .ad, .sello, .total, .sticker, .etiqueta, .fichas b, .marco, .tarjeta-ui, .ui-tarjeta, .recibo, .tablero, .aviso, .casilla, .circulo-blanco, .logo-pro, .objeto-pro, .icono-pro, .iso, .vuela-dentro, .fila-nodos .disco",
  grupos: ".pro-cap, .ad, .tel, .tarjeta, .final, .pila, .foto, .gente, .tarjeta-ui, .ui-tarjeta, .recibo, .tablero, .aviso, .casilla, .contacto-pro, .fila-nodos, .absorbe, .en-hilo",
  ignorar: ".pant, .credito",
};

const web = await servir([P, D]);
const b = await abrirNavegador();
let total = 0;
for (const e of escenas) {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, ignoreHTTPSErrors: true });
  await p.goto(`${web.url}/video.html?e=${e.id}`, { waitUntil: "networkidle" });
  await p.evaluate(() => window.listo);
  await p.addScriptTag({ path: join(D, "revision-texto.js") });
  const veces = new Map(), vistos = new Map();
  // Con capa pro, la salida (el panel que entra en el último medio segundo)
  // no se revisa: ahí todo se va a propósito
  const conPanel = await p.evaluate(() => Boolean(document.querySelector("#cuadro .panel")));
  for (let t = 0.1; t <= (conPanel ? e.dur - 0.55 : e.dur + 0.2); t += PASO) {
    const r = await p.evaluate(async ({ t, op }) => {
      for (const a of document.getAnimations()) a.currentTime = t * 1000;
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      const r = window.revisarTextos(document.getElementById("cuadro"), op);
      // Una línea con máscara no se parte: si es más ancha que su titular, se sale del margen
      for (const sp of document.querySelectorAll(".pro-cap .m > span")) {
        const caja = sp.closest(".pro-cap").getBoundingClientRect(), x = sp.getBoundingClientRect();
        if (x.width > 2 && (x.right > caja.right + 2 || x.left < caja.left - 2)) r.problemas.push(`«${sp.textContent.trim().slice(0, 40)}»: no cabe en el ancho del titular (${Math.round(x.width)} de ${Math.round(caja.width)} px)`);
      }
      return r;
    }, { t, op: OPCIONES });
    for (const x of r.problemas) veces.set(x, (veces.get(x) || 0) + 1);
    for (const l of r.legibles) { const v = vistos.get(l.txt) || { palabras: l.palabras, n: 0 }; v.n++; vistos.set(l.txt, v); }
  }
  await p.close();
  // Lo que se encima un instante (algo que entra o sale, una palabra que entra
  // agrandada) no es problema
  const reales = [...veces].filter(([x, n]) => n >= 3 || !/se monta|se enciman|pisa la línea/.test(x)).map(([x]) => x);
  for (const [txt, v] of vistos) {
    const visto = v.n * PASO, hace = v.palabras / PALABRAS_POR_SEGUNDO;
    if (v.palabras > 3 && visto < hace * 0.75) reales.push(`«${txt.slice(0, 40)}»: está ${visto.toFixed(1)} s en pantalla y se lee en ${hace.toFixed(1)} s`);
  }
  total += reales.length;
  console.log(reales.length ? `${e.id}:\n  - ${reales.join("\n  - ")}` : `${e.id}: bien`);
}
await b.close();
web.cerrar();
console.log(total ? `\n${total} cosas que revisar. Arréglalas o explica por qué se quedan.` : "\nSin problemas de texto.");
