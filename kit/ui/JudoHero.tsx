/**
 * Judo Site Kit · El hero, armado como manda el cerebro de diseño.
 *
 * Orden fijo (docs/CEREBRO.md §3.1): kicker → titular promesa → una línea de
 * apoyo → CTA fuerte + CTA discreto → ancla de confianza. Una sola palabra
 * del titular lleva el color de la marca (§1); el resto, no.
 *
 * Autocontenido: sin Tailwind, sin next-intl, sin imágenes propias. Los
 * colores salen de las variables de `kit/ui/tema.ts`, así que el hero se ve
 * del CLIENTE. Se copia tal cual al proyecto y se le pasan los textos.
 */

import type { Idioma, Texto } from "./texto";
import { t } from "./texto";

export type Cta = {
  texto: Texto;
  href: string;
};

export type JudoHeroProps = {
  idioma?: Idioma;
  /** Lugar + prueba + velocidad. "MIAMI, FLORIDA · DESDE 2008 · CONTESTAMOS RAPIDO" */
  kicker?: Texto;
  /** La promesa, dicha por una persona y con punto final. Nunca el nombre del negocio. */
  titular: Texto;
  /** La palabra del titular que lleva el color. Una, no dos. */
  palabraAcento?: Texto;
  /** Una linea de apoyo. Una. */
  apoyo?: Texto;
  /** El boton protagonista: dice la accion del negocio, no "Enviar". */
  ctaFuerte: Cta;
  /** El segundo camino, en discreto: ver el menu, ver precios, WhatsApp. */
  ctaDiscreto?: Cta;
  /** El ancla de confianza del rubro: rating, acreditacion, año de origen, seguidores. Real. */
  ancla?: Texto;
  /** Foto real del negocio. Nada de banco de imagenes (§2.4). */
  imagen?: { src: string; alt: Texto };
  /** `true` cuando el hero es lo primero de la pagina: marca la imagen como prioritaria. */
  primero?: boolean;
};

/** Parte el titular en tres para pintar la palabra de acento sin romper el texto. */
function conAcento(titular: string, palabra?: string) {
  if (!palabra) return [titular, "", ""] as const;
  const i = titular.toLowerCase().indexOf(palabra.toLowerCase());
  if (i < 0) return [titular, "", ""] as const;
  return [titular.slice(0, i), titular.slice(i, i + palabra.length), titular.slice(i + palabra.length)] as const;
}

export default function JudoHero({
  idioma = "es",
  kicker,
  titular,
  palabraAcento,
  apoyo,
  ctaFuerte,
  ctaDiscreto,
  ancla,
  imagen,
  primero = true,
}: JudoHeroProps) {
  const [antes, acento, despues] = conAcento(
    t(titular, idioma),
    palabraAcento ? t(palabraAcento, idioma) : undefined
  );

  return (
    <section className="jk-hero">
      <style>{CSS}</style>

      <div className="jk-hero-texto">
        {kicker && <p className="jk-kicker">{t(kicker, idioma)}</p>}

        <h1 className="jk-titular">
          {antes}
          {acento && <span className="jk-acento">{acento}</span>}
          {despues}
        </h1>

        {apoyo && <p className="jk-apoyo">{t(apoyo, idioma)}</p>}

        <div className="jk-ctas">
          <a className="jk-cta-fuerte" href={ctaFuerte.href}>
            {t(ctaFuerte.texto, idioma)}
          </a>
          {ctaDiscreto && (
            <a className="jk-cta-discreto" href={ctaDiscreto.href}>
              {t(ctaDiscreto.texto, idioma)}
            </a>
          )}
        </div>

        {ancla && <p className="jk-ancla">{t(ancla, idioma)}</p>}
      </div>

      {imagen && (
        <div className="jk-hero-foto">
          {/* Etiqueta normal a proposito: el kit no obliga a usar next/image.
              En un proyecto Next, cambiarla por <Image sizes="(max-width: 900px) 100vw, 50vw"
              priority={primero} /> y borrar este comentario. */}
          <img
            src={imagen.src}
            alt={t(imagen.alt, idioma)}
            loading={primero ? "eager" : "lazy"}
            fetchPriority={primero ? "high" : "auto"}
            decoding="async"
          />
        </div>
      )}
    </section>
  );
}

const CSS = `
.jk-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
  padding: clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 4rem);
  background: var(--fondo, #141320);
  color: var(--texto, #f5f5f7);
}
@media (min-width: 900px) {
  .jk-hero { grid-template-columns: 1.05fr 1fr; gap: 3.5rem; }
}
.jk-hero-texto { max-width: 42rem; }
.jk-kicker {
  margin: 0 0 1rem;
  font-size: .74rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--marca-luz, #a855f7);
}
.jk-titular {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 4.2rem);
  line-height: 1.05;
  letter-spacing: -.02em;
  font-weight: 700;
}
.jk-acento { color: var(--marca-luz, #a855f7); }
.jk-apoyo {
  margin: 1.1rem 0 0;
  max-width: 42ch;
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  line-height: 1.6;
  color: var(--tenue, rgba(245,245,247,.62));
}
.jk-ctas { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 2rem; }
.jk-cta-fuerte, .jk-cta-discreto {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.jk-cta-fuerte {
  background: var(--marca, #7b2dff);
  color: var(--sobre-marca, #fff);
  box-shadow: 0 14px 34px -14px var(--sombra, rgba(123,45,255,.5));
}
.jk-cta-fuerte:hover {
  background: var(--marca-honda, #6423d1);
  transform: translateY(-1px);
  box-shadow: 0 20px 44px -14px var(--sombra, rgba(123,45,255,.6));
}
.jk-cta-discreto {
  color: var(--texto, #f5f5f7);
  border: 1px solid var(--borde, rgba(168,85,247,.22));
}
.jk-cta-discreto:hover { border-color: var(--marca, #7b2dff); }
.jk-cta-fuerte:focus-visible, .jk-cta-discreto:focus-visible {
  outline: 2px solid var(--marca-luz, #a855f7);
  outline-offset: 3px;
}
.jk-ancla {
  margin: 1.5rem 0 0;
  font-size: .9rem;
  color: var(--tenue, rgba(245,245,247,.62));
}
.jk-hero-foto img {
  width: 100%;
  height: auto;
  border-radius: 1.25rem;
  border: 1px solid var(--borde, rgba(168,85,247,.22));
  box-shadow: 0 30px 70px -30px var(--sombra, rgba(123,45,255,.45));
}
@media (prefers-reduced-motion: reduce) {
  .jk-cta-fuerte, .jk-cta-discreto { transition: none; }
  .jk-cta-fuerte:hover { transform: none; }
}
`;
