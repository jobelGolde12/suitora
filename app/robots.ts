import type { MetadataRoute } from "next";

const APP_URL = "https://suitora.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/register", "/forgot-password", "/dashboard"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
