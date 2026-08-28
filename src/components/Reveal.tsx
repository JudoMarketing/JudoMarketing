"use client";

import { useEffect, useRef } from "react";

/**
 * Aparece suavemente al entrar en pantalla (scroll reveal).
 *
 * El retraso se pide en PASOS del compás, no en milisegundos: `paso={i}` para
 * escalonar una fila. Cada paso vale un --tiempo (un dieciseisavo del pulso),
 * así que las entradas caen sobre el mismo latido que el resto del
 * movimiento. Antes cada pantalla inventaba su escalonado —80, 100, 110,
 * 120ms— y ninguno se llevaba con otro.
 */
export default function Reveal({
  children,
  paso = 0,
  className = "",
}: {
  children: React.ReactNode;
  paso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `calc(var(--tiempo) * ${paso})` }}
    >
      {children}
    </div>
  );
}
