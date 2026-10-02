import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { cuotaInicioTexto, precioTexto, PRECIO_ASISTENTE } from "@/lib/pricing";

/**
 * Página del nicho de salud mental (Junior, 2 de octubre de 2026).
 *
 * Es a donde llevan los correos de prospección a clínicas de salud mental,
 * terapia ABA, consejería y terapias del desarrollo, y la que ataca las
 * keywords de ese nicho (docs/SEO.md). Su argumento son tres proyectos
 * nuestros que están en línea: Denali CRT, RBT Corner y The Notes, con la
 * captura real de cada uno. Ninguna cifra ni promesa que no se pueda probar:
 * el visitante es un director de clínica y lo va a comprobar.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("mentalHealth", locale);
}

type Pregunta = { q: string; a: string };
type Familia = { title: string; items: string[] };
type Trabajo = { name: string; what: string };
type Precio = { name: string; price: string; note: string };

/** Los proyectos que respaldan la página, en el orden de los textos. */
const PROYECTOS = [
  { url: "https://www.denalibehaviorcrt.com", imagen: "/nichos/salud-mental/denali-crt.jpg" },
  { url: "https://www.rbtcorner.com", imagen: "/nichos/salud-mental/rbt-corner.jpg" },
  { url: "https://thenotes.net", imagen: "/nichos/salud-mental/the-notes.jpg" },
];

const WHATSAPP = "https://wa.me/13059349981";

export default function MentalHealthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("mentalHealth");

  const valores = {
    essential: precioTexto("essential"),
    setup: cuotaInicioTexto("essential"),
    assistant: `$${PRECIO_ASISTENTE}`,
  };
  const llenar = (texto: string) =>
    texto
      .replace("{essential}", valores.essential)
      .replace("{setup}", valores.setup)
      .replace("{assistant}", valores.assistant);

  const kicker = t.raw("kicker") as string[];
  const confianza = (t.raw("trust") as string[]).map(llenar);
  const decide = t.raw("decide") as Pregunta[];
  const familias = t.raw("build") as Familia[];
  const trabajos = t.raw("work") as Trabajo[];
  const precios = (t.raw("prices") as Precio[]).map((p) => ({ ...p, price: llenar(p.price), note: llenar(p.note) }));
  const faq = t.raw("faq") as Pregunta[];

  const ruta = locale === "es" ? "/es/salud-mental" : "/mental-health";
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: t("titleBefore") + t("titleHighlight") + t("titleAfter"),
        serviceType: locale === "es" ? "Páginas web para clínicas de salud mental" : "Websites for mental health clinics",
        url: `${SITE_URL}${ruta}`,
        areaServed: ["Miami", "Florida", "United States", "Latin America"],
        provider: { "@type": "ProfessionalService", name: "Judo Marketing", url: SITE_URL },
        offers: {
          "@type": "Offer",
          price: valores.essential.replace("$", ""),
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="judo-glow">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <p className="hero-in text-xs font-bold tracking-[0.18em] text-judo-lilac uppercase">
          {kicker.join(" · ")}
        </p>
        <h1
          className="hero-in mx-auto mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl"
          style={{ animationDelay: "calc(var(--tiempo) * 1)" }}
        >
          {t("titleBefore")}
          <span className="text-judo-lilac">{t("titleHighlight")}</span>
          {t("titleAfter")}
        </h1>
        <p
          className="hero-in mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-judo-fog/70"
          style={{ animationDelay: "calc(var(--tiempo) * 2)" }}
        >
          {t("subtitle")}
        </p>
        <div
          className="hero-in mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "calc(var(--tiempo) * 3)" }}
        >
          <Link href={{ pathname: "/contact", hash: "agendar" }} className="btn-primary">
            {t("ctaPrimary")} →
          </Link>
          <a href="#proyectos" className="btn-secondary">
            {t("ctaSecondary")}
          </a>
        </div>
        <ul
          className="hero-in mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-judo-fog/65"
          style={{ animationDelay: "calc(var(--tiempo) * 4)" }}
        >
          {confianza.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <span aria-hidden className="text-judo-lilac">
                ✓
              </span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* ── LAS TRES PREGUNTAS DE LA FAMILIA ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("decideTitle")}</h2>
          <p className="mt-3 text-judo-fog/65">{t("decideSub")}</p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {decide.map((d, i) => (
            <Reveal key={d.q} paso={i}>
              <div className="svc svc-websites svc-card h-full p-7">
                <span className="text-3xl font-bold text-judo-purple/60">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold">{d.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/70">{d.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── LO QUE CONSTRUIMOS ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("buildTitle")}</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {familias.map((f, i) => (
            <Reveal key={f.title} paso={i}>
              <div className="svc svc-websites svc-card h-full p-7">
                <h3 className="text-lg font-bold" style={{ color: "var(--svc-luz)" }}>
                  {f.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {f.items.map((item) => (
                    <li key={item} className="svc-check text-sm text-judo-fog/80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PROYECTOS EN LÍNEA ───────────────────────────────────────── */}
      <section id="proyectos" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("workTitle")}</h2>
          <p className="mt-3 text-judo-fog/65">{t("workSub")}</p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {trabajos.map((w, i) => (
            <Reveal key={w.name} paso={i}>
              <a
                href={PROYECTOS[i].url}
                target="_blank"
                rel="noopener"
                className="svc svc-websites svc-card group flex h-full flex-col overflow-hidden"
              >
                <Image
                  src={PROYECTOS[i].imagen}
                  alt={`${w.name}: ${locale === "es" ? "portada del website" : "website home page"}`}
                  width={900}
                  height={562}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="aspect-[900/562] w-full border-b border-judo-lilac/15 object-cover object-top"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold">{w.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-judo-fog/70">{w.what}</p>
                  <span className="mt-4 text-sm font-semibold text-judo-lilac group-hover:underline">
                    {t("visit")} ↗
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PRECIOS ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("priceTitle")}</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {precios.map((p, i) => (
            <Reveal key={p.name} paso={i}>
              <div className="svc svc-websites svc-card h-full p-7 text-center">
                <h3 className="text-base font-semibold text-judo-fog/80">{p.name}</h3>
                <p className="display mt-3 text-3xl font-bold">{p.price}</p>
                <p className="mt-2 text-sm text-judo-fog/60">{p.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PREGUNTAS ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("faqTitle")}</h2>
        </Reveal>
        <div className="mt-8 flex flex-col gap-3">
          {faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-judo-lilac/15 bg-[#0e0e16] p-5 open:border-judo-lilac/35"
            >
              <summary className="cursor-pointer list-none font-semibold">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span aria-hidden className="text-judo-lilac transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-judo-fog/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CIERRE ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pt-6 pb-24">
        <Reveal>
          <div className="rounded-3xl border border-judo-lilac/20 bg-[#0e0e16] p-8 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-12">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("closeTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-judo-fog/70">{t("closeText")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={{ pathname: "/contact", hash: "agendar" }} className="btn-primary">
                {t("ctaPrimary")} →
              </Link>
              <a href={WHATSAPP} target="_blank" rel="noopener" className="btn-secondary">
                {t("whatsapp")}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />
    </div>
  );
}
