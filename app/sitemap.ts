import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/seo";

type Item = MetadataRoute.Sitemap[number];
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [hidden, giveaways, contests] = await Promise.all([
    prisma.seoPage.findMany({ where: { noindex: true }, select: { path: true } }).catch(() => []),
    prisma.giveaway.findMany({ where: { flagged: false, expiresAt: { gt: now }, winnersLeft: { gt: 0 } }, select: { claimSlug: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5000 }).catch(() => []),
    prisma.contest.findMany({ where: { drawnAt: null, endsAt: { gt: now } }, select: { id: true, createdAt: true }, take: 2000 }).catch(() => []),
  ]);
  const off = new Set(hidden.map((h) => h.path));
  const statics: [string, Item["changeFrequency"], number][] = [["/", "daily", 1], ["/giveaways", "hourly", 0.9], ["/contests", "daily", 0.8], ["/auth", "monthly", 0.4]];
  return [
    ...statics.filter(([p]) => !off.has(p)).map(([p, f, priority]) => ({ url: `${SITE}${p === "/" ? "" : p}`, lastModified: now, changeFrequency: f, priority })),
    ...giveaways.map((g) => ({ url: `${SITE}/c/${g.claimSlug}`, lastModified: g.createdAt, changeFrequency: "hourly" as const, priority: 0.7 })),
    ...contests.map((c) => ({ url: `${SITE}/contests/${c.id}`, lastModified: c.createdAt, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}
