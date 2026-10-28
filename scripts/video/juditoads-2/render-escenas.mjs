// Render de producción: cada escena a 1080x1920 y 60 cuadros por segundo,
// con el tiempo de cada animación puesto a mano (nada depende del reloj).
// Uso: node render-escenas.mjs [e01 e04 …] [--muestra]   (sin ids, todas)
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHROME, servir } from "./navegador.mjs";
const D = dirname(fileURLToPath(import.meta.url));
const P = `${D}/salida`;
const FPS = 60, EXTRA = 0.25;
const escenas = JSON.parse(readFileSync(`${P}/escenas.json`, "utf8"));
const args = process.argv.slice(2);
const muestra = args.includes("--muestra");
const solo = args.filter((a) => !a.startsWith("--"));
const ff = execFileSync("python3", ["-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"]).toString().trim();
// El vuelo (plantilla f04) viene grabado sin textos (vuelo/render.mjs); se
// abre en cuadros una vez y la página le pone encima la etiqueta y el titular.
if (escenas.some((e) => e.f === "f04" && (!solo.length || solo.includes(e.id))) && !existsSync(`${P}/vuelo-hd/f0000.png`)) {
  mkdirSync(`${P}/vuelo-hd`, { recursive: true });
  execFileSync(ff, ["-loglevel", "error", "-i", `${D}/vuelo-hd.mp4`, "-start_number", "0", `${P}/vuelo-hd/f%04d.png`]);
}
const web = await servir([P, D]);
const b = await chromium.launch({ executablePath: CHROME, args: ["--ignore-certificate-errors", "--hide-scrollbars"] });
for (const e of escenas) {
  if (solo.length && !solo.includes(e.id)) continue;
  const total = e.dur + EXTRA;
  const n = Math.round(total * FPS);
  const dir = `${P}/escenas/${e.id}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  await p.goto(`${web.url}/video.html?e=${e.id}`, { waitUntil: "networkidle" });
  await p.evaluate(() => window.listo);
  await p.evaluate(() => {
    for (const a of document.getAnimations()) a.pause();
    window.ponerTiempo = async (t, total, cuadroVuelo) => {
      const tau = Math.min(t / total, 0.9999);
      for (const a of document.getAnimations()) {
        const tm = a.effect.getTiming();
        if (tm.iterations !== Infinity || a.animationName === "latido") a.currentTime = t * 1000;
        else a.currentTime = tau * tm.duration;
      }
      const v = document.getElementById("vuelo");
      if (v && cuadroVuelo) {
        v.src = cuadroVuelo; await v.decode().catch(() => {});
        document.getElementById("cuadro").classList.toggle("llegó", t > total - 1.25);
      }
      // Dos cuadros del navegador antes de la foto: sin esto, una animación que ya
      // había corrido sola al cargar la página salía con su valor viejo (la frase
      // del primer bucle aparecía antes de tiempo).
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    };
  });
  const cuadros = muestra ? [0.1, 0.3, 0.5, 0.7, 0.9].map((x) => Math.round(x * (n - 1))) : [...Array(n).keys()];
  const t0 = Date.now();
  for (const i of cuadros) {
    const t = i / FPS;
    const fv = e.f === "f04" ? `/vuelo-hd/f${String(Math.min(i, 269)).padStart(4, "0")}.png` : null;
    await p.evaluate(({ t, total, fv }) => window.ponerTiempo(t, total, fv), { t, total, fv });
    await p.screenshot({ path: `${dir}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 93 });
  }
  await p.close();
  if (!muestra) {
    mkdirSync(`${P}/clips`, { recursive: true });
    execFileSync(ff, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${dir}/f%04d.jpg`, "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", `${P}/clips/${e.id}.mp4`]);
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`${e.id}: ${cuadros.length} cuadros en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await b.close();
web.cerrar();
