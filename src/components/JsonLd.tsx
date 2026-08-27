import { SITE_URL } from "@/lib/seo";
import { PERFIL_GOOGLE } from "./SocialLinks";
import { precio, precioDesde, precioTexto, PRECIO_JUDITOADS, PRECIO_ASISTENTE } from "@/lib/pricing";

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
        ? `Agencia de diseño de páginas web, apps móviles y marketing con inteligencia artificial en Miami. Websites por suscripción desde ${precioDesde()} al mes para negocios pequeños y medianos.`
        : `Website design, mobile app, and AI-powered marketing agency in Miami. Subscription websites from ${precioDesde()} a month for small and medium businesses.`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "66 W Flagler St Suite 900 PMB 11674",
        addressLocality: "Miami",
        addressRegion: "FL",
        postalCode: "33130",
        addressCountry: "US",
      },
      geo: { "@type": "GeoCoordinates", latitude: 25.7743, longitude: -80.1937 },
      priceRange: `${precioTexto("essential")} - ${precioTexto("apps")}`,
      currenciesAccepted: "USD",
      // Mismo negocio en Google, Instagram y Facebook (amarra la identidad)
      sameAs: [
        PERFIL_GOOGLE,
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
          price: String(precio("essential")),
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: es ? "Websites Complejos" : "Complex Websites",
          description: es
            ? "Delivery, logística, clases virtuales e integraciones personalizadas."
            : "Delivery, logistics, virtual classes, and custom integrations.",
          price: String(precio("complex")),
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: es ? "Apps para Teléfonos" : "Mobile Apps",
          description: es
            ? "Aplicaciones nativas iOS y Android con notificaciones push."
            : "Native iOS and Android apps with push notifications.",
          price: String(precio("apps")),
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "JuditoADS",
          description: es
            ? "Plataforma para lanzar tu propia publicidad en Facebook e Instagram con estrategia guiada, métricas en vivo y reportes PDF. Pruébala gratis."
            : "Platform to run your own Facebook and Instagram ads with guided strategy, live metrics, and PDF reports. Try it free.",
          price: String(PRECIO_JUDITOADS),
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "AI Assistants",
          description: es
            ? "Asistentes con inteligencia artificial que atienden a tus clientes en Instagram, Facebook y tu website, a toda hora."
            : "AI assistants that answer your customers on Instagram, Facebook, and your website, around the clock.",
          price: String(PRECIO_ASISTENTE),
          priceCurrency: "USD",
        },
      ],
    },
    // JuditoADS como producto de software con nombre propio: es lo que puede
    // salir en Google cuando alguien busca herramientas de publicidad
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/juditoads#app`,
      name: "JuditoADS",
      url: `${SITE_URL}/juditoads`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: es
        ? "Administrador de anuncios para pequeños negocios: conecta tu cuenta de Meta, sube tus fotos y lanza tu publicidad en Facebook e Instagram tú mismo, con estrategia guiada, métricas en tiempo real y reportes PDF."
        : "Ads manager for small businesses: connect your Meta account, upload your photos, and run your own Facebook and Instagram ads with guided strategy, real-time metrics, and PDF reports.",
      offers: {
        "@type": "Offer",
        price: String(PRECIO_JUDITOADS),
        priceCurrency: "USD",
        description: es ? "Pruébalo gratis" : "Try for free",
      },
      publisher: { "@id": `${SITE_URL}/#business` },
      inLanguage: ["es", "en"],
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
