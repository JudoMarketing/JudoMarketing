import type { MetadataRoute } from "next";

const BASE = "https://www.judomarketing.net";

/** Mapa del sitio bilingüe con alternates hreflang (base del SEO). */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { es: string; en: string; priority: number }[] = [
    { es: "/es", en: "/en", priority: 1 },
    { es: "/es/servicios", en: "/en/services", priority: 0.9 },
    { es: "/es/nosotros", en: "/en/about", priority: 0.8 },
    { es: "/es/contacto", en: "/en/contact", priority: 0.8 },
    { es: "/es/legal", en: "/en/legal", priority: 0.3 },
  ];

  return routes.flatMap(({ es, en, priority }) =>
    [es, en].map((path) => ({
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
