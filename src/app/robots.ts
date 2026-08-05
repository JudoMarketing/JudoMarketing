import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/portal",
        "/en/admin",
        "/en/portal",
        "/api/",
        "/demo-suspension",
        "/en/suspended-demo",
      ],
    },
    sitemap: "https://www.judomarketing.net/sitemap.xml",
  };
}
