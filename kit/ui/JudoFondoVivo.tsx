"use client";

/**
 * Judo Site Kit · Fondo vivo: video o canvas interactivo detras del contenido.
 *
 * Es el nivel "ambiente" del movimiento (docs/CEREBRO.md §7): el que mas
 * impresiona en la primera visita y el que mas cuesta en rendimiento y en
 * bateria. Todas las reglas duras de esa seccion estan aqui resueltas para no
 * volver a discutirlas en cada sitio:
 *
 *  - poster siempre, y el poster es lo unico que se ve mientras el video carga
 *  - muted + loop + playsinline + preload="metadata": el video no es el LCP
 *  - se pausa al salir de pantalla y al ocultarse la pestaña
 *  - en telefono, imagen: datos moviles y bateria
 *  - se apaga solo con prefers-reduced-motion y con saveData
 *  - velo de contraste encima, para que el texto pase 4.5:1 sobre cualquier
 *    fotograma
 *  - el fondo nunca se roba un clic (pointer-events: none)
 *
 * Autocontenido: sin Tailwind ni dependencias. Los colores salen de las
 * variables de `kit/ui/tema.ts`.
 */

import { useEffect, useRef, useState } from "react";

export type Pintor = (
  ctx: CanvasRenderingContext2D,
  estado: {
    ancho: number;
    alto: number;
    /** Milisegundos desde que arranco el fondo */
    t: number;
    /** Puntero en pixeles del canvas, o null si nadie lo ha movido */
    puntero: { x: number; y: number } | null;
  }
) => void;

export type JudoFondoVivoProps = {
  /** Obligatorio: es lo que se ve sin video, sin JS y con movimiento reducido. */
  poster: string;
  /** El video de fondo. WebM primero, MP4 de respaldo. Sin pista de audio. */
  video?: { webm?: string; mp4?: string };
  /** Fondo interactivo pintado a mano. Ver `kit/ui/fondos.ts`. */
  pintar?: Pintor;
  /** Cuanto se oscurece el fondo para que el texto se lea. 0 a 1. */
  velo?: number;
  /** Alto de la seccion. Por defecto, una pantalla con tope. */
  altura?: string;
  /** El contenido de encima: el hero, normalmente. */
  children: React.ReactNode;
};

/** Decide si este visitante debe ver movimiento de ambiente, o no. */
function quiereMovimiento(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // Telefono: poster. Datos moviles y bateria valen mas que el efecto.
  if (window.matchMedia("(max-width: 760px)").matches) return false;
  const con = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (con?.saveData) return false;
  return true;
}

export default function JudoFondoVivo({
  poster,
  video,
  pintar,
  velo = 0.55,
  altura = "min(100svh, 46rem)",
  children,
}: JudoFondoVivoProps) {
  const seccion = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vivo, setVivo] = useState(false);

  // Quien manda: preferencias del visitante, tamaño de pantalla y ahorro de datos.
  useEffect(() => {
    const decidir = () => setVivo(quiereMovimiento());
    decidir();
    const medios = [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(max-width: 760px)"),
    ];
    medios.forEach((m) => m.addEventListener("change", decidir));
    return () => medios.forEach((m) => m.removeEventListener("change", decidir));
  }, []);

  // El video corre solo cuando se ve y cuando la pestaña esta al frente.
  useEffect(() => {
    const el = seccion.current;
    const v = videoRef.current;
    if (!el || !v || !vivo) return;

    let enPantalla = false;
    const ajustar = () => {
      const debeCorrer = enPantalla && document.visibilityState === "visible";
      if (debeCorrer) void v.play().catch(() => {});
      else v.pause();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        enPantalla = e.isIntersecting;
        ajustar();
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    document.addEventListener("visibilitychange", ajustar);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", ajustar);
    };
  }, [vivo]);

  // El canvas: mismo trato que el video, mas el tope de DPR en 2.
  useEffect(() => {
    const el = seccion.current;
    const canvas = canvasRef.current;
    if (!el || !canvas || !pintar || !vivo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Degradacion honesta: queda el poster y el velo.

    let cuadro = 0;
    let enPantalla = false;
    let arranque = 0;
    let puntero: { x: number; y: number } | null = null;

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = el.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };

    const bucle = (ahora: number) => {
      if (!arranque) arranque = ahora;
      pintar(ctx, { ancho: canvas.width, alto: canvas.height, t: ahora - arranque, puntero });
      cuadro = requestAnimationFrame(bucle);
    };

    const ajustar = () => {
      const debeCorrer = enPantalla && document.visibilityState === "visible";
      if (debeCorrer && !cuadro) cuadro = requestAnimationFrame(bucle);
      if (!debeCorrer && cuadro) {
        cancelAnimationFrame(cuadro);
        cuadro = 0;
      }
    };

    const alMover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      puntero = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    };
    const alSalir = () => {
      puntero = null;
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        enPantalla = e.isIntersecting;
        ajustar();
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    document.addEventListener("visibilitychange", ajustar);
    el.addEventListener("pointermove", alMover);
    el.addEventListener("pointerleave", alSalir);

    return () => {
      if (cuadro) cancelAnimationFrame(cuadro);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", ajustar);
      el.removeEventListener("pointermove", alMover);
      el.removeEventListener("pointerleave", alSalir);
    };
  }, [pintar, vivo]);

  return (
    <section ref={seccion} className="jk-fondo" style={{ minHeight: altura }}>
      <style>{CSS}</style>

      <div className="jk-fondo-capa" aria-hidden="true">
        <img className="jk-fondo-poster" src={poster} alt="" decoding="async" />

        {vivo && video && (video.webm || video.mp4) && (
          <video
            ref={videoRef}
            className="jk-fondo-video"
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
          >
            {video.webm && <source src={video.webm} type="video/webm" />}
            {video.mp4 && <source src={video.mp4} type="video/mp4" />}
          </video>
        )}

        {vivo && pintar && <canvas ref={canvasRef} className="jk-fondo-canvas" />}

        <div className="jk-fondo-velo" style={{ opacity: velo }} />
      </div>

      <div className="jk-fondo-contenido">{children}</div>
    </section>
  );
}

const CSS = `
.jk-fondo {
  position: relative;
  display: grid;
  align-items: center;
  isolation: isolate;
  background: var(--fondo, #141320);
  color: var(--texto, #f5f5f7);
}
.jk-fondo-capa {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.jk-fondo-poster,
.jk-fondo-video,
.jk-fondo-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.jk-fondo-velo {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--fondo, #141320) 55%, transparent),
    var(--fondo, #141320)
  );
}
.jk-fondo-contenido { position: relative; z-index: 1; }
`;
