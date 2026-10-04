// Graba los videos de portada del showcase (Junior, 4 de octubre de 2026).
//
// Cada ficha del showcase enseña el home del sitio. Los que tienen movimiento
// se ven mejor en video: la entrada animada del hero y un recorrido suave
// hacia abajo que dispara las animaciones de las secciones. Este script graba
// eso con el screencast de Chrome (cada cuadro trae su hora real, así que el
// video sale a la velocidad de verdad), corta lo que no sirve (pantalla en
// blanco, el cargador del sitio) y lo deja listo en public/showcase/video/:
//
//   <slug>.mp4   unos 5 segundos, 800x500, sin audio, en bucle
//   <slug>.jpg   el hero ya cargado, de póster mientras el video carga
//
// Uso (desde la raíz del repo):
//   pip install imageio-ffmpeg      # o tener ffmpeg con libx264 en el PATH
//   node scripts/showcase/grabar-videos.mjs                 # todos
//   node scripts/showcase/grabar-videos.mjs zanoah.shop     # uno
//
// Para sumar un sitio: se agrega a SITIOS con su dominio tal como está en el
// portal, se graba, se revisa el video a ojo y se agrega el mismo dominio a
// VIDEOS_PORTADA en src/content/portfolio.ts. Detalle en docs/SHOWCASE-VIDEO.md.

import { chromium } from "playwright-core";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * dominio: el del portal (sin https ni www), que es la llave de la ficha.
 * ocultar: selectores que tapan el sitio en la grabación (ventanas de reseñas,
 *   avisos de cookies, burbujas de chat).
 * entrada: milisegundos que se deja correr la entrada antes de bajar.
 * bajar: cuánto se baja, en altos de pantalla.
 * saltar: segundos que se saltan del arranque (una entrada que no luce).
 * ancho: ancho de pantalla de la grabación (1440 por defecto). Uno menor
 *   agranda lo que se ve en la ficha: sirve para un sitio de una pantalla con
 *   el contenido chico al centro, como JudiMental.
 * minimo: contraste mínimo para que un cuadro cuente como pintado (8). Un
 *   sitio casi todo negro con poco contenido necesita uno más bajo.
 * mp4: el sitio tiene video propio en MP4. El Chrome de grabación no trae
 *   H.264, así que esos videos se pasan a WebM al vuelo, solo para grabar.
 */
const SITIOS = [
  { dominio: "dameunamano.org", url: "https://www.dameunamano.org/" },
  { dominio: "denalibehaviorcrt.com", url: "https://www.denalibehaviorcrt.com/" },
  { dominio: "johanmorenotailor.com", url: "https://www.johanmorenotailor.com/", entrada: 3500, saltar: 0.4 },
  { dominio: "judomarketing.github.io/GeraldMarket", url: "https://judomarketing.github.io/GeraldMarket/" },
  { dominio: "melanieosorio.com", url: "https://www.melanieosorio.com/", saltar: 0.35 },
  { dominio: "pachy-pinchos.vercel.app", url: "https://pachy-pinchos.vercel.app/", ocultar: ".panel-in.fixed" },
  { dominio: "paradiseranch22.com", url: "https://www.paradiseranch22.com/" },
  { dominio: "art-foundation.vercel.app", url: "https://art-foundation.vercel.app/" },
  { dominio: "zanoah.shop", url: "https://zanoah.shop/" },
  { dominio: "thenotes.net", url: "https://thenotes.net/" },
  { dominio: "the-equipment-source.vercel.app", url: "https://the-equipment-source.vercel.app/", mp4: true },
  { dominio: "deliveryrushflorida.com", url: "https://deliveryrushflorida.com/" },
  { dominio: "judimental.com", url: "https://www.judimental.com/", ancho: 960, minimo: 2, entrada: 2500, saltar: 0.6 },
];

// Fuera a propósito (se quedan con su foto): vanventuremia.com y
// milcoloresapp.vercel.app/hoy (son de una pantalla, sin movimiento: el video
// sería la misma foto).

const SALIDA = "public/showcase/video";
const ANCHO = 1440;
const ALTO = 900;
const ENTRADA_MAX = 2.2; // segundos de la entrada animada que se quedan
const BAJADA_MS = 2900;
const QUIETO_MS = 800;
const DURACION = 6.5; // tope del video final
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export const slugDe = (dominio) => dominio.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

function ffmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    return execFileSync("python3", ["-c", "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"]).toString().trim();
  } catch {
    return "ffmpeg";
  }
}

/** Desviación del brillo: una pantalla lisa (blanca, negra, el cargador) da casi cero. */
async function contraste(buffer) {
  const { channels } = await sharp(buffer).resize(144, 90).greyscale().stats();
  return channels[0].stdev;
}

/** Abre el sitio con reintentos: la red a veces corta la primera conexión. */
async function abrir(p, url) {
  for (let intento = 1; ; intento++) {
    try {
      await p.goto(url, { waitUntil: "load", timeout: 60000 });
      return;
    } catch (e) {
      if (intento >= 4) throw e;
      await p.waitForTimeout(2000 * intento);
    }
  }
}

/**
 * Pasa los MP4 del sitio a WebM al vuelo y le dice a la página que sí puede
 * con MP4, para que su video corra en la grabación igual que en un navegador
 * normal. Cada video se convierte una vez y se guarda en `cache`.
 */
async function videosDelSitio(ctx, ff, cache) {
  await ctx.addInitScript(() => {
    const original = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function (tipo) {
      return /mp4/i.test(tipo) ? "probably" : original.call(this, tipo);
    };
  });
  await ctx.route(/\.mp4(\?|$)/i, async (ruta) => {
    const url = ruta.request().url();
    if (!cache.has(url)) {
      const res = await ruta.fetch({ headers: { ...ruta.request().headers(), range: "bytes=0-" } });
      const dir = mkdtempSync(join(tmpdir(), "showcase-mp4-"));
      writeFileSync(join(dir, "o.mp4"), await res.body());
      execFileSync(ff, ["-y", "-loglevel", "error", "-i", join(dir, "o.mp4"), "-an", "-c:v", "libvpx-vp9",
        "-b:v", "0", "-crf", "34", "-deadline", "realtime", "-cpu-used", "8", join(dir, "v.webm")]);
      cache.set(url, readFileSync(join(dir, "v.webm")));
      rmSync(dir, { recursive: true, force: true });
    }
    await ruta.fulfill({ status: 200, contentType: "video/webm", body: cache.get(url) });
  });
}

async function grabar(navegador, sitio, ff) {
  const ancho = sitio.ancho ?? ANCHO;
  const alto = Math.round((ancho * ALTO) / ANCHO);
  const ctx = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    ignoreHTTPSErrors: true,
    locale: "es-US",
  });
  if (sitio.ocultar) {
    const css = `${sitio.ocultar}{display:none!important}`;
    await ctx.addInitScript((css) => {
      const poner = () => {
        const s = document.createElement("style");
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
      };
      if (document.documentElement) poner();
      else document.addEventListener("DOMContentLoaded", poner);
    }, css);
  }
  if (sitio.mp4) await videosDelSitio(ctx, ff, new Map());
  const p = await ctx.newPage();
  // Primera visita para calentar la caché: la grabada carga como la de alguien
  // que ya abrió el sitio, sin esperas de red que no son del diseño.
  await abrir(p, sitio.url);
  await p.waitForTimeout(2500);
  await p.goto("about:blank");

  const cdp = await ctx.newCDPSession(p);
  const cuadros = [];
  cdp.on("Page.screencastFrame", async (f) => {
    cuadros.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: ancho, maxHeight: alto });
  await p.goto(sitio.url, { waitUntil: "commit", timeout: 60000 });
  // Hay sitios que nunca terminan de cargar (un rastreador colgado): a los
  // 12 segundos se sigue igual, el diseño ya está pintado.
  await p.waitForLoadState("load", { timeout: 12000 }).catch(() => {});
  await p.waitForTimeout(sitio.entrada ?? 1500);
  // La hora del screencast es la del sistema, en segundos.
  const inicioBajada = Date.now() / 1000;
  // Bajada suave hecha a mano: igual en todos los sitios, con o sin scroll
  // suave propio, y lo bastante lenta para que se lean los títulos.
  await p.evaluate(
    ({ ms, altos }) =>
      new Promise((listo) => {
        const meta = Math.min(window.innerHeight * altos, document.documentElement.scrollHeight - window.innerHeight);
        // Con scroll-behavior: smooth cada paso arranca su propia animación y
        // la página casi no se mueve: aquí manda la bajada nuestra.
        document.documentElement.style.scrollBehavior = "auto";
        document.body.style.scrollBehavior = "auto";
        const t0 = performance.now();
        const paso = (ahora) => {
          const x = Math.min((ahora - t0) / ms, 1);
          const suave = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
          window.scrollTo({ top: meta * suave, behavior: "instant" });
          if (x < 1) requestAnimationFrame(paso);
          else listo();
        };
        requestAnimationFrame(paso);
      }),
    { ms: BAJADA_MS, altos: sitio.bajar ?? 1.1 }
  );
  const finBajada = Date.now() / 1000;
  await p.waitForTimeout(QUIETO_MS);
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  return { cuadros, inicioBajada, finBajada };
}

/**
 * Los cuadros de un tramo [t0, t1) con la duración que de verdad estuvieron
 * en pantalla. El que ya estaba al empezar el tramo cuenta desde t0.
 */
function tramo(cuadros, t0, t1) {
  let i = 0;
  while (i + 1 < cuadros.length && cuadros[i + 1].t <= t0) i++;
  const salida = [];
  for (; i < cuadros.length && cuadros[i].t < t1; i++) {
    const inicio = Math.max(cuadros[i].t, t0);
    const fin = Math.min(cuadros[i + 1]?.t ?? t1, t1);
    if (fin > inicio) salida.push({ data: cuadros[i].data, dur: fin - inicio });
  }
  return salida;
}

async function procesar(sitio, { cuadros, inicioBajada, finBajada }, ff) {
  const slug = slugDe(sitio.dominio);
  // El primer cuadro bueno: con contraste, y que se sostenga al menos 0.3 s
  // (así se salta la pantalla en blanco, el destello sin estilos y el
  // cargador del sitio). `saltar` corre ese arranque a mano si hace falta.
  const notas = new Map();
  const nota = async (i) => {
    if (!notas.has(i)) notas.set(i, await contraste(cuadros[i].data));
    return notas.get(i);
  };
  const minimo = sitio.minimo ?? 8;
  let desde = -1;
  for (let i = 0; i < cuadros.length && desde < 0; i++) {
    if ((await nota(i)) < minimo) continue;
    let ok = true;
    for (let j = i; ok && j < cuadros.length && cuadros[j].t - cuadros[i].t < 0.3; j++) {
      if ((await nota(j)) < minimo) ok = false;
    }
    if (ok) desde = i;
  }
  if (desde < 0) throw new Error("no hubo un cuadro con contenido");
  const arranque = cuadros[desde].t + (sitio.saltar ?? 0);

  // Dos tramos: la entrada (hasta ENTRADA_MAX segundos) y la bajada completa.
  // Lo del medio es el hero quieto esperando, así que el corte no se nota.
  const finEntrada = Math.min(arranque + ENTRADA_MAX, inicioBajada - 0.3);
  const usados = [
    ...tramo(cuadros, arranque, finEntrada),
    ...tramo(cuadros, Math.max(finEntrada, inicioBajada - 0.3), finBajada + QUIETO_MS / 1000 - 0.2),
  ];

  const tmp = mkdtempSync(join(tmpdir(), `showcase-${slug}-`));
  try {
    const lineas = [];
    usados.forEach((c, i) => {
      const nombre = `f${String(i).padStart(4, "0")}.jpg`;
      writeFileSync(join(tmp, nombre), c.data);
      lineas.push(`file '${nombre}'`, `duration ${c.dur.toFixed(4)}`);
    });
    lineas.push(`file 'f${String(usados.length - 1).padStart(4, "0")}.jpg'`);
    writeFileSync(join(tmp, "lista.txt"), lineas.join("\n") + "\n");

    mkdirSync(SALIDA, { recursive: true });
    const mp4 = join(SALIDA, `${slug}.mp4`);
    execFileSync(ff, [
      "-y", "-loglevel", "error",
      "-f", "concat", "-safe", "0", "-i", join(tmp, "lista.txt"),
      "-t", String(DURACION),
      "-vf", "fps=30,scale=800:500:flags=lanczos,format=yuv420p",
      "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "26",
      "-movflags", "+faststart", "-an", mp4,
    ]);

    // Póster: el hero ya quieto, justo antes de empezar a bajar.
    let poster = cuadros[desde];
    for (const c of cuadros) if (c.t <= inicioBajada) poster = c;
    await sharp(poster.data).resize(800, 500).jpeg({ quality: 80, mozjpeg: true }).toFile(join(SALIDA, `${slug}.jpg`));

    const segundos = usados.reduce((suma, c) => suma + c.dur, 0);
    console.log(`${sitio.dominio}: listo (${segundos.toFixed(1)} s, la página tardó ${(inicioBajada - arranque).toFixed(1)} s en quedar lista)`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const solo = process.argv.slice(2);
const ff = ffmpeg();
const navegador = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
  args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--ignore-certificate-errors"],
});
for (const sitio of SITIOS) {
  if (solo.length && !solo.includes(sitio.dominio)) continue;
  // Si la red corta a media grabación, se repite el sitio entero.
  for (let intento = 1; intento <= 3; intento++) {
    try {
      await procesar(sitio, await grabar(navegador, sitio, ff), ff);
      break;
    } catch (e) {
      if (intento === 3) console.log(`${sitio.dominio}: ERROR ${String(e.message).split("\n")[0]}`);
    }
  }
}
await navegador.close();
