import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/portal",
        "/es/admin",
        "/es/portal",
        "/api/",
        "/suspended-demo",
        "/datos",
        "/intake",
        "/es/demo-suspension",
      ],
    },
    sitemap: "https://www.judomarketing.net/sitemap.xml",
  };
}
