import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import Icono, { type IconName } from "@/components/Icono";
import ShowDeWebsites from "@/components/ShowDeWebsites";
import ResenasComunidad from "@/components/ResenasComunidad";
import { PERFIL_GOOGLE } from "@/components/SocialLinks";
import ListoOverlay from "@/components/ListoOverlay";
import { DIAS_DIAGNOSTICO, PRECIO_DIAGNOSTICO, precioDesde, usd } from "@/lib/pricing";
import { homeAlternates } from "@/lib/seo";
import type { Metadata } from "next";

/** Se regenera cada hora, para que un cambio de precio o de copia salga solo. */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: homeAlternates(locale) };
}

/*
 * El home de Judo Marketing (Junior, 25 de noviembre de 2026).
 *
 * Judo se centra en websites y en hacer crecer negocios en internet con
 * estrategias rápidas y asesoría. JuditoADS y Juditos son negocios aparte que
 * Judo administra: viven solo en el header, nunca en el cuerpo de esta página.
 *
 * El esqueleto es el de docs/CEREBRO.md, sección 4: hero (kicker, promesa,
 * una línea, una acción fuerte y una discreta, ancla de confianza) → cómo
 * funciona → la oferta → prueba social → cierre con los datos locales. La
 * prueba de lo que hacemos son los websites de nuestros clientes, en línea:
 * van arriba y grandes (kit/cerebro/METODO.md, sección 5). Iconos propios
 * (components/Icono.tsx), nunca emoji. Espacios de una sola serie (4, 8, 12,
 * 16, 24, 32, 48, 64, 96).
 */

/** Lo que hace Judo: tres, en el orden en que el cliente lo necesita. */
const SERVICIOS: readonly { id: string; clase: string; icono: IconName; href: "/services" | "/contact" | "/diagnostic"; hash?: string }[] = [
  { id: "websites", clase: "svc-websites", icono: "navegador", href: "/services", hash: "websites" },
  { id: "growth", clase: "svc-ads", icono: "crecer", href: "/contact" },
  { id: "advice", clase: "svc-ai", icono: "brujula", href: "/diagnostic" },
];

type Step = { title: string; description: string };
type Review = { text: string; name: string; place: string };

/** La acción discreta: un enlace, no un segundo botón (una acción por pantalla). */
const DISCRETO =
  "inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-judo-fog/75 underline decoration-judo-lilac/40 underline-offset-4 transition hover:text-judo-fog hover:decoration-judo-lilac";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();

  const steps = t.raw("onboarding.steps") as Step[];
  const reviews = t.raw("reviews.items") as Review[];
  const diagnostico = t("home.ctaDiagnostic", { price: usd(PRECIO_DIAGNOSTICO) });

  return (
    <div className="judo-glow overflow-hidden">
      {/* Cierre para quien acaba de pagar y confirmar sus datos */}
      <Suspense fallback={null}>
        <ListoOverlay />
      </Suspense>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 sm:pt-24">
        {/* Trazo de fondo, solo en pantallas grandes */}
        <svg
          aria-hidden
          className="float-slow pointer-events-none absolute left-0 top-16 hidden opacity-40 lg:block"
          width="120"
          height="132"
          viewBox="0 0 100 110"
        >
          <g className="spin-slow" style={{ transformOrigin: "50px 55px" }}>
            <polygon points="50,5 95,30 95,80 50,105 5,80 5,30" fill="none" stroke="#a855f7" strokeWidth="1.2" />
            <line x1="50" y1="5" x2="50" y2="105" stroke="#a855f7" strokeWidth="0.7" />
            <line x1="5" y1="30" x2="95" y2="80" stroke="#a855f7" strokeWidth="0.7" />
            <line x1="95" y1="30" x2="5" y2="80" stroke="#a855f7" strokeWidth="0.7" />
          </g>
        </svg>
        <div
          aria-hidden
          className="float-slower pointer-events-none absolute -right-16 top-24 hidden h-40 w-40 rounded-full opacity-60 lg:block"
          style={{
            background: "radial-gradient(circle at 35% 30%, rgba(168,85,247,0.7), rgba(123,45,255,0.25) 55%, transparent 75%)",
            filter: "blur(2px)",
          }}
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="kicker hero-in">
            {/* Se parte solo entre piezas, nunca a mitad de una */}
            {t("home.kicker")
              .split(" · ")
              .map((pieza, i) => (
                <span key={pieza}>
                  {i > 0 && <span className="text-judo-lilac"> · </span>}
                  <span className="whitespace-nowrap">{pieza}</span>
                </span>
              ))}
          </p>
          <h1
            className="hero-in mt-4 text-5xl font-bold leading-tight sm:text-7xl"
            style={{ animationDelay: "calc(var(--tiempo) * 1)" }}
          >
            {t("hero.title")}
            <br />
            <span className="bg-gradient-to-r from-judo-purple via-judo-lilac to-judo-purple bg-clip-text text-transparent">
              {t("hero.titleAccent")}
            </span>
          </h1>
          <p
            className="hero-in mt-6 max-w-2xl text-lg text-pretty text-judo-fog/70"
            style={{ animationDelay: "calc(var(--tiempo) * 2)" }}
          >
            {t("hero.subtitle")}
          </p>
          <div
            className="hero-in mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
            style={{ animationDelay: "calc(var(--tiempo) * 3)" }}
          >
            <Link href="/contact" className="btn-primary">
              {t("hero.ctaPrimary")}
              <Icono nombre="flecha" tamano={18} />
            </Link>
            <Link href="/diagnostic" className={DISCRETO}>
              {diagnostico}
            </Link>
          </div>
        </div>
      </section>

      {/* ── EL SHOW: los websites del showcase, deslizándose ──────────
          La prueba de lo que hacemos, arriba y a todo el ancho: sitios de
          nuestros clientes, en línea hoy, cada uno abre el sitio de verdad
          (components/ShowDeWebsites.tsx). */}
      <section className="hero-in pb-12 sm:pb-16" style={{ animationDelay: "calc(var(--tiempo) * 4)" }}>
        <p className="mx-auto max-w-6xl px-6 text-balance text-center text-sm text-judo-fog/65">
          <Icono nombre="navegador" tamano={18} className="mr-1.5 inline-block align-[-4px] text-judo-lilac" />
          {t("home.ancla")}
        </p>
        <div className="mt-6">
          <ShowDeWebsites locale={locale} />
        </div>
        <div className="mt-6 text-center">
          <Link href="/showcase" className={DISCRETO}>
            {t("home.verTodo")}
            <Icono nombre="flecha" tamano={16} />
          </Link>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">{t("home.pasosKicker")}</p>
          <h2 className="mt-4 text-3xl font-bold text-balance sm:text-4xl">{t("onboarding.title")}</h2>
        </Reveal>
        <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* La línea que une los pasos, en pantallas anchas */}
          <span
            aria-hidden
            className="absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r from-judo-purple/0 via-judo-purple/60 to-judo-purple/0 lg:block"
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} paso={i}>
              <div className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <span className="display-num relative flex h-10 w-10 flex-none items-center justify-center rounded-full border border-judo-lilac/50 bg-judo-black text-sm font-bold text-judo-lilac">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold lg:mt-4">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-judo-fog/65">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── LO QUE HACEMOS ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">{t("home.ofertaKicker")}</p>
          <h2 className="mt-4 text-3xl font-bold text-balance sm:text-4xl">{t("home.ofertaTitle")}</h2>
          <p className="mt-6 text-pretty text-judo-fog/65">{t("home.ofertaSub")}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SERVICIOS.map((s, i) => {
            const puntos = t.raw(`home.${s.id}.puntos`) as string[];
            const precio =
              s.id === "websites"
                ? `${t("plans.from")} ${precioDesde()}${t("plans.perMonth")}`
                : s.id === "advice"
                  ? t("home.advice.price", { price: usd(PRECIO_DIAGNOSTICO) })
                  : t("home.growth.price");
            return (
              <Reveal key={s.id} paso={i} className="h-full">
                <div className={`svc ${s.clase} svc-card flex h-full flex-col p-7`}>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      color: "var(--svc-luz)",
                      background: "color-mix(in srgb, var(--svc) 16%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--svc) 35%, transparent)",
                    }}
                  >
                    <Icono nombre={s.icono} tamano={26} />
                  </span>
                  <p className="mt-6 text-xs font-bold tracking-wide uppercase" style={{ color: "var(--svc-luz)" }}>
                    {t(`home.${s.id}.kicker`)}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{t(`home.${s.id}.name`)}</h3>
                  <p className="display-num mt-2 text-lg font-bold text-judo-fog/90">{precio}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {puntos.map((p) => (
                      <li key={p} className="flex gap-3 text-sm text-judo-fog/80">
                        <Icono nombre="check" tamano={18} className="mt-0.5 flex-none text-[var(--svc-luz)]" />
                        <span>{p.replace("{days}", String(DIAS_DIAGNOSTICO))}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={s.hash ? { pathname: s.href, hash: s.hash } : s.href}
                    className="mt-8 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold transition hover:gap-3"
                    style={{ color: "var(--svc-luz)" }}
                  >
                    {t(`home.${s.id}.cta`)}
                    <Icono nombre="flecha" tamano={16} />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── RESEÑAS ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">{t("home.resenasKicker")}</p>
          <h2 className="mt-4 text-3xl font-bold text-balance sm:text-4xl">{t("reviews.title")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal key={review.name} paso={i} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                <div className="text-judo-lilac" role="img" aria-label={t("home.cincoEstrellas")}>
                  {"★★★★★"}
                </div>
                <blockquote className="mt-4 flex-1 leading-relaxed text-judo-fog/85">“{review.text}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  {/* La inicial en un disco: honesto, sin cara comprada */}
                  <span className="display-num flex h-10 w-10 flex-none items-center justify-center rounded-full bg-judo-purple/25 text-sm font-bold text-judo-lilac">
                    {review.name.charAt(0)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold">{review.name}</span>
                    <span className="block text-judo-fog/55">{review.place}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        {/* Reseñas aprobadas de visitantes (leídas en el servidor) + botón
            discreto para enviar una */}
        <Suspense fallback={null}>
          <ResenasComunidad />
        </Suspense>
      </section>

      {/* ── CIERRE: la acción otra vez y dónde estamos ───────────── */}
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.25rem] border border-judo-purple/30 bg-[linear-gradient(160deg,#262338_0%,#1b1928_60%,#171522_100%)] px-5 py-12 text-center sm:px-12">
            {/* Trama de puntos detrás del panel, por debajo del 13% */}
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]">
              <defs>
                <pattern id="puntos-cierre" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="#b98cff" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#puntos-cierre)" />
            </svg>
            <div className="relative">
              <h2 className="text-3xl font-bold text-balance sm:text-4xl">{t("home.cierreTitle")}</h2>
              <p className="mx-auto mt-6 max-w-xl text-pretty text-judo-fog/70">{t("home.cierreSub")}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <Link href="/contact" className="btn-primary">
                  {t("hero.ctaPrimary")}
                  <Icono nombre="flecha" tamano={18} />
                </Link>
                <Link href="/diagnostic" className={DISCRETO}>
                  {diagnostico}
                </Link>
              </div>
              <div className="mt-12 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-8 text-sm text-judo-fog/65 sm:flex-row sm:gap-8">
                <a
                  href={PERFIL_GOOGLE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 transition hover:text-judo-fog"
                >
                  <Icono nombre="pin" tamano={18} className="flex-none text-judo-lilac" />
                  {t("visit.address")}
                </a>
                <a href="tel:+13059349981" className="inline-flex min-h-11 items-center gap-2 transition hover:text-judo-fog">
                  <Icono nombre="telefono" tamano={18} className="flex-none text-judo-lilac" />
                  305-934-9981
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
