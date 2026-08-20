import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_BASE_URL || "https://your-app.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/admin-claim", "/api", "/renter", "/review"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
