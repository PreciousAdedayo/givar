import { prisma } from "@/lib/prisma";
import { DEFAULT_DESCRIPTION, ROBOTS_DISALLOW, SITE } from "@/lib/seo";
import { Card, PageHead, btnCls, inputCls } from "@/components/admin/ui";
import SeoTabs from "@/components/admin/SeoTabs";
import { saveSeoSettings } from "../../actions";

export const metadata = { title: "SEO settings" };
export const dynamic = "force-dynamic";
const F = ({ t, hint, children }: { t: string; hint?: string; children: React.ReactNode }) => <label className="block text-sm font-medium">{t}<div className="mt-1">{children}</div>{hint && <span className="mt-1 block text-xs font-normal text-[var(--mut)]">{hint}</span>}</label>;

export default async function SeoSettingsPage({ searchParams }: { searchParams: { saved?: string; err?: string } }) {
  const s = await prisma.seoSettings.findUnique({ where: { id: "global" } });
  const disallow = [...ROBOTS_DISALLOW, ...(s?.robotsExtra?.split("\n") ?? [])];
  return (
    <>
      <PageHead title="Site SEO settings" desc="Applies to the whole website." />
      <SeoTabs active="/admin/seo/settings" />
      {searchParams.saved && <p role="status" className="grad-soft mb-4 rounded-xl p-3 text-sm">Saved. The change is live.</p>}
      {searchParams.err && <p role="alert" className="mb-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-500">The title template must contain %s where the page title goes.</p>}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <form action={saveSeoSettings} className="glass space-y-4 rounded-2xl p-5">
          <F t="Site name"><input name="siteName" defaultValue={s?.siteName ?? "Givar"} className={inputCls} /></F>
          <F t="Title template" hint="%s is replaced by each page's title. Example result: “Live Giveaways | Givar.app - Global Giveaway Platform”"><input name="titleTemplate" defaultValue={s?.titleTemplate ?? "%s | Givar.app - Global Giveaway Platform"} className={inputCls} /></F>
          <F t="Default description" hint="Used by pages that don't have their own."><textarea name="defaultDescription" rows={3} maxLength={320} defaultValue={s?.defaultDescription ?? ""} placeholder={DEFAULT_DESCRIPTION} className={inputCls} /></F>
          <F t="Default social share image URL" hint="1200×630 picture shown when links are shared. Blank uses the generated Givar image."><input name="ogImage" defaultValue={s?.ogImage ?? ""} placeholder="https://…" className={inputCls} /></F>
          <F t="Twitter / X handle"><input name="twitterHandle" defaultValue={s?.twitterHandle ?? ""} placeholder="@givarapp" className={inputCls} /></F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F t="Google Search Console code" hint="The content value of Google's verification meta tag."><input name="googleVerification" defaultValue={s?.googleVerification ?? ""} className={inputCls} /></F>
            <F t="Bing Webmaster code" hint="The content value of Bing's msvalidate.01 tag."><input name="bingVerification" defaultValue={s?.bingVerification ?? ""} className={inputCls} /></F>
          </div>
          <F t="Social profile links (one per line)" hint="Used in structured data so Google connects your accounts to Givar. https:// only."><textarea name="sameAs" rows={3} defaultValue={s?.sameAs ?? ""} placeholder={"https://x.com/givarapp\nhttps://instagram.com/givarapp"} className={inputCls} /></F>
          <F t="Extra paths to hide from search engines (one per line)" hint="Each must start with /. Adds to the built-in rules shown on the right."><textarea name="robotsExtra" rows={3} defaultValue={s?.robotsExtra ?? ""} placeholder="/private-page" className={inputCls} /></F>
          <button className={btnCls}>Save settings</button>
        </form>
        <Card title="robots.txt (live preview)"><pre className="overflow-x-auto whitespace-pre-wrap text-xs text-[var(--mut)]">{`User-agent: *\nAllow: /\n${disallow.map((d) => `Disallow: ${d}`).join("\n")}\n\nSitemap: ${SITE}/sitemap.xml`}</pre></Card>
      </div>
    </>
  );
}
