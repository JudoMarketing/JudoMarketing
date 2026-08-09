import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata("services", locale);
}

type DiffItem = { title: string; description: string };
type FaqItem = { q: string; a: string };

export default function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("services");

  // Los tres de siempre son los protagonistas. Media Marketing va aparte y
  // más abajo: no es un plan de website, es lo que trae a la gente hasta él.
  const plans = ["essential", "complex", "apps"] as const;
  const diffs = t.raw("diff.items") as DiffItem[];
  const faqs = t.raw("faq.items") as FaqItem[];
  const mediaFeatures = t.raw("media.features") as string[];
  const es = locale === "es";

  return (
    <div className="judo-glow">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-6 text-center">
        {/* El plazo, arriba de todo: es lo primero que hay que saber */}
        <p
          className="hero-in inline-flex items-center gap-2 rounded-full border border-amber-400/45 bg-amber-400/10 px-5 py-2 text-sm font-semibold text-amber-200"
        >
          <span aria-hidden>⏳</span>
          {t("promoBadge")}
        </p>
        <h1 className="hero-in mt-6 text-4xl font-bold sm:text-6xl" style={{ animationDelay: "0.1s" }}>
          {t("title")}
        </h1>
        <p
          className="hero-in mx-auto mt-4 max-w-2xl text-judo-fog/70"
          style={{ animationDelay: "0.2s" }}
        >
          {t("subtitle")}
        </p>
      </section>

      {/* ── LOS TRES PRINCIPALES ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const features = t.raw(`${plan}.features`) as string[];
            return (
              <Reveal key={plan} delay={i * 120}>
                <TiltCard className="relative flex h-full flex-col overflow-hidden p-8">
                  {/* Número del escalón: da orden sin inventar jerarquías */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-3 right-4 text-7xl font-black text-judo-lilac/10 select-none"
                  >
                    0{i + 1}
                  </span>

                  <h2 className="text-xl font-semibold">{t(`${plan}.name`)}</h2>

                  {/* Precio de ahora, grande; el de después, tachado al lado */}
                  <div className="mt-4 flex items-end gap-3">
                    <p className="leading-none">
                      <span className="text-5xl font-bold text-judo-fog">
                        {t(`${plan}.price`)}
                      </span>
                      <span className="text-judo-lilac">{t("perMonth")}</span>
                    </p>
                    <p className="pb-1 text-lg font-semibold text-judo-fog/35 line-through decoration-amber-400/70 decoration-2">
                      {t(`${plan}.priceAfter`)}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-amber-300/90">
                    {t("promoAfter")} {t(`${plan}.priceAfter`)}
                    {t("perMonth")}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-judo-fog/65">
                    {t(`${plan}.tagline`)}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {features.map((feature) => (
                      <li key={feature} className="check-item text-sm text-judo-fog/80">
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={{ pathname: "/pay", query: { plan } }}
                    className="btn-primary mt-8 w-full"
                  >
                    {es ? "Iniciar" : "Get started"} →
                  </Link>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-amber-200/85">
          {t("promoNote")}
        </p>
        <p className="mt-2 text-center text-xs text-judo-fog/45">{t("note")}</p>
      </section>

      {/* ── MEDIA MARKETING: aparte, después de los websites ─────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-judo-lilac/25 bg-gradient-to-br from-judo-purple/20 via-judo-surface to-judo-surface p-8 sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, rgba(168,85,247,0.45), transparent 70%)",
                filter: "blur(6px)",
              }}
            />
            <div className="relative grid gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold tracking-wide text-judo-lilac uppercase">
                  {t("media.eyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t("media.name")}</h2>
                <p className="mt-4 max-w-xl leading-relaxed text-judo-fog/75">
                  {t("media.body")}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Instagram", "Facebook", "TikTok", "Google"].map((red) => (
                    <span
                      key={red}
                      className="rounded-full border border-judo-lilac/30 bg-judo-black/40 px-4 py-1.5 text-sm text-judo-fog/80"
                    >
                      {red}
                    </span>
                  ))}
                </div>

                <p className="mt-7 text-2xl font-bold text-judo-lilac">
                  {t("media.price")}
                </p>
                <Link href="/contact" className="btn-primary mt-5 inline-flex">
                  {t("media.cta")} →
                </Link>
              </div>

              <ul className="space-y-3 self-center">
                {mediaFeatures.map((feature) => (
                  <li key={feature} className="check-item text-sm text-judo-fog/80">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 pb-28">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold">{t("diff.title")}</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {diffs.map((diff, i) => (
            <Reveal key={diff.title} delay={i * 90}>
              <TiltCard className="h-full p-5 text-center">
                <h3 className="text-sm font-bold text-judo-lilac">{diff.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-judo-fog/65">
                  {diff.description}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes: contenido indexable + datos estructurados
          FAQPage para los resultados enriquecidos de Google */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold">{t("faq.title")}</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-judo-lilac/20 bg-judo-surface/80 px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-semibold text-judo-fog transition group-open:text-judo-lilac">
                {faq.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-judo-fog/75">{faq.a}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            }),
          }}
        />
      </section>
    </div>
  );
}
