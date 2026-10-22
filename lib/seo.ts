import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://givar.app";
export const DEFAULT_DESCRIPTION = "Givar.app is the international giveaway app to create giveaway links & codes, claim cash instantly, and win dinner contests. Get your virtual account number today. Available in Nigeria, USA, UK & worldwide.";

// Cached for an hour and cleared instantly when an admin saves (revalidateTag("seo")).
export const getSeoSettings = unstable_cache(async () => prisma.seoSettings.findUnique({ where: { id: "global" } }), ["seo-settings"], { tags: ["seo"], revalidate: 3600 });
export const getSeoPage = unstable_cache(async (path: string) => prisma.seoPage.findUnique({ where: { path } }), ["seo-page"], { tags: ["seo"], revalidate: 3600 });

/** Pages an admin can edit in Admin > SEO. */
export const MANAGED_PAGES = [
  { path: "/", label: "Home", title: "Givar.app - Global Giveaway Platform | Create, Claim & Win", description: DEFAULT_DESCRIPTION, absolute: true },
  { path: "/giveaways", label: "Live giveaways", title: "Live Giveaways", description: "Browse live cash giveaways on Givar. Claim giveaways by link or code and get paid instantly.", absolute: false },
  { path: "/contests", label: "Prize contests", title: "Prize Contests", description: "Enter raffle contests on Givar and win dinners and prizes. Free and paid entries.", absolute: false },
  { path: "/auth", label: "Sign in / Sign up", title: "Create your free account", description: "Create a free Givar account to get naira and dollar account numbers, create giveaways and claim cash instantly.", absolute: false },
] as const;

const regional = (path: string) => ({ "en-NG": path, "en-US": path, "en-GB": path, "x-default": path });

/** Metadata for an indexable page: code defaults, overridden by whatever an admin saved. */
export async function pageMetadata(path: string, d: { title: string; description: string; absolute?: boolean }, extra: Metadata = {}): Promise<Metadata> {
  const [s, p] = await Promise.all([getSeoSettings().catch(() => null), getSeoPage(path).catch(() => null)]);
  const title = p?.title || d.title, description = p?.description || d.description;
  const canonical = p?.canonical || path, image = p?.ogImage || s?.ogImage;
  return {
    title: d.absolute || p?.title ? { absolute: p?.title && !d.absolute ? (s?.titleTemplate ?? "%s").replace("%s", p.title) : title } : title,
    description,
    alternates: { canonical, languages: regional(canonical) },
    robots: p?.noindex ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", title, description, url: canonical, siteName: s?.siteName ?? "Givar", ...(image ? { images: [image] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(s?.twitterHandle ? { site: s.twitterHandle } : {}), ...(image ? { images: [image] } : {}) },
    ...extra,
  };
}

/** Private or low-value areas crawlers should not spend time on. Admin > SEO > Site settings can add more. */
export const ROBOTS_DISALLOW = ["/admin", "/api/", "/account", "/wallet", "/transactions", "/dashboard", "/kyc", "/verify-phone"];
export const breadcrumb = (items: [string, string][]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${path}` })),
});
export const managed = (path: string) => MANAGED_PAGES.find((p) => p.path === path)!;
