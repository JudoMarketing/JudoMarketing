import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();

  const plans = ["essential", "complex", "apps"] as const;

  return (
    <div className="judo-glow">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-16 text-center">
        <p className="mb-4 rounded-full border border-judo-lilac/40 px-4 py-1 text-sm text-judo-lilac">
          {t("hero.kicker")}
        </p>
        <h1 className="text-5xl font-bold leading-tight sm:text-7xl">
          {t("hero.title")}
          <br />
          <span className="bg-gradient-to-r from-judo-purple to-judo-lilac bg-clip-text text-transparent">
            {t("hero.titleAccent")}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-judo-fog/70">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="mailto:admin@judomarketing.net"
            className="rounded-full bg-judo-purple px-8 py-3 font-semibold text-white transition hover:bg-judo-lilac"
          >
            {t("hero.ctaPrimary")} →
          </a>
          <Link
            href="/"
            className="rounded-full border border-judo-purple px-8 py-3 font-semibold text-judo-lilac transition hover:bg-judo-purple/10"
          >
            {t("hero.ctaSecondary")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-semibold">
          {t("plans.title")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan} className="judo-card p-6">
              <h3 className="text-lg font-semibold">{t(`plans.${plan}.name`)}</h3>
              <p className="mt-1 font-bold text-judo-lilac">
                {t(`plans.${plan}.price`)}
              </p>
              <p className="mt-3 text-sm text-judo-fog/70">
                {t(`plans.${plan}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
