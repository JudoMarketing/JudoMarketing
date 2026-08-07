/**
 * Judo Site Kit: el pie de página de los sitios de cliente.
 *
 * Hace tres trabajos a la vez:
 *  1. El pie normal del negocio (marca, dirección, contacto, enlaces).
 *  2. "Website por Judo Marketing" con enlace real (seguido, sin nofollow):
 *     cada sitio que construimos devuelve una señal a judomarketing.net.
 *  3. Los otros sitios del mismo dueño, cuando los hay.
 *
 * Autocontenido a propósito: nada de Tailwind, next-intl ni imágenes. Solo
 * React y estilos propios, para poder copiarlo tal cual a cualquier proyecto
 * Next.js sin arrastrar dependencias. Los colores se ajustan con `tema`, así
 * que el pie se ve del CLIENTE y no de Judo.
 */

import type { SitioDeLaRed } from "../lib/judo-red";

export type TemaFooter = {
  fondo: string;
  texto: string;
  /** Texto secundario: direcciones, teléfono, copyright */
  tenue: string;
  /** Color de los enlaces al pasar el cursor */
  acento: string;
  borde: string;
};

const TEMA_OSCURO: TemaFooter = {
  fondo: "#11111a",
  texto: "#f5f5f7",
  tenue: "rgba(245,245,247,0.6)",
  acento: "#a855f7",
  borde: "rgba(168,85,247,0.15)",
};

export type EnlaceFooter = {
  texto: { es: string; en: string };
  href: string;
};

export type JudoFooterProps = {
  negocio: {
    nombre: string;
    /** Frase corta bajo el nombre */
    tagline?: { es: string; en: string };
    direccion?: string;
    telefono?: string;
    email?: string;
    /** Usuario sin arroba, o la URL completa */
    instagram?: string;
    whatsapp?: string;
  };
  /** Enlaces internos del sitio: menú, política, contacto… */
  enlaces?: EnlaceFooter[];
  /** Otros sitios del MISMO dueño. Ver kit/lib/judo-red.ts */
  red?: SitioDeLaRed[];
  idioma?: "es" | "en";
  tema?: Partial<TemaFooter>;
};

const TEXTOS = {
  contacto: { es: "Contacto", en: "Contact" },
  enlaces: { es: "Enlaces", en: "Links" },
  red: { es: "También del mismo dueño", en: "Also by the same owner" },
  derechos: { es: "Todos los derechos reservados.", en: "All rights reserved." },
  por: { es: "Website por", en: "Website by" },
  judoQue: {
    es: "Judo Marketing: páginas web y apps para negocios en Miami",
    en: "Judo Marketing: websites and apps for small businesses in Miami",
  },
};

/** Deja el usuario de Instagram en @usuario y su URL, venga como venga. */
function instagramDe(valor: string): { url: string; visible: string } {
  const usuario = valor
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return { url: `https://www.instagram.com/${usuario}`, visible: `@${usuario}` };
}

/** El teléfono tal cual para tel:, sin espacios ni paréntesis. */
function marcable(telefono: string): string {
  return telefono.replace(/[^\d+]/g, "");
}

export default function JudoFooter({
  negocio,
  enlaces = [],
  red = [],
  idioma = "es",
  tema,
}: JudoFooterProps) {
  const t = { ...TEMA_OSCURO, ...tema };
  const año = new Date().getFullYear();
  const ig = negocio.instagram ? instagramDe(negocio.instagram) : null;

  // Los colores viajan como variables CSS para que las reglas de hover del
  // <style> de abajo puedan usarlos sin repetir nada.
  const variables = {
    "--jf-fondo": t.fondo,
    "--jf-texto": t.texto,
    "--jf-tenue": t.tenue,
    "--jf-acento": t.acento,
    "--jf-borde": t.borde,
  } as React.CSSProperties;

  return (
    <footer className="jf" style={variables}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="jf-in">
        <div className="jf-cols">
          <div className="jf-col">
            <p className="jf-marca">{negocio.nombre}</p>
            {negocio.tagline && (
              <p className="jf-tag">{negocio.tagline[idioma]}</p>
            )}
            {negocio.direccion && (
              <p className="jf-dato">{negocio.direccion}</p>
            )}
          </div>

          {(negocio.telefono || negocio.email || ig || negocio.whatsapp) && (
            <div className="jf-col">
              <p className="jf-tit">{TEXTOS.contacto[idioma]}</p>
              {negocio.telefono && (
                <p className="jf-dato">
                  <a className="jf-a" href={`tel:${marcable(negocio.telefono)}`}>
                    {negocio.telefono}
                  </a>
                </p>
              )}
              {negocio.whatsapp && (
                <p className="jf-dato">
                  <a
                    className="jf-a"
                    href={`https://wa.me/${marcable(negocio.whatsapp).replace(/^\+/, "")}`}
                    target="_blank"
                    rel="noopener"
                  >
                    WhatsApp
                  </a>
                </p>
              )}
              {negocio.email && (
                <p className="jf-dato">
                  <a className="jf-a" href={`mailto:${negocio.email}`}>
                    {negocio.email}
                  </a>
                </p>
              )}
              {ig && (
                <p className="jf-dato">
                  <a
                    className="jf-a"
                    href={ig.url}
                    target="_blank"
                    rel="noopener"
                  >
                    {ig.visible}
                  </a>
                </p>
              )}
            </div>
          )}

          {enlaces.length > 0 && (
            <div className="jf-col">
              <p className="jf-tit">{TEXTOS.enlaces[idioma]}</p>
              {enlaces.map((enlace) => (
                <p className="jf-dato" key={enlace.href}>
                  <a className="jf-a" href={enlace.href}>
                    {enlace.texto[idioma]}
                  </a>
                </p>
              ))}
            </div>
          )}

          {red.length > 0 && (
            <div className="jf-col">
              <p className="jf-tit">{TEXTOS.red[idioma]}</p>
              {red.map((sitio) => (
                <p className="jf-dato" key={sitio.url}>
                  {/* Enlace seguido y sin noreferrer: queremos que la visita
                      llegue identificada y que el enlace cuente para el SEO. */}
                  <a
                    className="jf-a"
                    href={sitio.url}
                    title={sitio.que[idioma]}
                    target="_blank"
                    rel="noopener"
                  >
                    {sitio.nombre}
                  </a>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="jf-bajo">
          <p className="jf-copy">
            © {año} {negocio.nombre}. {TEXTOS.derechos[idioma]}
          </p>
          <p className="jf-copy">
            {TEXTOS.por[idioma]}{" "}
            <a
              className="jf-a jf-judo"
              href="https://www.judomarketing.net"
              title={TEXTOS.judoQue[idioma]}
              target="_blank"
              rel="noopener"
            >
              Judo Marketing
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

const CSS = `
.jf {
  background: var(--jf-fondo);
  color: var(--jf-texto);
  border-top: 1px solid var(--jf-borde);
  font-size: 14px;
  line-height: 1.6;
}
.jf-in { max-width: 1100px; margin: 0 auto; padding: 44px 24px 28px; }
.jf-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 28px 32px;
}
.jf-col { min-width: 0; }
.jf-marca { margin: 0 0 6px; font-size: 17px; font-weight: 700; }
.jf-tag { margin: 0 0 10px; color: var(--jf-tenue); }
.jf-tit {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--jf-texto);
  opacity: 0.75;
}
.jf-dato { margin: 0 0 6px; color: var(--jf-tenue); overflow-wrap: anywhere; }
.jf-a { color: inherit; text-decoration: none; transition: color 0.2s ease; }
.jf-a:hover, .jf-a:focus-visible { color: var(--jf-acento); }
.jf-bajo {
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid var(--jf-borde);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 20px;
}
.jf-copy { margin: 0; color: var(--jf-tenue); font-size: 13px; }
.jf-judo { font-weight: 600; color: var(--jf-texto); }
@media (max-width: 600px) {
  .jf-in { padding: 34px 20px 24px; }
  .jf-bajo { justify-content: flex-start; }
}
`;
