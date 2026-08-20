import { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase";
import { slugifyArea } from "@/lib/areaSlug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_BASE_URL || "https://your-app.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const supabase = supabaseServer();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, area, updated_at")
    .eq("status", "available");

  const propertyPages: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
    url: `${baseUrl}/properties/${p.id}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const uniqueAreas = Array.from(new Set((properties ?? []).map((p) => p.area).filter(Boolean)));
  const areaPages: MetadataRoute.Sitemap = uniqueAreas.map((area) => ({
    url: `${baseUrl}/areas/${slugifyArea(area as string)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...propertyPages, ...areaPages];
}
