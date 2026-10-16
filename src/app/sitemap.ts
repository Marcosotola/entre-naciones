import type { MetadataRoute } from "next";
import { getProductos } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productos = await getProductos();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...productos.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      lastModified: p.actualizado ? new Date(p.actualizado) : undefined,
      priority: 0.8,
    })),
  ];
}
