import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { breadcrumb, managed, pageMetadata } from "@/lib/seo";
import { fmt } from "@/lib/money";
import Countdown from "./Countdown";
import JoinButton from "./JoinButton";

export async function generateMetadata(): Promise<Metadata> { const m = managed("/contests"); return pageMetadata("/contests", { title: m.title, description: m.description }); }
export const dynamic = "force-dynamic";

export default async function Contests() {
  const list = await prisma.contest.findMany({ orderBy: { endsAt: "asc" }, where: { OR: [{ drawnAt: null }, { drawnAt: { gt: new Date(Date.now() - 7 * 864e5) } }] }, take: 30, include: { _count: { select: { entries: true } } } });
  return (
    <main className="page max-w-6xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb([["Home", "/"], ["Prize contests", "/contests"]])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(list.filter((c) => !c.drawnAt).map((c) => ({
        "@context": "https://schema.org", "@type": "Event", name: c.prize, startDate: c.createdAt.toISOString(), endDate: c.endsAt.toISOString(),
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "VirtualLocation", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://givar.app"}/contests/${c.id}` },
        organizer: { "@type": "Organization", name: c.partner ?? "Givar" },
        offers: { "@type": "Offer", price: (c.entryFee / 100).toFixed(2), priceCurrency: c.currency, availability: "https://schema.org/InStock" },
      }))) }} />
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Prize contests</h1><Link href="/contests/create" className="rounded-full bg-lime-givar px-5 py-2 font-semibold text-black">Host a contest</Link></div>
      {list.length === 0 ? <p className="mt-10 text-[var(--mut)]">No contests right now. Host the first one.</p> :
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => { const pct = Math.min(100, (c._count.entries / c.maxEntries) * 100); const over = !!c.drawnAt;
          return <li key={c.id} className="glass space-y-3 rounded-2xl p-5">
            {c.partner && <span className="rounded-full border border-lime-givar px-2 py-0.5 text-xs text-lime-givar">Partner: {c.partner}</span>}
            <h2 className="font-semibold"><Link href={`/contests/${c.id}`}>{c.prize}</Link></h2>
            <p className="text-sm text-[var(--mut)]">{c.entryFee ? `Entry ${fmt(c.entryFee, c.currency)}` : "Free entry"} · {c._count.entries}/{c.maxEntries} joined</p>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-lime-givar" style={{ width: `${pct}%` }} /></div>
            <p className="text-sm">{over ? (c.winnerId ? "Winner drawn" : "Ended with no entries") : <Countdown to={c.endsAt.toISOString()} />}</p>
            {!over && <JoinButton id={c.id} label={c.entryFee ? `Join for ${fmt(c.entryFee, c.currency)}` : "Join free"} />}</li>; })}</ul>}
    </main>
  );
}
