import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import PortfolioGrid from "@/components/PortfolioGrid";
import { trabajosPublicados } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";

// Se refresca solo cada dos minutos: lo que Administración active o
// deshabilite aparece o desaparece sin tener que desplegar nada.
export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata("portfolio", locale);
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const trabajos = await trabajosPublicados();

  return (
    <div className="judo-glow">
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-24">
        <div className="text-center">
          <h1 className="hero-in text-4xl font-bold sm:text-6xl">{t("title")}</h1>
          <p
            className="hero-in mx-auto mt-3 max-w-2xl text-judo-fog/70"
            style={{ animationDelay: "0.15s" }}
          >
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14">
          <PortfolioGrid trabajos={trabajos} />
        </div>

        {/* Cierre */}
        <Reveal className="mt-20">
          <div className="work-card rounded-2xl px-8 py-10 text-center">
            <h2 className="text-2xl font-bold">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-judo-fog/65">
              {t("ctaText")}
            </p>
            <Link href="/contact" className="btn-3d mt-6 inline-block px-8 py-3">
              {t("ctaButton")}
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
