"use client";

// Cada página nueva empieza arriba, también en el teléfono.
//
// Next ya sube la ventana al cambiar de página, pero en el iPhone fallaba
// por dos lados:
// - Si el foco se quedaba en el enlace del pie o en un campo de la página
//   anterior, el navegador volvía a traerlo a la vista y la página nueva
//   arrancaba abajo. Por eso se suelta el foco.
// - Con `scroll-behavior: smooth` la subida animada se cortaba a medio camino
//   mientras se pintaba la página nueva. Por eso se sube sin animación, y otra
//   vez en el siguiente cuadro, cuando la página ya terminó de pintarse.
//
// No se toca:
// - la primera carga (el navegador ya decide);
// - atrás y adelante (el navegador devuelve a donde ibas);
// - una dirección con #ancla (va a esa sección).

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function VueltaArriba() {
  const pathname = usePathname();
  const primera = useRef(true);
  const historial = useRef(false);

  useEffect(() => {
    const marcar = () => {
      historial.current = true;
    };
    window.addEventListener("popstate", marcar);
    return () => window.removeEventListener("popstate", marcar);
  }, []);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (historial.current) {
      historial.current = false;
      return;
    }
    if (window.location.hash) return;
    const foco = document.activeElement;
    if (foco instanceof HTMLElement && foco !== document.body) foco.blur();
    const subir = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    subir();
    const id = requestAnimationFrame(subir);
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
