import { SITE_URL } from "@/lib/seo";

/**
 * Datos estructurados (schema.org) para Google.
 * Le dicen a Google que "Judo Marketing" es un NEGOCIO real de Miami con
 * dirección, teléfono, precios y servicios, la ventaja decisiva sobre los
 * artículos genéricos de "estrategia judo en marketing" que hoy dominan
 * la búsqueda de marca.
 */

export default function JsonLd({ locale }: { locale: string }) {
  const es = locale === "es";
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: "Judo Marketing",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-white-transparent.png`,
      image: `${SITE_URL}/brand/og-thumbnail.jpg`,
      telephone: "+13059349981",
      email: "admin@judomarketing.net",
      slogan: "Build Trust, Create Value",
      description: es
        ? "Agencia de diseño de páginas web, apps móviles y marketing con inteligencia artificial en Miami. Websites por suscripción desde $50 al mes para negocios pequeños y medianos."
        : "Website design, mobile app, and AI-powered marketing agency in Miami. Subscription websites from $50 a month for small and medium businesses.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "66 W Flagler St Suite 900 PMB 11674",
        addressLocality: "Miami",
        addressRegion: "FL",
        postalCode: "33130",
        addressCountry: "US",
      },
      geo: { "@type": "GeoCoordinates", latitude: 25.7743, longitude: -80.1937 },
      priceRange: "$50 - $150",
      currenciesAccepted: "USD",
      // Mismo negocio en Google, Instagram y Facebook (amarra la identidad)
      sameAs: [
        "https://share.google/L4AqIiUXUBUE9Oav6",
        "https://www.instagram.com/judo.marketing/",
        "https://www.facebook.com/Judomarketi/",
      ],
      knowsLanguage: ["es", "en"],
      areaServed: ["Miami", "Florida", "United States", "Latin America"],
      makesOffer: [
        {
          "@type": "Offer",
          name: es ? "Websites Esenciales" : "Essential Websites",
          description: es
            ? "Tiendas online, páginas de citas y venta de servicios con diseño moderno y panel propio."
            : "Online stores, booking pages, and service sales with modern design and your own panel.",
          price: "50",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: es ? "Websites Complejos" : "Complex Websites",
          description: es
            ? "Delivery, logística, clases virtuales e integraciones personalizadas."
            : "Delivery, logistics, virtual classes, and custom integrations.",
          price: "100",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: es ? "Apps para Teléfonos" : "Mobile Apps",
          description: es
            ? "Aplicaciones nativas iOS y Android con notificaciones push."
            : "Native iOS and Android apps with push notifications.",
          price: "150",
          priceCurrency: "USD",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Judo Marketing",
      inLanguage: es ? "es" : "en",
      publisher: { "@id": `${SITE_URL}/#business` },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
