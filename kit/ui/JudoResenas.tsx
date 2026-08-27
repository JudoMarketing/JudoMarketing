/**
 * Judo Site Kit · Prueba social.
 *
 * Cuarto bloque del esqueleto (docs/CEREBRO.md §3.4): reseñas con nombre y
 * lugar, sin filtro. Solo se afirma lo que se puede probar (§2.6), asi que
 * aqui van reseñas reales, copiadas de donde el cliente las tenga (Google,
 * Instagram, correo con permiso). Una reseña inventada que un visitante
 * pilla tumba la credibilidad del sitio entero.
 */

import type { Idioma, Texto } from "./texto";
import { t } from "./texto";

export type Resena = {
  /** El texto tal cual lo escribio la persona, sin arreglar. */
  texto: Texto | string;
  /** Nombre real. */
  nombre: string;
  /** Ciudad, barrio o "cliente desde 2019". */
  lugar?: string;
  /** 1 a 5. Se omite si la plataforma de origen no da estrellas. */
  estrellas?: number;
  /** De donde salio: "Google", "Instagram". Da verificabilidad. */
  fuente?: string;
};

export type JudoResenasProps = {
  idioma?: Idioma;
  /** El H2 vende: "Lo que dicen los que ya comieron", no "Testimonios". */
  titulo: Texto;
  resenas: Resena[];
  /** Enlace al perfil publico donde estan todas. Es lo que las hace verificables. */
  verTodas?: { texto: Texto; href: string };
};

export default function JudoResenas({ idioma = "es", titulo, resenas, verTodas }: JudoResenasProps) {
  return (
    <section className="jk-resenas">
      <style>{CSS}</style>
      <h2 className="jk-resenas-titulo">{t(titulo, idioma)}</h2>

      <ul className="jk-resenas-lista">
        {resenas.map((r, i) => (
          <li key={i} className="jk-resena">
            {typeof r.estrellas === "number" && (
              <p
                className="jk-estrellas"
                aria-label={
                  idioma === "es"
                    ? `${r.estrellas} de 5 estrellas`
                    : `${r.estrellas} out of 5 stars`
                }
              >
                <span aria-hidden="true">{"★".repeat(Math.round(r.estrellas))}</span>
              </p>
            )}
            <blockquote className="jk-resena-texto">{t(r.texto, idioma)}</blockquote>
            <p className="jk-resena-firma">
              <strong>{r.nombre}</strong>
              {r.lugar && <span className="jk-resena-lugar"> · {r.lugar}</span>}
              {r.fuente && <span className="jk-resena-lugar"> · {r.fuente}</span>}
            </p>
          </li>
        ))}
      </ul>

      {verTodas && (
        <a className="jk-resenas-todas" href={verTodas.href} target="_blank" rel="noopener">
          {t(verTodas.texto, idioma)}
        </a>
      )}
    </section>
  );
}

const CSS = `
.jk-resenas {
  padding: clamp(3rem, 7vw, 5rem) clamp(1.25rem, 5vw, 4rem);
  background: var(--fondo, #141320);
  color: var(--texto, #f5f5f7);
}
.jk-resenas-titulo {
  margin: 0 0 2.5rem;
  max-width: 24ch;
  font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  line-height: 1.15;
}
.jk-resenas-lista {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (min-width: 760px) {
  .jk-resenas-lista { grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); }
}
.jk-resena {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--fondo-alto, #1b1928);
  border: 1px solid var(--borde, rgba(168,85,247,.22));
}
.jk-estrellas { margin: 0; color: var(--marca-luz, #a855f7); letter-spacing: .1em; }
.jk-resena-texto {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}
.jk-resena-firma { margin: 0; font-size: .9rem; }
.jk-resena-lugar { color: var(--tenue, rgba(245,245,247,.62)); font-weight: 400; }
.jk-resenas-todas {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 1.75rem;
  font-weight: 600;
  color: var(--marca-luz, #a855f7);
}
.jk-resenas-todas:focus-visible {
  outline: 2px solid var(--marca-luz, #a855f7);
  outline-offset: 3px;
}
`;
