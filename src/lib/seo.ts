import { precioDesde } from "./pricing";
import type { Metadata } from "next";

/**
 * SEO por página: título único con keywords, descripción, canonical y
 * hreflang. Estrategia del dueño: la marca "Judo Marketing" siempre
 * presente para ganar la búsqueda de marca frente a los artículos sobre
 * "estrategia judo en marketing".
 */

export const SITE_URL = "https://www.judomarketing.net";

type PageKey = "services" | "showcase" | "about" | "contact" | "legal";

const PATHS: Record<PageKey, { en: string; es: string }> = {
  services: { en: "/services", es: "/es/servicios" },
  showcase: { en: "/showcase", es: "/es/showcase" },
  about: { en: "/about", es: "/es/nosotros" },
  contact: { en: "/contact", es: "/es/contacto" },
  legal: { en: "/legal", es: "/es/legal" },
};

const COPY: Record<PageKey, Record<"en" | "es", { title: string; description: string }>> = {
  services: {
    es: {
      title: `Páginas Web desde ${precioDesde()}/mes y Publicidad en Facebook e Instagram | Judo Marketing`,
      description:
        `Páginas web para negocios desde ${precioDesde()} al mes, publicidad en Facebook e Instagram con JuditoADS ($20/mes, pruébalo gratis) y asistentes con IA que atienden a tus clientes. Miami y toda Latinoamérica.`,
    },
    en: {
      title: `Websites from ${precioDesde()}/month & Facebook and Instagram Ads | Judo Marketing`,
      description:
        `Business websites from ${precioDesde()} a month, Facebook and Instagram advertising with JuditoADS ($20/mo, try it free), and AI assistants that answer your customers. Miami and beyond.`,
    },
  },
  showcase: {
    es: {
      title: "Showcase: Páginas Web que Hemos Hecho en Miami | Judo Marketing",
      description:
        "Mira páginas web reales hechas por Judo Marketing en Miami: tiendas online, apps de delivery y sitios de servicios. Entra a cada una y compruébalo tú mismo.",
    },
    en: {
      title: "Showcase: Websites We've Built in Miami | Judo Marketing",
      description:
        "See real websites built by Judo Marketing in Miami: online stores, delivery apps, and service sites. Open each one and judge for yourself.",
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
        "Política de servicio y acuerdo de clientes de Judo Marketing. Transparencia total: garantía del primer mes, propiedad del código y condiciones claras.",
    },
    en: {
      title: "Service Policy & Terms | Judo Marketing",
      description:
        "Judo Marketing's service policy and client agreement. Full transparency: first-month guarantee, code ownership, and clear conditions.",
    },
  },
};

/**
 * Keywords de la página de servicios. Google ya no lee la etiqueta keywords
 * para posicionar, pero Bing sí la considera y a los dos les sirve que estos
 * términos existan de verdad en el texto de la página — que es donde también
 * están. La lista completa, con hashtags e intereses de Meta, vive en
 * docs/juditoads-keywords.md.
 */
const KEYWORDS_SERVICIOS: Record<"en" | "es", string[]> = {
  es: [
    "publicidad en facebook e instagram",
    "como hacer publicidad en instagram",
    "anuncios en redes sociales para negocios",
    "administrador de anuncios facil",
    "meta ads para pequeños negocios",
    "publicidad digital para restaurantes",
    "diseño de paginas web miami",
    "paginas web por suscripcion",
    "asistente con inteligencia artificial para negocios",
    "chatbot para instagram y facebook",
  ],
  en: [
    "facebook and instagram ads for small business",
    "easy ads manager",
    "social media advertising tool",
    "run your own facebook ads",
    "meta ads for restaurants",
    "website design miami",
    "subscription website design",
    "ai assistant for small business",
    "chatbot for instagram and facebook",
  ],
};

export function pageMetadata(page: PageKey, locale: string): Metadata {
  const loc = locale === "es" ? "es" : "en";
  const { title, description } = COPY[page][loc];
  const paths = PATHS[page];
  return {
    title,
    description,
    ...(page === "services" ? { keywords: KEYWORDS_SERVICIOS[loc] } : {}),
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
