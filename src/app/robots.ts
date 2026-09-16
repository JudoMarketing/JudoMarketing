import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/es/admin",
        "/api/",
        // El portal de clientes (JuditoADS) es privado: nada que indexar
        "/juditoads/app",
        "/juditoads/api/",
        "/suspended-demo",
        "/intake",
        "/es/demo-suspension",
        // Enlaces de aceptación de contratos: privados, uno por cliente
        "/acepto/",
        "/es/acepto/",
      ],
    },
    sitemap: "https://www.judomarketing.net/sitemap.xml",
  };
}
