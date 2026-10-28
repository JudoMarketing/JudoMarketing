// Fotografía cada escena cuadro por cuadro a 1080x1920 y 60 cuadros por
// segundo, con el tiempo de cada animación puesto a mano (nada depende del
// reloj), y la codifica en salida/clips/<id>.mp4.
// Uso: node render.mjs [e01 e04 …] [--muestra] [--hilos 3]
//   --muestra  cinco cuadros sueltos por escena en salida/escenas/<id>, sin codificar
//   --hilos N  escenas en paralelo (por defecto 3)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, servir } from "./navegador.mjs";

const D = dirname(fileURLToPath(import.meta.url));
const P = join(D, "salida");
const FPS = 60, EXTRA = 0.25;
const args = process.argv.slice(2);
const muestra = args.includes("--muestra");
const iH = args.indexOf("--hilos");
const hilos = iH >= 0 ? Math.max(1, Number(args[iH + 1]) || 1) : 3;
const solo = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--hilos");
const escenas = JSON.parse(readFileSync(join(P, "escenas.json"), "utf8")).filter((e) => !solo.length || solo.includes(e.id));
if (!escenas.length) { console.error("No hay escenas que renderizar (¿corriste build.py?)."); process.exit(1); }

function ffmpeg() {
  try { return execFileSync("python3", ["-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"]).toString().trim(); } catch {}
  try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); return "ffmpeg"; } catch {}
  console.error("Falta ffmpeg: pip install imageio-ffmpeg (o instala ffmpeg)."); process.exit(1);
}
const ff = ffmpeg();

// Videos reales: se abren en cuadros una sola vez
const cuadrosDe = {};
for (const e of escenas) for (const s of e.secuencias || []) {
  const dir = join(P, "secuencias", s.slug);
  if (!existsSync(join(dir, "f00001.jpg"))) {
    mkdirSync(dir, { recursive: true });
    const origen = join(D, s.video);
    if (!existsSync(origen)) { console.error(`No encuentro el video ${s.video}`); process.exit(1); }
    execFileSync(ff, ["-loglevel", "error", "-y", "-i", origen, "-vf", `fps=${FPS},scale='min(1080,iw)':-2`, "-q:v", "3", join(dir, "f%05d.jpg")]);
  }
  cuadrosDe[s.slug] = readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
}

const web = await servir([P, D]);
const b = await abrirNavegador();
const cola = [...escenas];

async function renderizar(e) {
  const total = e.dur + EXTRA;
  const n = Math.round(total * FPS);
  const dir = join(P, "escenas", e.id);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  await p.goto(`${web.url}/video.html?e=${e.id}`, { waitUntil: "networkidle" });
  await p.evaluate(() => window.listo);
  const lista = muestra ? [0.1, 0.3, 0.5, 0.7, 0.9].map((x) => Math.round(x * (n - 1))) : [...Array(n).keys()];
  const t0 = Date.now();
  for (const i of lista) {
    await p.evaluate(async ({ t, fps, cuadros }) => {
      for (const a of document.getAnimations()) a.currentTime = t * 1000;
      for (const img of document.querySelectorAll("img.secuencia[data-slug]")) {
        const k = Math.min(Math.floor(t * fps), (cuadros[img.dataset.slug] || 1) - 1) + 1;
        const src = `secuencias/${img.dataset.slug}/f${String(k).padStart(5, "0")}.jpg`;
        if (!img.src.endsWith(src)) { img.src = src; await img.decode().catch(() => {}); }
      }
      // Dos cuadros del navegador antes de la foto: sin esto, una animación
      // que ya había corrido al cargar salía con su valor viejo.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, { t: i / FPS, fps: FPS, cuadros: cuadrosDe });
    await p.screenshot({ path: join(dir, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  await p.close();
  if (!muestra) {
    mkdirSync(join(P, "clips"), { recursive: true });
    execFileSync(ff, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%04d.jpg"),
      "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", join(P, "clips", `${e.id}.mp4`)]);
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`${e.id}: ${lista.length} cuadros en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

await Promise.all(Array.from({ length: Math.min(hilos, cola.length) }, async () => {
  while (cola.length) await renderizar(cola.shift());
}));
await b.close();
web.cerrar();
