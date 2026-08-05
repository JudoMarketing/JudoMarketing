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
    "/register": { es: "/registro", en: "/register" },
    "/portal": "/portal",
    "/admin": "/admin",
  },
});
