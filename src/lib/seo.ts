import type { Metadata } from "next";

/**
 * SEO por página: título único con keywords, descripción, canonical y
 * hreflang. Estrategia del dueño: la marca "Judo Marketing" siempre
 * presente para ganar la búsqueda de marca frente a los artículos sobre
 * "estrategia judo en marketing".
 */

export const SITE_URL = "https://www.judomarketing.net";

type PageKey = "services" | "about" | "contact" | "legal";

const PATHS: Record<PageKey, { en: string; es: string }> = {
  services: { en: "/services", es: "/es/servicios" },
  about: { en: "/about", es: "/es/nosotros" },
  contact: { en: "/contact", es: "/es/contacto" },
  legal: { en: "/legal", es: "/es/legal" },
};

const COPY: Record<PageKey, Record<"en" | "es", { title: string; description: string }>> = {
  services: {
    es: {
      title: "Precios: Páginas Web desde $50/mes, Apps y Tiendas Online | Judo Marketing",
      description:
        "Diseño de páginas web para negocios en Miami y toda Latinoamérica: tiendas online, páginas de citas y apps móviles desde $50 al mes con soporte, seguridad y tu propio panel de control.",
    },
    en: {
      title: "Pricing: Websites from $50/month, Apps & Online Stores | Judo Marketing",
      description:
        "Website design for small businesses in Miami and beyond: online stores, booking pages, and mobile apps from $50 a month with support, security, and your own admin panel.",
    },
  },
  about: {
    es: {
      title: "Nosotros: La Estrategia Judo Aplicada al Marketing | Judo Marketing",
      description:
        "Judo Marketing es la agencia de Miami que aplica la estrategia judo al marketing real: ayudamos a negocios pequeños a competir contra gigantes con tecnología e inteligencia artificial.",
    },
    en: {
      title: "About Us: The Judo Strategy Applied to Marketing | Judo Marketing",
      description:
        "Judo Marketing is the Miami agency that applies the judo strategy to real marketing: we help small businesses compete against giants using technology and artificial intelligence.",
    },
  },
  contact: {
    es: {
      title: "Contacto: Agenda tu Llamada o Videollamada | Judo Marketing",
      description:
        "Hablemos de tu proyecto: WhatsApp +1 305 934 9981, formulario de contacto o agenda una videollamada por Google Meet. Judo Marketing, 66 W Flagler St, Miami, FL.",
    },
    en: {
      title: "Contact: Book a Call or Google Meet | Judo Marketing",
      description:
        "Let's talk about your project: WhatsApp +1 305 934 9981, contact form, or book a Google Meet call. Judo Marketing, 66 W Flagler St, Miami, FL.",
    },
  },
  legal: {
    es: {
      title: "Términos y Política de Servicio | Judo Marketing",
      description:
        "Política de servicio, acuerdo de clientes y programa de vendedores de Judo Marketing. Transparencia total: garantía del primer mes, propiedad del código y condiciones claras.",
    },
    en: {
      title: "Service Policy & Terms | Judo Marketing",
      description:
        "Judo Marketing's service policy, client agreement, and seller program. Full transparency: first-month guarantee, code ownership, and clear conditions.",
    },
  },
};

export function pageMetadata(page: PageKey, locale: string): Metadata {
  const loc = locale === "es" ? "es" : "en";
  const { title, description } = COPY[page][loc];
  const paths = PATHS[page];
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${paths[loc]}`,
      languages: {
        en: `${SITE_URL}${paths.en}`,
        es: `${SITE_URL}${paths.es}`,
        "x-default": `${SITE_URL}${paths.en}`,
      },
    },
    openGraph: { title, description },
  };
}
