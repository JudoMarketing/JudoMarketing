/**
 * Judo Site Kit · "Como funciona": tres o cuatro pasos numerados.
 *
 * Segundo bloque del esqueleto de home (docs/CEREBRO.md §3.2) y aplicacion
 * directa de la regla de tres (§1): tres pasos, una linea cada uno. Si un
 * paso necesita un parrafo, el paso esta mal partido.
 */

import type { Idioma, Texto } from "./texto";
import { t } from "./texto";

export type Paso = {
  titulo: Texto;
  /** Una linea. Una. */
  detalle?: Texto;
};

export type JudoPasosProps = {
  idioma?: Idioma;
  /** El H2 vende, no etiqueta: "Pides y comes en 20 minutos", no "Proceso". */
  titulo: Texto;
  pasos: Paso[];
};

export default function JudoPasos({ idioma = "es", titulo, pasos }: JudoPasosProps) {
  return (
    <section className="jk-pasos">
      <style>{CSS}</style>
      <h2 className="jk-pasos-titulo">{t(titulo, idioma)}</h2>
      <ol className="jk-pasos-lista">
        {pasos.slice(0, 4).map((paso, i) => (
          <li key={i} className="jk-paso">
            <span className="jk-paso-numero" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="jk-paso-titulo">{t(paso.titulo, idioma)}</h3>
            {paso.detalle && <p className="jk-paso-detalle">{t(paso.detalle, idioma)}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

const CSS = `
.jk-pasos {
  padding: clamp(3rem, 7vw, 5rem) clamp(1.25rem, 5vw, 4rem);
  background: var(--fondo, #141320);
  color: var(--texto, #f5f5f7);
}
.jk-pasos-titulo {
  margin: 0 0 2.5rem;
  max-width: 24ch;
  font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  line-height: 1.15;
  letter-spacing: -.01em;
}
.jk-pasos-lista {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: jk;
}
@media (min-width: 760px) {
  .jk-pasos-lista { grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
}
.jk-paso {
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--fondo-alto, #1b1928);
  border: 1px solid var(--borde, rgba(168,85,247,.22));
}
.jk-paso-numero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-size: .85rem;
  font-weight: 800;
  color: var(--sobre-marca, #fff);
  background: var(--marca, #7b2dff);
}
.jk-paso-titulo {
  margin: .9rem 0 0;
  font-size: 1.05rem;
  line-height: 1.3;
}
.jk-paso-detalle {
  margin: .5rem 0 0;
  font-size: .95rem;
  line-height: 1.55;
  color: var(--tenue, rgba(245,245,247,.62));
}
`;
