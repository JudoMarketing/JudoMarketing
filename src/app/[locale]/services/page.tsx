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

  const plans = ["essential", "complex", "apps"] as const;
  const diffs = t.raw("diff.items") as DiffItem[];
  const faqs = t.raw("faq.items") as FaqItem[];

  return (
    <div className="judo-glow">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-10 text-center">
        <h1 className="hero-in text-4xl font-bold sm:text-6xl">{t("title")}</h1>
        <p
          className="hero-in mx-auto mt-4 max-w-2xl text-judo-fog/70"
          style={{ animationDelay: "0.15s" }}
        >
          {t("subtitle")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const features = t.raw(`${plan}.features`) as string[];
            return (
              <Reveal key={plan} delay={i * 120}>
                <TiltCard className="flex h-full flex-col p-8">
                  <h2 className="text-xl font-semibold">{t(`${plan}.name`)}</h2>
                  <p className="mt-3">
                    <span className="align-top text-sm text-judo-fog/50">
                      {locale === "es" ? "desde" : "from"}{" "}
                    </span>
                    <span className="text-5xl font-bold text-judo-fog">
                      {t(`${plan}.price`)}
                    </span>
                    <span className="text-judo-lilac">{t("perMonth")}</span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-judo-fog/65">
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
                    {locale === "es" ? "Iniciar" : "Get started"} →
                  </Link>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-judo-fog/45">{t("note")}</p>
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
