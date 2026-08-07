import type { MetadataRoute } from "next";

const BASE = "https://www.judomarketing.net";

/** Mapa del sitio bilingüe: inglés sin prefijo, español bajo /es. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { es: string; en: string; priority: number }[] = [
    { en: "/", es: "/es", priority: 1 },
    { en: "/services", es: "/es/servicios", priority: 0.9 },
    { en: "/showcase", es: "/es/showcase", priority: 0.8 },
    { en: "/about", es: "/es/nosotros", priority: 0.8 },
    { en: "/contact", es: "/es/contacto", priority: 0.8 },
    { en: "/legal", es: "/es/legal", priority: 0.3 },
  ];

  return routes.flatMap(({ es, en, priority }) =>
    [en, es].map((path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority,
      alternates: {
        languages: { es: `${BASE}${es}`, en: `${BASE}${en}` },
      },
    }))
  );
}
