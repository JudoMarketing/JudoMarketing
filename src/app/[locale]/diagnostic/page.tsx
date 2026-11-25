import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import BotonDiagnostico from "@/components/BotonDiagnostico";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { DIAS_DIAGNOSTICO, PRECIO_DIAGNOSTICO, usd } from "@/lib/pricing";
import Icono, { type IconName } from "@/components/Icono";

/**
 * Full Diagnostic (Junior, 14 de noviembre de 2026): el diagnóstico completo
 * del website y de la presencia en internet de un negocio, por un solo pago.
 *
 * Es el mismo tipo de informe que las auditorías que ya hicimos (NV Labs, Sr.
 * de los Tacos): Google, Maps, la IA, el website, las redes, la competencia,
 * la seguridad y la reputación, con un plan de qué arreglar primero. Nada de
 * lo que dice esta página promete algo que ese informe no traiga.
 *
 * Al pagar, Stripe devuelve aquí con ?pagado=1 y la página lo confirma.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("diagnostic", locale);
}

/** Google, Maps, IA, website, redes, competencia, seguridad y reputación. */
const ICONOS_REVISION: IconName[] = ["buscar", "pin", "chispa", "navegador", "mensaje", "barras", "escudo", "estrella"];

const WHATSAPP = "https://wa.me/13059349981";

export default async function DiagnosticPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pagado?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { pagado } = await searchParams;
  const t = await getTranslations("diagnostic");

  const precio = usd(PRECIO_DIAGNOSTICO);
  // Solo los títulos, cada uno con su icono (Junior, 25 nov 2026: «deja solo
  // los títulos… entre más directo y simple mejor»). Los iconos van en el
  // mismo orden que los títulos de messages/*.json, diagnostic.items.
  const items = (t.raw("items") as { title: string }[]).map((item, i) => ({
    ...item,
    icono: ICONOS_REVISION[i] ?? ("check" as IconName),
  }));
  const pasos = (t.raw("steps") as { title: string }[]).map((p) =>
    p.title.replace("{price}", precio).replace("{days}", String(DIAS_DIAGNOSTICO))
  );
  const ruta = locale === "es" ? "/es/diagnostico" : "/diagnostic";

  return (
    <div className="judo-glow svc svc-websites">
      {/* ── ENTRADA: qué es, cuánto cuesta y el botón ─────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 sm:pt-20">
        {pagado === "1" && (
          <div role="status" className="svc-card mb-10 p-6 text-center sm:p-8">
            <Icono nombre="check" tamano={40} className="mx-auto text-judo-lilac" />
            <h2 className="mt-2 text-2xl font-bold">{t("doneTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-judo-fog/75">{t("doneText", { days: DIAS_DIAGNOSTICO })}</p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-semibold text-judo-lilac hover:underline">
              {t("whatsapp")} →
            </a>
          </div>
        )}

        <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <span className="svc-tag hero-in"><Icono nombre="brujula" tamano={14} /> {t("kicker")}</span>
            <h1 className="hero-in mt-4 text-4xl font-bold sm:text-5xl" style={{ animationDelay: "calc(var(--tiempo) * 1)" }}>
              {t("title")}
            </h1>
            <p className="hero-in mt-4 max-w-xl text-lg text-judo-fog/70" style={{ animationDelay: "calc(var(--tiempo) * 2)" }}>
              {t("subtitle")}
            </p>
          </div>

          <div className="svc-card hero-in p-7 text-center sm:p-8" style={{ animationDelay: "calc(var(--tiempo) * 2)" }}>
            <p className="display-num text-6xl font-bold">{precio}</p>
            <p className="mt-2 text-sm text-judo-fog/65">{t("priceNote", { days: DIAS_DIAGNOSTICO })}</p>
            <BotonDiagnostico precio={precio} className="mt-6" />
            <p className="mt-3 text-xs text-judo-fog/50">{t("secure")}</p>
          </div>
        </div>
      </section>

      {/* ── LO QUE REVISAMOS ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Reveal>
          <h2 className="text-3xl font-bold">{t("reviewTitle")}</h2>
        </Reveal>
        <div role="list" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.title} paso={i % 4} className="h-full">
              <div role="listitem" className="flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                  style={{ color: "var(--svc-luz)", background: "color-mix(in srgb, var(--svc) 16%, transparent)" }}
                >
                  <Icono nombre={item.icono} tamano={22} />
                </span>
                <span className="font-semibold leading-snug">{item.title}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── LO QUE RECIBES Y CÓMO FUNCIONA ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="svc-card h-full p-7">
              <h2 className="text-2xl font-bold">{t("getTitle")}</h2>
              <p className="mt-3 leading-relaxed text-judo-fog/75">{t("getText")}</p>
            </div>
          </Reveal>
          <Reveal paso={1}>
            <div className="svc-card h-full p-7">
              <h2 className="text-2xl font-bold">{t("stepsTitle")}</h2>
              <ol className="mt-4 space-y-4">
                {pasos.map((paso, i) => (
                  <li key={paso} className="flex items-center gap-4">
                    <span className="display-num flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "var(--svc)" }}>
                      {i + 1}
                    </span>
                    <span className="font-semibold">{paso}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CIERRE: el mismo botón otra vez ──────────────────────────── */}
      <section className="mx-auto max-w-xl px-6 pt-6 pb-24 text-center">
        <Reveal>
          <p className="display-num text-5xl font-bold">{precio}</p>
          <p className="mt-2 text-sm text-judo-fog/65">{t("priceNote", { days: DIAS_DIAGNOSTICO })}</p>
          <BotonDiagnostico precio={precio} className="mt-6" />
          <p className="mt-6">
            <Link href="/services" className="text-sm text-judo-lilac hover:underline">
              {t("back")}
            </Link>
          </p>
        </Reveal>
      </section>

      {/* El servicio con su precio, para Google y los buscadores con IA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Full Diagnostic",
            serviceType: locale === "es" ? "Diagnóstico de website y presencia en internet" : "Website and online presence diagnostic",
            description: t("subtitle"),
            url: `${SITE_URL}${ruta}`,
            areaServed: ["US", "Latin America"],
            provider: { "@type": "Organization", name: "Judo Marketing", url: SITE_URL },
            offers: {
              "@type": "Offer",
              price: String(PRECIO_DIAGNOSTICO),
              priceCurrency: "USD",
              url: `${SITE_URL}${ruta}`,
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />
    </div>
  );
}
