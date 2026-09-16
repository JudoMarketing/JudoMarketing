"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Líneas de luz moradas/azul-moradizas que entran por los márgenes de la
 * pantalla, se entrelazan y se desvanecen suavemente justo antes de que
 * nazcan otras formando patrones distintos. (Prompt original del home.)
 */

const COLORS = ["#7b2dff", "#a855f7", "#6d5bff", "#4f6bff", "#8f6dff", "#c084fc"];

/**
 * El compás, el mismo que el CSS (--pulso en globals.css).
 *
 * Antes cada línea nacía cuando le tocaba y viajaba a una velocidad al azar:
 * el conjunto se leía como estática. Ahora una línea nace en cada tiempo y
 * tarda un número entero de pulsos en cruzar, así que llegan y se van a
 * compás. Sigue sin repetirse el patrón —el recorrido y el color son
 * distintos cada vez— pero se percibe un latido debajo.
 */
const PULSO_MS = 2400;
/** Pulsos que tarda una línea en cruzar la pantalla: 4, 6 u 8. */
const CRUCES = [4, 6, 8];
/** Cuadros por segundo del bucle, para pasar de pulsos a velocidad. */
const CUADROS = 60;
/** Recorrido total de `head`, de nacer a desvanecerse del todo. */
const RECORRIDO = 1.3;

type P = { x: number; y: number };

type LightLine = {
  p0: P;
  p1: P;
  p2: P;
  p3: P;
  head: number; // progreso 0..1+ de la punta
  trail: number; // largo del segmento visible (en t)
  speed: number;
  color: string;
  width: number;
};

function bezier(l: LightLine, t: number): P {
  const u = 1 - t;
  return {
    x:
      u * u * u * l.p0.x +
      3 * u * u * t * l.p1.x +
      3 * u * t * t * l.p2.x +
      t * t * t * l.p3.x,
    y:
      u * u * u * l.p0.y +
      3 * u * u * t * l.p1.y +
      3 * u * t * t * l.p2.y +
      t * t * t * l.p3.y,
  };
}

function edgePoint(w: number, h: number, edge: number): P {
  switch (edge) {
    case 0:
      return { x: Math.random() * w, y: -40 };
    case 1:
      return { x: w + 40, y: Math.random() * h };
    case 2:
      return { x: Math.random() * w, y: h + 40 };
    default:
      return { x: -40, y: Math.random() * h };
  }
}

function makeLine(w: number, h: number): LightLine {
  const startEdge = Math.floor(Math.random() * 4);
  // Salir por un borde distinto para cruzar la pantalla
  const endEdge = (startEdge + 1 + Math.floor(Math.random() * 3)) % 4;
  const mid = () => ({
    x: w * (0.15 + Math.random() * 0.7),
    y: h * (0.15 + Math.random() * 0.7),
  });
  return {
    p0: edgePoint(w, h, startEdge),
    p3: edgePoint(w, h, endEdge),
    p1: mid(),
    p2: mid(),
    head: 0,
    trail: 0.28 + Math.random() * 0.25,
    // Velocidad reducida 30% (pedido del dueño: movimiento más calmado)
    // Cruzar en un número entero de pulsos, no en un tiempo cualquiera:
    // recorrido dividido entre los cuadros que caben en esos pulsos.
    speed:
      RECORRIDO /
      ((CRUCES[Math.floor(Math.random() * CRUCES.length)] * PULSO_MS * CUADROS) /
        1000),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: 1.4 + Math.random() * 1.8,
  };
}

/**
 * Pantallas de trabajo, sin líneas. Ahí se pasa un buen rato leyendo números
 * y tarjetas, y algo moviéndose de fondo termina molestando. Mismo criterio
 * que la mascota (ver Mascot.tsx).
 */
const PANTALLAS_QUIETAS = ["/admin"];

export default function LightLines() {
  const pathname = usePathname();
  const quieta = PANTALLAS_QUIETAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (quieta) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let lines: LightLine[] = [];
    let raf = 0;
    let running = true;
    /** Cuándo cayó el último tiempo del compás. */
    let ultimoTiempo = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = () => (w < 768 ? 6 : 12);
    while (lines.length < count()) {
      const l = makeLine(w, h);
      l.head = Math.random(); // arranque desincronizado
      lines.push(l);
    }

    const drawLine = (l: LightLine) => {
      const t1 = Math.min(l.head, 1);
      const t0 = Math.max(l.head - l.trail, 0);
      if (t1 <= t0) return;

      // Fade-in al nacer, fade-out cuando la cola se acerca al final
      const born = Math.min(l.head / 0.15, 1);
      const dying = l.head > 1 ? Math.max(1 - (l.head - 1) / 0.3, 0) : 1;
      const alpha = 0.9 * born * dying;
      if (alpha <= 0.01) return;

      ctx.beginPath();
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const p = bezier(l, t0 + ((t1 - t0) * i) / steps);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = l.width;
      ctx.lineCap = "round";
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Punta brillante
      if (l.head <= 1) {
        const tip = bezier(l, t1);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, l.width * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = alpha * 0.9;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const l of lines) {
        l.head += l.speed * (reduced ? 0 : 1);
        drawLine(l);
      }
      // Las que se desvanecieron esperan al siguiente tiempo para renacer:
      // es lo que hace que las entradas caigan juntas en vez de gotear.
      const ahora = performance.now();
      const enTiempo = ahora - ultimoTiempo >= PULSO_MS / 4;
      if (enTiempo) ultimoTiempo = ahora;
      lines = lines.map((l) =>
        l.head - l.trail > 1.3 && enTiempo ? makeLine(w, h) : l
      );
      if (enTiempo) {
        while (lines.length < count()) lines.push(makeLine(w, h));
      }
      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      // Sin animación: un patrón estático muy sutil
      lines.forEach((l) => {
        l.head = 0.7;
        drawLine(l);
      });
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running && !reduced) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      resize();
      lines = [];
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
    // quieta cambia al navegar entre el sitio y el portal: el lienzo arranca
    // o se apaga según a dónde se llegue
  }, [quieta]);

  if (quieta) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
