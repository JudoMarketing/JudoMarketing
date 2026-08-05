import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  pathnames: {
    "/": "/",
    "/services": { es: "/servicios", en: "/services" },
    "/about": { es: "/nosotros", en: "/about" },
    "/contact": { es: "/contacto", en: "/contact" },
    "/legal": "/legal",
    "/login": "/login",
    "/forgot": { es: "/recuperar", en: "/forgot" },
    "/reset": "/reset",
    "/register": { es: "/registro", en: "/register" },
    "/portal": "/portal",
    "/admin": "/admin",
    "/pay": { es: "/pagar", en: "/pay" },
    "/suspended-demo": { es: "/demo-suspension", en: "/suspended-demo" },
  },
});
