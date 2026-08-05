import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/es/admin", "/en/admin", "/es/portal", "/en/portal", "/api/"],
    },
    sitemap: "https://www.judomarketing.net/sitemap.xml",
  };
}
