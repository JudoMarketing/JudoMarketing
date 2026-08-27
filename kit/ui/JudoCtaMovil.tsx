"use client";

/**
 * Judo Site Kit · La barra de accion fija en telefono.
 *
 * En movil el CTA principal tiene que estar alcanzable sin hacer zoom
 * (docs/CEREBRO.md §3) y el pulgar vive abajo. Esta barra aparece solo en
 * pantallas chicas y solo despues de que el visitante paso el hero: mostrarla
 * de entrada tapa la promesa que vino a leer.
 *
 * Dos acciones como maximo, y cada una dice que pasa al tocarla (§2.7).
 */

import { useEffect, useState } from "react";
import type { Idioma, Texto } from "./texto";
import { t } from "./texto";

export type JudoCtaMovilProps = {
  idioma?: Idioma;
  /** La accion del negocio: "Ordenar ahora", "Pedir cita". */
  principal: { texto: Texto; href: string };
  /** Normalmente llamar o WhatsApp. */
  secundaria?: { texto: Texto; href: string };
  /** Pixeles de scroll antes de aparecer. Por defecto, un alto de pantalla. */
  desde?: number;
};

export default function JudoCtaMovil({
  idioma = "es",
  principal,
  secundaria,
  desde,
}: JudoCtaMovilProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const umbral = desde ?? window.innerHeight * 0.9;
    const alScroll = () => setVisible(window.scrollY > umbral);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, [desde]);

  return (
    <div className={`jk-barra ${visible ? "jk-barra-visible" : ""}`} aria-hidden={!visible}>
      <style>{CSS}</style>
      {secundaria && (
        <a className="jk-barra-secundaria" href={secundaria.href} tabIndex={visible ? 0 : -1}>
          {t(secundaria.texto, idioma)}
        </a>
      )}
      <a className="jk-barra-principal" href={principal.href} tabIndex={visible ? 0 : -1}>
        {t(principal.texto, idioma)}
      </a>
    </div>
  );
}

const CSS = `
.jk-barra {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: none;
  gap: .6rem;
  padding: .7rem .9rem calc(.7rem + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--fondo, #141320) 92%, transparent);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--borde, rgba(168,85,247,.22));
  transform: translateY(105%);
  transition: transform .22s ease;
}
@media (max-width: 760px) { .jk-barra { display: flex; } }
.jk-barra-visible { transform: translateY(0); }
.jk-barra a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
}
.jk-barra-principal {
  flex: 1 1 auto;
  color: var(--sobre-marca, #fff);
  background: var(--marca, #7b2dff);
}
.jk-barra-secundaria {
  flex: 0 0 auto;
  padding: 0 1.1rem;
  color: var(--texto, #f5f5f7);
  border: 1px solid var(--borde, rgba(168,85,247,.22));
}
.jk-barra a:focus-visible {
  outline: 2px solid var(--marca-luz, #a855f7);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) { .jk-barra { transition: none; } }
`;
