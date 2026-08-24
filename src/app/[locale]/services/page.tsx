import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import { ArteWebsites, ArteAds, ArteAi } from "@/components/ServiceArt";
import { pageMetadata } from "@/lib/seo";
import { precioTexto, PRECIO_JUDITOADS, PRECIO_ASISTENTE } from "@/lib/pricing";

/**
 * Tres servicios, tres colores, poco texto.
 *
 * El problema que resuelve esta página: con Websites, JuditoADS y AI
 * Assistants juntos, todo se veía igual de morado y el visitante no sabía
 * dónde terminaba uno y empezaba el otro. Cada familia trae ahora su color
 * (clases .svc-* en globals.css), su dibujo y una frase de tres palabras que
 * dice para qué sirve. Lo que antes eran párrafos ahora son cuatro viñetas.
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

/** Las tres familias, en el orden en que el cliente las necesita. */
const FAMILIAS = [
  { id: "websites", ancla: "websites", clase: "svc-websites", icono: "🌐" },
  { id: "social", ancla: "juditoads", clase: "svc-ads", icono: "📣" },
  { id: "ai", ancla: "ai-assistants", clase: "svc-ai", icono: "🤖" },
] as const;

export default function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("services");

  const planes = ["essential", "complex", "apps"] as const;
  const diffs = t.raw("diff.items") as DiffItem[];
  const faqs = (t.raw("faq.items") as FaqItem[]).map((faq) => ({
    q: faq.q,
    a: faq.a
      .replace("{essential}", precioTexto("essential"))
      .replace("{complex}", precioTexto("complex"))
      .replace("{apps}", precioTexto("apps")),
  }));

  return (
    <div className="judo-glow">
      {/* ── ENTRADA: los tres, de un vistazo y con su color ──────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-4 text-center">
        <h1 className="hero-in text-4xl font-bold sm:text-6xl">{t("title")}</h1>
        <p
          className="hero-in mx-auto mt-4 max-w-xl text-lg text-judo-fog/70"
          style={{ animationDelay: "0.2s" }}
        >
          {t("subtitle")}
        </p>

        <div
          className="hero-in mt-10 grid gap-4 sm:grid-cols-3"
          style={{ animationDelay: "0.3s" }}
        >
          {FAMILIAS.map((f) => (
            <a
              key={f.id}
              href={`#${f.ancla}`}
              className={`svc ${f.clase} svc-card block p-6 text-left`}
            >
              <span className="text-2xl" aria-hidden>
                {f.icono}
              </span>
              <p
                className="mt-3 text-xs font-bold tracking-wide uppercase"
                style={{ color: "var(--svc-luz)" }}
              >
                {t(`kicker.${f.id}`)}
              </p>
              <p className="mt-1 text-xl font-bold">{t(`sections.${f.id}Title`)}</p>
              <p className="mt-1.5 text-sm text-judo-fog/60">
                {t(`sections.${f.id}Sub`)}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* ── WEBSITES ─────────────────────────────────────────────────── */}
      <section
        id="websites"
        className="svc svc-websites mx-auto max-w-6xl scroll-mt-24 px-6 pt-16 pb-12"
      >
        <Reveal>
          <div className="grid items-center gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="svc-tag">🌐 {t("kicker.websites")}</span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                {t("sections.websitesTitle")}
              </h2>
              <p className="mt-3 max-w-md text-judo-fog/65">
                {t("sections.websitesSub")}
              </p>
            </div>
            {/* La ilustración es el argumento de esta sección: se le da el
                espacio, no las sobras. */}
            <ArteWebsites className="w-full max-w-2xl justify-self-center lg:justify-self-end" />
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {planes.map((plan, i) => {
            const features = t.raw(`${plan}.features`) as string[];
            return (
              <Reveal key={plan} delay={i * 110}>
                <div className="svc-card flex h-full flex-col p-7">
                  <h3 className="text-lg font-bold">{t(`${plan}.name`)}</h3>
                  <p className="mt-1 text-sm text-judo-fog/60">
                    {t(`${plan}.tagline`)}
                  </p>
                  <p className="mt-5">
                    <span className="align-top text-sm text-judo-fog/50">
                      {t("from")}{" "}
                    </span>
                    <span className="text-5xl font-bold">{precioTexto(plan)}</span>
                    <span style={{ color: "var(--svc-luz)" }}>{t("perMonth")}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {features.map((feature) => (
                      <li key={feature} className="svc-check text-sm text-judo-fog/80">
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={{ pathname: "/pay", query: { plan } }}
                    className="svc-btn mt-7"
                  >
                    {t("start")} →
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-judo-fog/45">{t("note")}</p>
      </section>

      {/* ── JUDITOADS ────────────────────────────────────────────────────
          Vive como app aparte bajo /juditoads (rewrite en next.config.ts),
          por eso el enlace es un <a> normal y no pasa por el enrutado de
          idiomas. */}
      <section
        id="juditoads"
        className="svc svc-ads mx-auto max-w-6xl scroll-mt-24 px-6 py-12"
      >
        <Reveal>
          <div className="svc-card p-7 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <span className="svc-tag">📣 {t("kicker.social")}</span>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  {t("juditoads.name")}
                </h2>
                <p className="mt-3 text-judo-fog/70">{t("juditoads.body")}</p>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {(t.raw("juditoads.features") as string[]).map((feature) => (
                    <li key={feature} className="svc-check text-sm text-judo-fog/80">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <ArteAds className="mx-auto w-full max-w-sm" />
                <div className="mt-6 rounded-2xl border border-judo-lilac/15 bg-judo-black/40 p-6 text-center">
                  <p className="text-5xl font-bold">
                    ${PRECIO_JUDITOADS}
                    <span className="text-2xl" style={{ color: "var(--svc-luz)" }}>
                      {t("perMonth")}
                    </span>
                  </p>
                  <p
                    className="mt-2 text-sm font-bold"
                    style={{ color: "var(--svc-luz)" }}
                  >
                    {t("juditoads.free")}
                  </p>
                  <p className="mt-1.5 text-xs text-judo-fog/55">
                    {t("juditoads.priceNote")}
                  </p>
                  <a href="/juditoads" className="svc-btn mt-5">
                    {t("juditoads.cta")} →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── AI ASSISTANTS ────────────────────────────────────────────── */}
      <section
        id="ai-assistants"
        className="svc svc-ai mx-auto max-w-6xl scroll-mt-24 px-6 py-12 pb-20"
      >
        <Reveal>
          <div className="svc-card p-7 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
              <div className="order-2 lg:order-1">
                <ArteAi className="mx-auto w-full max-w-sm" />
                <div className="mt-6 rounded-2xl border border-judo-lilac/15 bg-judo-black/40 p-6 text-center">
                  <p className="text-5xl font-bold">
                    ${PRECIO_ASISTENTE}
                    <span className="text-2xl" style={{ color: "var(--svc-luz)" }}>
                      {t("perMonth")}
                    </span>
                  </p>
                  {/* La mejor prueba del servicio es la que ya corre en esta página */}
                  <p
                    className="mt-3 text-xs font-bold tracking-wide uppercase"
                    style={{ color: "var(--svc-luz)" }}
                  >
                    👇 {t("assistant.demo")}
                  </p>
                  <p className="mt-1 text-xs text-judo-fog/55">
                    {t("assistant.demoNote")}
                  </p>
                  <Link href="/contact" className="svc-btn mt-5">
                    {t("assistant.cta")} →
                  </Link>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <span className="svc-tag">🤖 {t("kicker.ai")}</span>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  {t("assistant.name")}
                </h2>
                <p className="mt-3 text-judo-fog/70">{t("assistant.body")}</p>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {(t.raw("assistant.features") as string[]).map((feature) => (
                    <li key={feature} className="svc-check text-sm text-judo-fog/80">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── POR QUÉ CON NOSOTROS ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold">{t("diffTitle")}</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {diffs.map((diff, i) => (
            <Reveal key={diff.title} delay={i * 80}>
              <div className="svc svc-card h-full p-5 text-center">
                <h3
                  className="text-sm font-bold"
                  style={{ color: "var(--svc-luz)" }}
                >
                  {diff.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-judo-fog/60">
                  {diff.description}
                </p>
              </div>
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
