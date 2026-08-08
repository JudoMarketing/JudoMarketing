import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TiltCard from "@/components/TiltCard";
import IntakeForm from "@/components/IntakeForm";

/**
 * La página que el dueño le comparte a un cliente nuevo para que entregue
 * sus datos de una sola vez. No se indexa: es un enlace de trabajo, no una
 * página de venta.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "intake" });
  return {
    title: `${t("title")} | Judo Marketing`,
    description: t("subtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "intake" });

  return (
    <div className="judo-glow">
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-24">
        <div className="text-center">
          <h1 className="hero-in text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p
            className="hero-in mx-auto mt-3 max-w-xl text-judo-fog/70"
            style={{ animationDelay: "0.15s" }}
          >
            {t("subtitle")}
          </p>
          <p
            className="hero-in mt-2 text-sm text-judo-fog/45"
            style={{ animationDelay: "0.25s" }}
          >
            {t("time")}
          </p>
        </div>

        <TiltCard className="mt-10 p-6 sm:p-9">
          <IntakeForm />
        </TiltCard>
      </section>
    </div>
  );
}
