import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "en",
  // El inglés (idioma por defecto) vive SIN prefijo: www.judomarketing.net
  // sirve directo; solo el español usa /es
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/services": { es: "/servicios", en: "/services" },
    "/showcase": "/showcase",
    "/intake": "/intake",
    "/about": { es: "/nosotros", en: "/about" },
    "/contact": { es: "/contacto", en: "/contact" },
    "/legal": "/legal",
    "/admin": "/admin",
    "/pay": { es: "/pagar", en: "/pay" },
    "/suspended-demo": { es: "/demo-suspension", en: "/suspended-demo" },
  },
});
