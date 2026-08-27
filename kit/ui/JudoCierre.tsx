/**
 * Judo Site Kit · El cierre: el CTA repetido y los datos locales.
 *
 * Quinto bloque del esqueleto (docs/CEREBRO.md §3.5). El visitante que llego
 * hasta abajo ya se convencio; lo unico que falta es que no tenga que buscar
 * como contactar. Direccion, telefono y horario aqui tambien sirven al SEO
 * local: son las mismas tres lineas que el buscador cruza con el perfil de
 * Google del negocio, asi que se escriben IGUAL que alli.
 */

import type { Idioma, Texto } from "./texto";
import { t } from "./texto";

export type JudoCierreProps = {
  idioma?: Idioma;
  /** El H2 del cierre: la misma promesa, dicha corta. */
  titulo: Texto;
  apoyo?: Texto;
  /** El mismo CTA del hero. Repetido a proposito. */
  cta: { texto: Texto; href: string };
  local?: {
    /** Igual que en el perfil de Google, letra por letra. */
    direccion?: string;
    telefono?: string;
    /** "Lun a Sab · 11am - 9pm" */
    horario?: Texto;
    email?: string;
  };
};

/** El telefono tal cual para tel:, sin espacios ni parentesis. */
function marcable(telefono: string): string {
  return telefono.replace(/[^\d+]/g, "");
}

export default function JudoCierre({ idioma = "es", titulo, apoyo, cta, local }: JudoCierreProps) {
  return (
    <section className="jk-cierre">
      <style>{CSS}</style>
      <h2 className="jk-cierre-titulo">{t(titulo, idioma)}</h2>
      {apoyo && <p className="jk-cierre-apoyo">{t(apoyo, idioma)}</p>}

      <a className="jk-cierre-cta" href={cta.href}>
        {t(cta.texto, idioma)}
      </a>

      {local && (
        <address className="jk-cierre-local">
          {local.direccion && <span>{local.direccion}</span>}
          {local.telefono && (
            <a href={`tel:${marcable(local.telefono)}`}>{local.telefono}</a>
          )}
          {local.email && <a href={`mailto:${local.email}`}>{local.email}</a>}
          {local.horario && <span>{t(local.horario, idioma)}</span>}
        </address>
      )}
    </section>
  );
}

const CSS = `
.jk-cierre {
  padding: clamp(3.5rem, 8vw, 6rem) clamp(1.25rem, 5vw, 4rem);
  text-align: center;
  background: var(--fondo-alto, #1b1928);
  color: var(--texto, #f5f5f7);
  border-top: 1px solid var(--borde, rgba(168,85,247,.22));
}
.jk-cierre-titulo {
  margin: 0 auto;
  max-width: 20ch;
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.1;
}
.jk-cierre-apoyo {
  margin: 1rem auto 0;
  max-width: 44ch;
  line-height: 1.6;
  color: var(--tenue, rgba(245,245,247,.62));
}
.jk-cierre-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 2rem;
  padding: 0 1.75rem;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  color: var(--sobre-marca, #fff);
  background: var(--marca, #7b2dff);
  box-shadow: 0 14px 34px -14px var(--sombra, rgba(123,45,255,.5));
}
.jk-cierre-cta:hover { background: var(--marca-honda, #6423d1); }
.jk-cierre-cta:focus-visible {
  outline: 2px solid var(--marca-luz, #a855f7);
  outline-offset: 3px;
}
.jk-cierre-local {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: .5rem 1.5rem;
  margin-top: 2rem;
  font-style: normal;
  font-size: .95rem;
  color: var(--tenue, rgba(245,245,247,.62));
}
.jk-cierre-local a {
  color: inherit;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.jk-cierre-local a:hover { color: var(--marca-luz, #a855f7); }
`;
