import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("login");

  const portals = ["clients", "sellers"] as const;

  return (
    <div className="judo-glow">
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-20 text-center">
        <h1 className="hero-in text-4xl font-bold sm:text-5xl">{t("title")}</h1>
        <p
          className="hero-in mt-3 text-judo-fog/70"
          style={{ animationDelay: "0.15s" }}
        >
          {t("subtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {portals.map((portal, i) => (
            <Reveal key={portal} delay={i * 120}>
              <TiltCard className="h-full p-8">
                <span className="rounded-full border border-judo-lilac/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-judo-lilac">
                  {t("soon")}
                </span>
                <h2 className="mt-4 text-xl font-semibold">
                  {t(`${portal}.title`)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/65">
                  {t(`${portal}.description`)}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
        <Link
          href="/"
          className="mx-auto mt-10 text-sm text-judo-lilac hover:underline"
        >
          ← {t("back")}
        </Link>
      </section>
    </div>
  );
}
