import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";
import ResenasComunidad from "@/components/ResenasComunidad";
import { PERFIL_GOOGLE } from "@/components/SocialLinks";
import ListoOverlay from "@/components/ListoOverlay";
import Image from "next/image";
import { DIAS_DIAGNOSTICO, PRECIO_ASISTENTE, PRECIO_DIAGNOSTICO, precioAntes, precioDesde, usd } from "@/lib/pricing";
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


/**
 * Lo que hace Judo, en el orden en que el cliente lo necesita (Junior, 25 nov
 * 2026: sin Juditos ni JuditoADS en el home; esos dos quedan en el header).
 */
const SERVICIOS = [
  { id: "websites", clase: "svc-websites", icono: "/home/websites.webp", lema: "confianza", href: "/services", hash: "websites" },
  { id: "social", clase: "svc-ads", icono: "/home/redes.webp", lema: "valor", href: "/contact" },
  { id: "automation", clase: "svc-ai", icono: "/home/automatizacion.webp", lema: "valor", href: "/services", hash: "ai-assistants" },
] as const;

type Step = { title: string; description: string };
type Review = { text: string; name: string; place: string };
type Razon = { title: string; text: string };

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
  const razones = t.raw("home.why") as Razon[];

  return (
    <div className="judo-glow overflow-hidden">
      {/* Cierre para quien acaba de pagar y confirmar sus datos */}
      <Suspense fallback={null}>
        <ListoOverlay />
      </Suspense>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-20 text-center">
        {/* Elementos 3D flotantes */}
        <svg
          aria-hidden
          className="float-slow pointer-events-none absolute -left-10 top-24 hidden opacity-50 md:block"
          width="120"
          height="132"
          viewBox="0 0 100 110"
        >
          <g className="spin-slow" style={{ transformOrigin: "50px 55px" }}>
            <polygon
              points="50,5 95,30 95,80 50,105 5,80 5,30"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.2"
            />
            <line x1="50" y1="5" x2="50" y2="105" stroke="#a855f7" strokeWidth="0.7" />
            <line x1="5" y1="30" x2="95" y2="80" stroke="#a855f7" strokeWidth="0.7" />
            <line x1="95" y1="30" x2="5" y2="80" stroke="#a855f7" strokeWidth="0.7" />
          </g>
        </svg>
        <div
          aria-hidden
          className="float-slower pointer-events-none absolute -right-16 top-40 hidden h-40 w-40 rounded-full opacity-70 md:block"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(168,85,247,0.7), rgba(123,45,255,0.25) 55%, transparent 75%)",
            filter: "blur(2px)",
          }}
        />
        <svg
          aria-hidden
          className="pointer-events-none absolute right-8 bottom-10 hidden opacity-40 md:block"
          width="140"
          height="80"
          viewBox="0 0 140 80"
        >
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => (
              <circle
                key={`${r}-${c}`}
                cx={8 + c * 15}
                cy={8 + r * 15}
                r="1.6"
                fill="#7b2dff"
              />
            ))
          )}
        </svg>

        <h1
          className="hero-in text-5xl font-bold leading-tight tracking-tight sm:text-7xl"
          style={{ animationDelay: "calc(var(--tiempo) * 1)" }}
        >
          {t("hero.title")}
          <br />
          <span className="bg-gradient-to-r from-judo-purple via-judo-lilac to-judo-purple bg-clip-text text-transparent">
            {t("hero.titleAccent")}
          </span>
        </h1>
        <p
          className="hero-in mt-6 max-w-2xl text-lg text-judo-fog/70"
          style={{ animationDelay: "calc(var(--tiempo) * 2)" }}
        >
          {t("hero.subtitle")}
        </p>
        <div
          className="hero-in mt-10 flex flex-col gap-4 sm:flex-row"
          style={{ animationDelay: "calc(var(--tiempo) * 3)" }}
        >
          <Link href="/contact" className="btn-primary">
            {t("hero.ctaPrimary")} →
          </Link>
          <Link href="/showcase" className="btn-secondary">
            {t("hero.ctaSecondary")}
          </Link>
        </div>

        {/* El primer paso para quien todavía no sabe qué necesita: el
            diagnóstico de $99 (docs/vendito/decisiones.md, 14 nov 2026). */}
        <div className="hero-in mt-5 flex flex-wrap justify-center gap-3" style={{ animationDelay: "calc(var(--tiempo) * 4)" }}>
          <Link
            href="/diagnostic"
            className="inline-flex items-center gap-2 rounded-full border border-judo-lilac/20 bg-white/5 px-6 py-2.5 text-sm text-judo-fog/70 backdrop-blur-sm transition hover:border-judo-lilac/45 hover:bg-white/10 hover:text-judo-fog"
          >
            {t("hero.ctaDiagnostic")}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* ── LO QUE HACEMOS ──────────────────────────────────────────
          Junior, 25 nov 2026: el home dice lo que hace Judo; Juditos y
          JuditoADS quedan solo en el header. Cada servicio dice a qué mitad
          del lema responde (construye confianza o crea valor), con su color
          de /services (globals.css, .svc-*) y un objeto 3D (Fluent, MIT). */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("home.whatTitle")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-judo-fog/60">{t("home.whatSubtitle")}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SERVICIOS.map((servicio, i) => (
            <Reveal key={servicio.id} paso={i}>
              <Link href={"hash" in servicio ? { pathname: servicio.href, hash: servicio.hash } : servicio.href} className="block h-full">
                <div className={`svc ${servicio.clase} svc-card flex h-full flex-col p-7`}>
                  <div className="relative flex h-32 items-center justify-center">
                    <div
                      aria-hidden
                      className={`svc-halo late ${["", "late-tarde", "late-medio"][i]} pointer-events-none absolute inset-0 blur-xl`}
                    />
                    <Image src={servicio.icono} alt="" width={128} height={128} className="relative h-28 w-28 object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.45)]" />
                  </div>
                  <p className="mt-5 text-xs font-bold tracking-wide uppercase" style={{ color: "var(--svc-luz)" }}>
                    {t(servicio.lema === "confianza" ? "home.trust" : "home.value")}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">{t(`home.${servicio.id}.name`)}</h3>
                  <p className="display-num mt-1 text-lg font-bold" style={{ color: "var(--svc-luz)" }}>
                    {servicio.id === "websites" ? (
                      <>
                        {precioAntes("essential") !== null && (
                          <>
                            <span className="sr-only">{t("plans.was")} </span>
                            <s className="mr-2 text-base font-medium text-judo-fog/45">{usd(precioAntes("essential")!)}</s>
                          </>
                        )}
                        {`${t("plans.from")} ${precioDesde()}${t("plans.perMonth")}`}
                      </>
                    ) : servicio.id === "automation" ? (
                      `${t("plans.from")} ${usd(PRECIO_ASISTENTE)}${t("plans.perMonth")}`
                    ) : (
                      t("home.social.price")
                    )}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-judo-fog/65">{t(`home.${servicio.id}.description`)}</p>
                  <p className="mt-6 text-sm font-semibold" style={{ color: "var(--svc-luz)" }}>
                    {servicio.id === "social" ? t("home.social.more") : t("home.more")} →
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* El diagnóstico: el primer paso, a lo ancho */}
        <Reveal paso={3}>
          <Link href="/diagnostic" className="mt-6 block">
            <div className="svc svc-websites svc-card flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:text-left">
              <Image src="/home/diagnostico.webp" alt="" width={112} height={112} className="h-24 w-24 flex-none object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.45)]" />
              <div className="flex-1">
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--svc-luz)" }}>{t("home.diagnostic.kicker")}</p>
                <h3 className="mt-1 text-2xl font-bold">
                  {t("home.diagnostic.name")} <span className="display-num" style={{ color: "var(--svc-luz)" }}>· {usd(PRECIO_DIAGNOSTICO)}</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/65">{t("home.diagnostic.description", { days: DIAS_DIAGNOSTICO })}</p>
              </div>
              <span className="btn-primary flex-none">{t("home.diagnostic.cta")} →</span>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ── POR QUÉ NOSOTROS: lo que se puede comprobar ───────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("home.whyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-judo-fog/60">{t("home.whySubtitle")}</p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {razones.map((r, i) => (
            <Reveal key={r.title} paso={i}>
              <TiltCard className="h-full p-6">
                <h3 className="text-lg font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/65">{r.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ONBOARDING: 4 PASOS ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("onboarding.title")}</h2>
          <p className="mt-2 text-judo-fog/60">{t("onboarding.subtitle")}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.title} paso={i}>
              <TiltCard className="h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-judo-purple to-judo-lilac text-lg font-bold text-white shadow-[0_8px_24px_-8px_rgba(123,45,255,0.8)]">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/65">
                  {step.description}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── RESEÑAS ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("reviews.title")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review, i) => (
            <Reveal key={review.name} paso={i}>
              <TiltCard className="flex h-full flex-col p-7">
                <div className="text-judo-lilac" aria-label="5 estrellas">
                  {"★★★★★"}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-judo-fog/80">
                  “{review.text}”
                </p>
                <p className="mt-5 text-sm font-semibold">
                  {review.name}
                  <span className="ml-2 font-normal text-judo-fog/50">
                    {review.place}
                  </span>
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
        {/* Reseñas aprobadas de visitantes (leídas en el servidor) + botón
            discreto para enviar una */}
        <Suspense fallback={null}>
          <ResenasComunidad />
        </Suspense>
      </section>

      {/* ── DIRECCIÓN / VISÍTANOS ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <Reveal>
          <TiltCard className="p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold">{t("visit.title")}</h2>
            <p className="mt-3 text-judo-fog/70">{t("visit.address")}</p>
            <div className="mt-6 flex justify-center">
              <a
                href={PERFIL_GOOGLE}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                📍 {t("visit.maps")}
              </a>
            </div>
          </TiltCard>
        </Reveal>
      </section>
    </div>
  );
}
