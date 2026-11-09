import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/collections",
  "/about",
  "/contact",
  "/privacy-policy",
  "/shipping-policy",
  "/return-policy",
];

async function fetchSlugs(path: string): Promise<string[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  try {
    const response = await fetch(`${apiUrl}${path}`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = await response.json();
    const results = Array.isArray(data) ? data : (data.results ?? []);
    return results.map((item: { slug: string }) => item.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, collectionSlugs] = await Promise.all([
    fetchSlugs("/products/?page_size=48"),
    fetchSlugs("/collections/"),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route}`,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...collectionSlugs.map((slug) => ({
      url: `${SITE_URL}/collections/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productSlugs.map((slug) => ({
      url: `${SITE_URL}/products/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
