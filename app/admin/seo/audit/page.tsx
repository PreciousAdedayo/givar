import { headers } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auditPath, fileCheck } from "@/lib/seo-audit";
import { Card, PageHead, Pill, btnCls, inputCls } from "@/components/admin/ui";
import SeoTabs from "@/components/admin/SeoTabs";

export const metadata = { title: "SEO audit" };
export const dynamic = "force-dynamic";

export default async function Audit({ searchParams }: { searchParams: { run?: string; scope?: string; path?: string } }) {
  const h = headers(); const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  let paths: string[] = [];
  if (searchParams.run) {
    if (searchParams.scope === "custom" && searchParams.path?.startsWith("/")) paths = [searchParams.path.slice(0, 200)];
    else {
      paths = ["/", "/giveaways", "/contests", "/auth"];
      if (searchParams.scope === "all") {
        const [g, c] = await Promise.all([prisma.giveaway.findMany({ where: { flagged: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 3, select: { claimSlug: true } }), prisma.contest.findMany({ where: { drawnAt: null }, take: 2, select: { id: true } })]);
        paths.push(...g.map((x) => `/c/${x.claimSlug}`), ...c.map((x) => `/contests/${x.id}`));
      }
    }
  }
  const [results, robots, sitemap] = searchParams.run ? await Promise.all([Promise.all(paths.map((p) => auditPath(base, p))), fileCheck(base, "/robots.txt"), fileCheck(base, "/sitemap.xml")]) : [[], null, null];
  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
  const tone = (n: number) => (n >= 85 ? "ok" : n >= 60 ? "mute" : "bad") as "ok" | "mute" | "bad";
  return (
    <>
      <PageHead title="SEO audit" desc={`Fetches your pages from ${base} and checks titles, descriptions, headings, social tags, structured data, speed and more.`} />
      <SeoTabs active="/admin/seo/audit" />
      <form className="glass mb-5 flex flex-wrap items-end gap-3 rounded-2xl p-4" aria-label="Run an audit"><input type="hidden" name="run" value="1" />
        <label className="text-xs text-[var(--mut)]">What to check<select name="scope" defaultValue={searchParams.scope ?? "core"} className={`${inputCls} mt-1`}><option value="core">Main pages (4)</option><option value="all">Main pages + sample giveaways and contests</option><option value="custom">One specific page</option></select></label>
        <label className="min-w-[200px] flex-1 text-xs text-[var(--mut)]">Page path (for “one specific page”)<input name="path" defaultValue={searchParams.path ?? "/"} className={`${inputCls} mt-1`} /></label>
        <button className={btnCls}>Run audit</button></form>
      {!searchParams.run ? <p className="text-sm text-[var(--mut)]">Pick what to check and press Run audit. It takes a few seconds.</p> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">Average score</p><p className="mt-1 text-3xl font-bold">{avg}<span className="text-base text-[var(--mut)]">/100</span></p></div>
            <div className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">Pages checked</p><p className="mt-1 text-3xl font-bold">{results.length}</p></div>
            <div className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">robots.txt</p><p className="mt-1 text-lg font-bold">{robots?.ok ? "Found" : "Missing"}</p></div>
            <div className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">sitemap.xml</p><p className="mt-1 text-lg font-bold">{sitemap?.ok ? `${sitemap.urls} URLs` : "Missing"}</p></div>
          </div>
          {results.map((r) => (
            <Card key={r.path}>
              <details open={r.score < 85}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2"><span className="font-semibold">{r.path}</span><span className="flex items-center gap-2"><span className="text-xs text-[var(--mut)]">{r.ms} ms · {r.kb} KB · {r.words} words</span><Pill tone={tone(r.score)}>{r.score}/100</Pill></span></summary>
                {r.title && <p className="mt-3 text-sm"><span className="text-[var(--mut)]">Title:</span> {r.title}</p>}{r.description && <p className="mt-1 text-sm"><span className="text-[var(--mut)]">Description:</span> {r.description}</p>}
                <ul className="mt-3 space-y-1.5 text-sm">{[...r.issues].sort((a, b) => ({ error: 0, warn: 1, ok: 2 }[a.level] - { error: 0, warn: 1, ok: 2 }[b.level])).map((i, n) => <li key={n} className="flex gap-2"><span className={`font-bold ${i.level === "ok" ? "text-lime-givar" : i.level === "error" ? "text-red-500" : "text-[var(--mut)]"}`} aria-label={i.level}>{i.level === "ok" ? "✓" : i.level === "error" ? "✕" : "!"}</span><span>{i.text}</span></li>)}</ul>
                <Link href={`/admin/seo/pages?path=${encodeURIComponent(r.path)}`} className="mt-3 inline-block text-sm text-lime-givar">Edit this page&apos;s SEO →</Link>
              </details>
            </Card>))}
        </div>)}
    </>
  );
}
