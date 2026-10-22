import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW, SITE, getSeoSettings } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSeoSettings().catch(() => null);
  const extra = (s?.robotsExtra ?? "").split("\n").map((l) => l.trim()).filter((l) => l.startsWith("/"));
  return { rules: [{ userAgent: "*", allow: "/", disallow: [...ROBOTS_DISALLOW, ...extra] }], sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
