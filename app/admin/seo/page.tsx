import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MANAGED_PAGES, SITE } from "@/lib/seo";
import { Card, PageHead, Pill, Stat } from "@/components/admin/ui";
import SeoTabs from "@/components/admin/SeoTabs";

export const metadata = { title: "SEO tools" };
export const dynamic = "force-dynamic";

export default async function SeoOverview() {
  const [s, pages, liveGiveaways, openContests] = await Promise.all([
    prisma.seoSettings.findUnique({ where: { id: "global" } }), prisma.seoPage.findMany(),
    prisma.giveaway.count({ where: { flagged: false, expiresAt: { gt: new Date() } } }), prisma.contest.count({ where: { drawnAt: null } }),
  ]);
  const checks: [boolean, string, string][] = [
    [!!s?.googleVerification, "Google Search Console verification tag added", "/admin/seo/settings"], [!!s?.bingVerification, "Bing Webmaster verification tag added", "/admin/seo/settings"],
    [!!s?.ogImage, "Default social share image set", "/admin/seo/settings"], [!!s?.twitterHandle, "Twitter / X handle set", "/admin/seo/settings"], [!!s?.sameAs, "Social profile links added (helps Google link your brand)", "/admin/seo/settings"],
    [!!s?.defaultDescription, "Site-wide default description customised", "/admin/seo/settings"],
  ];
  const done = checks.filter((c) => c[0]).length;
  return (
    <>
      <PageHead title="SEO tools" desc="Control how Givar appears in Google, Bing and when links are shared." />
      <SeoTabs active="/admin/seo" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Setup checklist" value={`${done}/${checks.length}`} tone={done === checks.length ? "brand" : undefined} sub="Open Site settings" href="/admin/seo/settings" />
        <Stat label="Pages with custom SEO" value={`${pages.length}/${MANAGED_PAGES.length}`} href="/admin/seo/pages" /><Stat label="Live giveaways in sitemap" value={String(liveGiveaways)} /><Stat label="Open contests in sitemap" value={String(openContests)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Setup checklist"><ul className="space-y-2.5 text-sm">{checks.map(([ok, t, h]) => <li key={t} className="flex items-center justify-between gap-3"><span>{t}</span>{ok ? <Pill tone="ok">done</Pill> : <Link href={h}><Pill>to do →</Pill></Link>}</li>)}</ul></Card>
        <Card title="Pages"><ul className="divide-y divide-[var(--line)] text-sm">{MANAGED_PAGES.map((p) => { const c = pages.find((x) => x.path === p.path); return <li key={p.path}><Link href={`/admin/seo/pages?path=${encodeURIComponent(p.path)}`} className="flex items-center justify-between gap-3 py-2.5"><span>{p.label} <span className="text-[var(--mut)]">{p.path}</span></span>{c?.noindex ? <Pill tone="bad">noindex</Pill> : c ? <Pill tone="ok">customised</Pill> : <Pill>default</Pill>}</Link></li>; })}</ul></Card>
        <Card title="Quick links"><ul className="space-y-2 text-sm underline-offset-2"><li><a className="hover:underline" href="/sitemap.xml" target="_blank" rel="noreferrer">sitemap.xml</a> (updates itself)</li><li><a className="hover:underline" href="/robots.txt" target="_blank" rel="noreferrer">robots.txt</a></li><li><a className="hover:underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Google Search Console</a></li><li><a className="hover:underline" href="https://www.bing.com/webmasters" target="_blank" rel="noreferrer">Bing Webmaster Tools</a></li><li><a className="hover:underline" href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer">PageSpeed Insights</a></li></ul></Card>
        <Card title="Do these once, outside the app"><ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--mut)]"><li>Add {SITE} to Google Search Console (paste the verification code in Site settings).</li><li>Submit {SITE}/sitemap.xml in Search Console and Bing.</li><li>Run the SEO audit, fix the warnings, and run it again.</li><li>Share giveaways on WhatsApp, X and Telegram regularly: links and mentions are what lift rankings.</li></ol></Card>
      </div>
    </>
  );
}
