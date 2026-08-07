import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";
import PortfolioGrid from "./PortfolioGrid";
import { trabajosPublicados } from "@/lib/portfolio";

/**
 * Adelanto del portafolio en el home: los tres websites más recientes que
 * estén activos. Si todavía no hay ninguno, la sección no se muestra.
 */
export default async function PortfolioTeaser({ locale }: { locale: string }) {
  const trabajos = await trabajosPublicados();
  if (trabajos.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "portfolioHome" });

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <Reveal className="text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("title")}</h2>
        <p className="mt-2 text-judo-fog/60">{t("subtitle")}</p>
      </Reveal>
      <div className="mt-12">
        <PortfolioGrid trabajos={trabajos} limite={3} conFiltro={false} />
      </div>
      <Reveal className="mt-10 text-center">
        <Link
          href="/portfolio"
          className="text-sm font-semibold text-judo-lilac transition hover:text-judo-fog"
        >
          {t("link")} →
        </Link>
      </Reveal>
    </section>
  );
}
