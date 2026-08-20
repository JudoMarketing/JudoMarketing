import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";
import { ofertaVigente, precioTexto } from "@/lib/pricing";

/**
 * Se regenera cada hora. Es lo que hace que el 1 de septiembre los precios
 * suban solos y la etiqueta de oferta desaparezca, sin tocar nada.
 */
export const revalidate = 3600;

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
  // La respuesta de precios del FAQ se arma con el precio vigente; el resto
  // pasa tal cual.
  const faqs = (t.raw("faq.items") as FaqItem[]).map((faq) => ({
    q: faq.q,
    a: faq.a
      .replace("{essential}", precioTexto("essential"))
      .replace("{complex}", precioTexto("complex"))
      .replace("{apps}", precioTexto("apps")),
  }));
  const mediaFeatures = t.raw("media.features") as string[];
  const asistenteFeatures = t.raw("assistant.features") as string[];
  const juditoadsFeatures = t.raw("juditoads.features") as string[];
  const es = locale === "es";
  const enOferta = ofertaVigente();

  return (
    <div className="judo-glow">
      {/* El plazo no va aquí arriba: lo lleva cada tarjeta en su etiqueta, que
          es donde el precio se está mirando. */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-6 text-center">
        <h1 className="hero-in text-4xl font-bold sm:text-6xl">{t("title")}</h1>
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
                <TiltCard className="flex h-full flex-col p-8">
                  {/* La fecha sola, que es lo que tiene que quedar grabado.
                      Desaparece sola el 1 de septiembre. */}
                  {enOferta && (
                    <p className="inline-flex self-start rounded-full bg-gradient-to-r from-red-500 to-judo-purple px-3.5 py-1.5 text-[11px] font-extrabold tracking-wide text-white uppercase shadow-[0_6px_18px_-6px_rgba(239,68,68,0.75)]">
                      {t("offLabel")}
                    </p>
                  )}

                  <h2 className={`text-xl font-semibold ${enOferta ? "mt-4" : ""}`}>
                    {t(`${plan}.name`)}
                  </h2>

                  <p className="mt-3">
                    <span className="align-top text-sm text-judo-fog/50">
                      {es ? "desde" : "from"}{" "}
                    </span>
                    <span className="text-5xl font-bold text-judo-fog">
                      {precioTexto(plan)}
                    </span>
                    <span className="text-judo-lilac">{t("perMonth")}</span>
                  </p>
                  <p className="mt-1.5 text-xs font-semibold text-judo-fog/55">
                    {t("flatFee")}
                  </p>
                  {enOferta && (
                    <p className="mt-1 text-xs font-semibold text-amber-300/90">
                      {t("offUntil")}
                    </p>
                  )}

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
        <p className="mt-6 text-center text-xs text-judo-fog/45">{t("note")}</p>
      </section>

      {/* ── LO QUE VA DESPUÉS DEL WEBSITE ────────────────────────────
          Dos servicios que se explican juntos: uno trae la gente, el otro la
          atiende. Van aparte de los tres planes porque no son un website. */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("pairTitle")}</h2>
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-judo-lilac/30 bg-judo-purple/10 px-5 py-2 text-sm font-semibold text-judo-lilac">
            <span aria-hidden>🤝</span>
            {t("pairNote")}
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Media Marketing: trae la gente */}
          <Reveal>
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-judo-lilac/25 bg-gradient-to-br from-judo-purple/20 via-judo-surface to-judo-surface p-7 sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, rgba(168,85,247,0.45), transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <div className="relative flex h-full flex-col">
                <p className="text-sm font-semibold tracking-wide text-judo-lilac uppercase">
                  {t("media.eyebrow")}
                </p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{t("media.name")}</h3>
                <p className="mt-3 leading-relaxed text-judo-fog/75">{t("media.body")}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {["Instagram", "Facebook", "TikTok", "Google"].map((red) => (
                    <span
                      key={red}
                      className="rounded-full border border-judo-lilac/30 bg-judo-black/40 px-3.5 py-1 text-xs text-judo-fog/80"
                    >
                      {red}
                    </span>
                  ))}
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {mediaFeatures.map((feature) => (
                    <li key={feature} className="check-item text-sm text-judo-fog/80">
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* El presupuesto lo pone el cliente, pero sin una cifra de
                    referencia no sabe por dónde empezar. */}
                <div className="mt-6 rounded-2xl border border-judo-lilac/30 bg-judo-black/40 p-5">
                  <p className="text-xs font-semibold tracking-wide text-judo-lilac uppercase">
                    ★ {t("media.recommended")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-judo-fog">
                    {t("media.recommendedRange")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-judo-fog/60">
                    {t("media.recommendedNote")}
                  </p>
                </div>

                <p className="mt-5 text-lg font-semibold text-judo-lilac">
                  {t("media.price")}
                </p>
                <Link href="/contact" className="btn-primary mt-4 inline-flex self-start">
                  {t("media.cta")} →
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Asistente con IA: atiende a la gente que llega */}
          <Reveal delay={120}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-judo-lilac/25 bg-gradient-to-bl from-judo-purple/20 via-judo-surface to-judo-surface p-7 sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 60% 40%, rgba(123,45,255,0.45), transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <div className="relative flex h-full flex-col">
                <p className="text-sm font-semibold tracking-wide text-judo-lilac uppercase">
                  {t("assistant.eyebrow")}
                </p>
                <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
                  <span aria-hidden>🤖</span>
                  {t("assistant.name")}
                </h3>
                <p className="mt-3 leading-relaxed text-judo-fog/75">{t("assistant.body")}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {asistenteFeatures.map((feature) => (
                    <li key={feature} className="check-item text-sm text-judo-fog/80">
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* La mejor prueba del servicio es la que ya está corriendo
                    en esta misma página. */}
                <div className="mt-6 rounded-2xl border border-judo-lilac/30 bg-judo-black/40 p-5">
                  <p className="text-xs font-semibold tracking-wide text-judo-lilac uppercase">
                    👇 {t("assistant.demo")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-judo-fog/60">
                    {t("assistant.demoNote")}
                  </p>
                </div>

                <p className="mt-5 text-4xl font-bold text-judo-fog">
                  {t("assistant.price")}
                </p>
                <Link href="/contact" className="btn-primary mt-4 inline-flex self-start">
                  {t("assistant.cta")} →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── JUDITOADS: LA VERSIÓN SELF-SERVICE ───────────────────────
          Media Marketing es "nosotros lo manejamos"; JuditoADS es "tú lo
          manejas con nuestra plataforma". Vive como app aparte bajo
          /juditoads (rewrite en next.config.ts), por eso el enlace es un
          <a> normal y no pasa por el enrutado de idiomas. */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-judo-lilac/25 bg-gradient-to-r from-judo-purple/25 via-judo-surface to-judo-surface p-7 sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(123,45,255,0.5), transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full bg-gradient-to-r from-judo-purple to-judo-lilac px-3.5 py-1.5 text-[11px] font-extrabold tracking-wide text-white uppercase">
                  {t("juditoads.badge")}
                </p>
                <p className="mt-4 text-sm font-semibold tracking-wide text-judo-lilac uppercase">
                  {t("juditoads.eyebrow")}
                </p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {t("juditoads.name")}
                </h3>
                <p className="mt-3 leading-relaxed text-judo-fog/75">
                  {t("juditoads.body")}
                </p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {juditoadsFeatures.map((feature) => (
                    <li key={feature} className="check-item text-sm text-judo-fog/80">
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-judo-fog/50">{t("juditoads.vsMedia")}</p>
              </div>
              <div className="rounded-2xl border border-judo-lilac/30 bg-judo-black/40 p-6 text-center sm:p-8">
                <p className="text-5xl font-bold text-judo-fog">{t("juditoads.price")}</p>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/60">
                  {t("juditoads.priceNote")}
                </p>
                <a href="/juditoads" className="btn-primary mt-6 w-full">
                  {t("juditoads.cta")} →
                </a>
              </div>
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
