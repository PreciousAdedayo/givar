import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { breadcrumb, managed, pageMetadata } from "@/lib/seo";
import { fmt } from "@/lib/money";

export async function generateMetadata({ searchParams }: { searchParams: { q?: string; c?: string } }): Promise<Metadata> {
  const filtered = !!(searchParams.q || searchParams.c); // filtered/search result pages are thin duplicates, so keep them out of the index
  const m = managed("/giveaways");
  return pageMetadata("/giveaways", { title: m.title, description: m.description }, filtered ? { robots: { index: false, follow: true } } : {});
}
export const revalidate = 60;

export default async function Feed({ searchParams }: { searchParams: { q?: string; c?: string } }) {
  const q = searchParams.q?.trim();
  const list = await prisma.giveaway.findMany({
    where: { flagged: false, expiresAt: { gt: new Date() }, winnersLeft: { gt: 0 }, ...(q && { title: { contains: q, mode: "insensitive" } }), ...(searchParams.c === "NGN" || searchParams.c === "USD" ? { currency: searchParams.c } : {}) },
    orderBy: { createdAt: "desc" }, take: 30,
  });
  return (
    <main className="page max-w-6xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb([["Home", "/"], ["Live giveaways", "/giveaways"]])) }} />
      <h1 className="text-3xl font-bold">Live giveaways</h1>
      <p className="mt-1 hidden text-[var(--mut)] lg:block">{list.length} open right now. Claim one before it is gone.</p>
      <div className="mt-5 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
      <form className="flex gap-2 lg:glass lg:sticky lg:top-6 lg:flex-col lg:rounded-2xl lg:p-4"><label htmlFor="q" className="hidden text-sm font-semibold lg:block">Search</label><input id="q" name="q" defaultValue={q} placeholder="Search giveaways" className="flex-1 rounded-xl border border-[var(--line)] bg-transparent px-4 py-3" />
        <label htmlFor="c" className="hidden text-sm font-semibold lg:block">Currency</label><select id="c" name="c" defaultValue={searchParams.c ?? ""} className="rounded-xl border border-[var(--line)] bg-transparent px-3"><option value="">All</option><option>NGN</option><option>USD</option></select>
        <button className="rounded-full bg-lime-givar px-5 font-semibold text-black">Search</button></form>
      {list.length === 0 ? <p className="mt-10 text-[var(--mut)]">No live giveaways match. <Link href="/create" className="underline">Create one</Link>.</p> :
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:mt-0">{list.map((g) => (
          <li key={g.id}><Link href={`/c/${g.claimSlug}`} className="glass block rounded-2xl p-5 transition hover:border-lime-givar">
            <h2 className="font-semibold">{g.title}</h2><p className="mt-2 text-3xl font-bold">{fmt(g.totalAmount, g.currency)}</p>
            <p className="mt-1 text-sm text-[var(--mut)]">{g.winnersLeft} of {g.winners} left</p></Link></li>))}</ul>}
      </div>
    </main>
  );
}
