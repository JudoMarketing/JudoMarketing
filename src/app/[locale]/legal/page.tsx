import { setRequestLocale } from "next-intl/server";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { policyContent } from "@/content/service-policy";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata("legal", locale);
}

export default function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("legal");
  const activeLocale = useLocale() as "es" | "en";
  const content = policyContent[activeLocale];

  const downloads = [
    { label: t("policyPdf"), file: "/legal/Service_Policy_and_Terms.pdf" },
    { label: t("clientPdf"), file: "/legal/Acuerdo_de_Servicio_Cliente.pdf" },
  ];

  return (
    <div className="judo-glow">
      {/* Panel sólido: las líneas animadas molestan al leer texto largo */}
      <section className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:px-6 sm:pt-16">
        <div className="rounded-2xl border border-judo-lilac/15 bg-[#0e0e16] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-10">
        <h1 className="text-3xl font-bold sm:text-5xl">{t("title")}</h1>
        <p className="mt-2 text-judo-fog/60">{t("subtitle")}</p>
        <p className="mt-1 text-sm text-judo-lilac">{content.effective}</p>

        {activeLocale === "es" && (
          <p className="mt-4 rounded-xl border border-judo-lilac/25 bg-judo-surface/70 px-4 py-3 text-sm text-judo-fog/70">
            {t("officialNote")}
          </p>
        )}

        <div className="mt-6 rounded-xl border border-judo-lilac/20 bg-judo-surface/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-judo-lilac">
            {t("downloads")}
          </h2>
          <ul className="mt-3 space-y-2">
            {downloads.map((d) => (
              <li key={d.file}>
                <a
                  href={d.file}
                  download
                  className="text-sm text-judo-fog/80 underline-offset-4 transition hover:text-judo-lilac hover:underline"
                >
                  ⬇ {d.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 space-y-8">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-judo-lilac">
                {section.title}
              </h2>
              {section.body.map((paragraph, i) => (
                <p
                  key={i}
                  className={`mt-2 text-sm leading-relaxed text-judo-fog/75 ${
                    paragraph.startsWith("•") ? "pl-4" : ""
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
