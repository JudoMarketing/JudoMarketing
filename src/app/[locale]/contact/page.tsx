import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import TiltCard from "@/components/TiltCard";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";

export default function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("contact");

  const channels = [
    {
      icon: "💬",
      title: t("whatsapp"),
      desc: t("whatsappDesc"),
      href: "https://wa.me/13059349981",
    },
    {
      icon: "📞",
      title: t("call"),
      desc: t("callDesc"),
      href: "tel:+13059349981",
    },
    {
      icon: "✉️",
      title: t("emailTitle"),
      desc: t("emailDesc"),
      href: "mailto:admin@judomarketing.net",
    },
    {
      icon: "📍",
      title: t("addressTitle"),
      desc: "66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130",
      href: "https://maps.google.com/?q=66+W+Flagler+St+Suite+900+PMB+11674,+Miami,+FL+33130",
      linkLabel: t("maps"),
    },
  ];

  return (
    <div className="judo-glow">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="text-center">
          <h1 className="hero-in text-4xl font-bold sm:text-6xl">{t("title")}</h1>
          <p
            className="hero-in mt-3 text-judo-fog/70"
            style={{ animationDelay: "0.15s" }}
          >
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Formulario */}
          <Reveal className="lg:col-span-3">
            <TiltCard className="p-7 sm:p-9">
              <ContactForm />
            </TiltCard>
          </Reveal>

          {/* Canales */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {channels.map((channel, i) => (
              <Reveal key={channel.title} delay={i * 100}>
                <a
                  href={channel.href}
                  target={channel.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="block"
                >
                  <TiltCard className="flex items-center gap-4 p-5">
                    <span className="text-2xl">{channel.icon}</span>
                    <span>
                      <span className="block font-semibold">{channel.title}</span>
                      <span className="block text-sm text-judo-fog/60">
                        {channel.desc}
                      </span>
                      {"linkLabel" in channel && channel.linkLabel && (
                        <span className="mt-1 block text-sm font-semibold text-judo-lilac">
                          {channel.linkLabel} →
                        </span>
                      )}
                    </span>
                  </TiltCard>
                </a>
              </Reveal>
            ))}
            <Reveal delay={400}>
              <p className="px-2 text-center text-sm text-judo-fog/50">
                {t("chatSoon")}
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
