import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";
import CommunityReviews from "@/components/CommunityReviews";
import { PERFIL_GOOGLE } from "@/components/SocialLinks";
import ListoOverlay from "@/components/ListoOverlay";
import { ofertaVigente, precioTexto } from "@/lib/pricing";

/** Se regenera cada hora: el 1 de septiembre los precios suben solos. */
export const revalidate = 3600;


type Step = { title: string; description: string };
type Review = { text: string; name: string; place: string };

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();

  const plans = ["essential", "complex", "apps", "media"] as const;
  const enOferta = ofertaVigente();
  const steps = t.raw("onboarding.steps") as Step[];
  const reviews = t.raw("reviews.items") as Review[];

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
          style={{ animationDelay: "0.15s" }}
        >
          {t("hero.title")}
          <br />
          <span className="bg-gradient-to-r from-judo-purple via-judo-lilac to-judo-purple bg-clip-text text-transparent">
            {t("hero.titleAccent")}
          </span>
        </h1>
        <p
          className="hero-in mt-6 max-w-2xl text-lg text-judo-fog/70"
          style={{ animationDelay: "0.3s" }}
        >
          {t("hero.subtitle")}
        </p>
        <div
          className="hero-in mt-10 flex flex-col gap-4 sm:flex-row"
          style={{ animationDelay: "0.45s" }}
        >
          <Link href="/contact" className="btn-primary">
            {t("hero.ctaPrimary")} →
          </Link>
          <Link href="/services" className="btn-secondary">
            {t("hero.ctaSecondary")}
          </Link>
        </div>

        {/* Tercer camino, más discreto: ver el trabajo ya hecho */}
        <div className="hero-in mt-5" style={{ animationDelay: "0.6s" }}>
          <Link
            href="/showcase"
            className="inline-flex items-center gap-2 rounded-full border border-judo-lilac/20 bg-white/5 px-6 py-2.5 text-sm text-judo-fog/70 backdrop-blur-sm transition hover:border-judo-lilac/45 hover:bg-white/10 hover:text-judo-fog"
          >
            {t("hero.ctaShowcase")}
            <span aria-hidden>→</span>
          </Link>
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
            <Reveal key={step.title} delay={i * 120}>
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

      {/* ── SERVICIOS (VITRINA) ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("plans.title")}</h2>
          <p className="mt-2 text-judo-fog/60">{t("plans.subtitle")}</p>
          {/* La oferta también aquí, que es donde llega casi todo el mundo.
              Se apaga sola el 1 de septiembre. */}
          {enOferta && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-judo-purple px-4 py-1.5 text-sm text-white shadow-[0_6px_18px_-6px_rgba(239,68,68,0.75)]">
              <span className="font-extrabold tracking-wide">{t("services.offLabel")}</span>
              <span className="font-medium text-white/85">{t("services.offUntil")}</span>
            </p>
          )}
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <Reveal key={plan} delay={i * 120}>
              <Link href="/services" className="block h-full">
                <TiltCard className="h-full p-7">
                  <h3 className="text-xl font-semibold">{t(`plans.${plan}.name`)}</h3>
                  <p className="mt-1 text-2xl font-bold text-judo-lilac">
                    {plan === "media"
                      ? t("plans.media.price")
                      : `${t("plans.from")} ${precioTexto(plan)}${t("plans.perMonth")}`}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-judo-fog/65">
                    {t(`plans.${plan}.description`)}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-judo-lilac">
                    {t("plans.more")} →
                  </p>
                </TiltCard>
              </Link>
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
            <Reveal key={review.name} delay={i * 120}>
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
        {/* Reseñas aprobadas de visitantes + botón discreto para enviar una */}
        <CommunityReviews />
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
