import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import TiltCard from "@/components/TiltCard";
import { RegisterForm } from "@/components/AuthForms";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("auth");

  return (
    <div className="judo-glow">
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
        <div className="text-center">
          <h1 className="hero-in text-4xl font-bold">{t("registerTitle")}</h1>
          <p className="hero-in mt-2 text-judo-fog/60" style={{ animationDelay: "0.15s" }}>
            {t("registerSubtitle")}
          </p>
        </div>
        <TiltCard className="mt-8 p-7">
          <RegisterForm />
        </TiltCard>
      </section>
    </div>
  );
}
