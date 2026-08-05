import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LightLines from "@/components/LightLines";
import Mascot from "@/components/Mascot";
import JsonLd from "@/components/JsonLd";
import "../globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL("https://www.judomarketing.net"),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "es" ? "/es" : "/",
      languages: { en: "/", es: "/es", "x-default": "/" },
    },
    icons: { icon: "/brand/logo-black.jpg" },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://www.judomarketing.net",
      siteName: "Judo Marketing",
      images: [{ url: "/brand/og-thumbnail.png", width: 1536, height: 1024 }],
      locale: locale === "es" ? "es_US" : "en_US",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={poppins.variable}>
      <body className="min-h-screen antialiased">
        <JsonLd locale={locale} />
        <NextIntlClientProvider>
          <LightLines />
          <div className="relative z-10">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
          <Mascot />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
