import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";

type Section = { title: string; description: string };

export default function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("about");

  const sections = t.raw("sections") as Section[];

  return (
    <div className="judo-glow">
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-8 text-center">
        <h1 className="hero-in text-4xl font-bold sm:text-6xl">{t("title")}</h1>
        <p
          className="hero-in mt-3 text-xl text-judo-lilac"
          style={{ animationDelay: "0.15s" }}
        >
          {t("subtitle")}
        </p>
        <p
          className="hero-in mx-auto mt-6 max-w-2xl leading-relaxed text-judo-fog/75"
          style={{ animationDelay: "0.3s" }}
        >
          {t("intro")}
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section, i) => (
            <Reveal key={section.title} delay={i * 120}>
              <TiltCard className="h-full p-7">
                <span className="text-3xl font-bold text-judo-purple/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 text-lg font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-judo-fog/65">
                  {section.description}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12 text-center">
          <Link href="/services" className="btn-primary">
            {t("cta")} →
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
