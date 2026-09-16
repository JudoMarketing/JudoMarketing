"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El salto entre los tres portales de la casa.
 *
 * Judo Marketing, Judito Ads y Juditos son tres aplicaciones distintas detrás
 * del mismo dominio. Para quien las usa no lo son: es un sitio con tres
 * partes, y estar en una y no encontrar la puerta a las otras es la forma
 * más rápida de que alguien piense que se le perdió su cuenta.
 *
 * Por eso este botón está en los tres, igual en los tres, y siempre en el
 * mismo sitio. Es el mismo componente copiado en cada repositorio: son
 * proyectos separados, y una copia de cuarenta líneas cuesta menos que un
 * paquete compartido que hay que publicar para cambiarle un color.
 *
 * Los enlaces son direcciones del dominio, no de Next: cada portal tiene su
 * propio prefijo y un <Link> les pegaría el suyo delante.
 */

type Portal = "judomarketing" | "juditoads" | "juditos";

const PORTALES: { id: Portal; nombre: string; que: string; href: string; emoji: string }[] = [
  {
    id: "judomarketing",
    nombre: "Judo Marketing",
    que: "La agencia: webs, marca y todo lo demás",
    href: "/",
    emoji: "🥋",
  },
  {
    id: "juditoads",
    nombre: "Judito Ads",
    que: "Tus anuncios en Meta, sin pelearte con el administrador",
    href: "/juditoads/app",
    emoji: "🚀",
  },
  {
    id: "juditos",
    nombre: "Juditos",
    que: "Asistentes que contestan tus mensajes solos",
    href: "/juditos/mi",
    emoji: "🤖",
  },
];

export default function Lanzador({ aqui }: { aqui: Portal }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Se cierra al pulsar fuera o con Escape. Un panel flotante que se queda
  // abierto tapando la pantalla es peor que no tenerlo.
  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const otros = PORTALES.filter((p) => p.id !== aqui);

  return (
    <div ref={caja} className="fixed bottom-5 right-5 z-50 print:hidden">
      {abierto && (
        <div className="mb-3 w-[19rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-white/12 bg-[#12111d]/95 shadow-2xl shadow-black/50 backdrop-blur">
          <p className="border-b border-white/8 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Ir a
          </p>
          {otros.map((p) => (
            <a
              key={p.id}
              href={p.href}
              className="flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.06]"
            >
              <span aria-hidden className="mt-0.5 text-lg">
                {p.emoji}
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{p.nombre}</span>
                <span className="block text-xs text-white/45">{p.que}</span>
              </span>
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar el salto entre portales" : "Ir a otro portal de Judo Marketing"}
        className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#a855f7] to-[#7b2dff] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7b2dff]/30 transition hover:brightness-110"
      >
        <span aria-hidden className="text-base leading-none">
          {abierto ? "✕" : "🥋"}
        </span>
        <span className="hidden sm:inline">{abierto ? "Cerrar" : "Portales"}</span>
      </button>
    </div>
  );
}
