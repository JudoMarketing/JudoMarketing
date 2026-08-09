import type { Metadata } from "next";
import { precioDesde } from "@/lib/pricing";
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
import ChunkGuard from "@/components/ChunkGuard";
import ServiceWorkerPurge from "@/components/ServiceWorkerPurge";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
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
  const descripcion = t("description", { price: precioDesde() });

  return {
    metadataBase: new URL("https://www.judomarketing.net"),
    title: t("title"),
    description: descripcion,
    alternates: {
      canonical: locale === "es" ? "/es" : "/",
      languages: { en: "/", es: "/es", "x-default": "/" },
    },
    icons: { icon: "/brand/logo-black.jpg" },
    openGraph: {
      title: t("title"),
      description: descripcion,
      url: "https://www.judomarketing.net",
      siteName: "Judo Marketing",
      images: [{ url: "/brand/og-thumbnail.jpg", width: 1200, height: 800 }],
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
        <ChunkGuard />
        <ServiceWorkerPurge />
        <NextIntlClientProvider>
          <LightLines />
          <div className="relative z-10">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
          <Mascot />
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
