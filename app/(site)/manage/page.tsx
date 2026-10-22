import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fmt } from "@/lib/money";
import { contestStatus, giveawayStatus, type Status } from "@/lib/manage";
import ConfirmButton from "@/components/ConfirmButton";
import { cancelContest, cancelGiveaway } from "./actions";

export const metadata = { title: "My giveaways and contests", robots: { index: false } };
export const dynamic = "force-dynamic";
const TONE: Record<Status, string> = { live: "grad-soft", ended: "bg-[var(--line)] text-[var(--mut)]", claimed: "bg-[var(--line)] text-[var(--mut)]", cancelled: "bg-red-500/15 text-red-500" };
const LABEL: Record<Status, string> = { live: "Live", ended: "Ended", claimed: "Fully claimed", cancelled: "Cancelled" };
const btn = "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold";

export default async function Manage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const s = await getSession(); if (!s) redirect("/auth");
  const [gs, cs] = await Promise.all([
    prisma.giveaway.findMany({ where: { creatorId: s.user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { claims: true } } } }),
    prisma.contest.findMany({ where: { hostId: s.user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { entries: true } } } }),
  ]);
  return (
    <main className="page max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold lg:text-3xl">My giveaways and contests</h1><p className="text-sm text-[var(--mut)]">Cancel one that is running, or renew one that is over with the same settings.</p></div>
      {searchParams.ok && <p role="status" className="grad-soft rounded-xl p-3 text-sm">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-500">{searchParams.err}</p>}
      <section aria-labelledby="mg"><h2 id="mg" className="mb-2 font-semibold">Giveaways</h2>
        {gs.length === 0 ? <p className="glass rounded-2xl p-5 text-sm text-[var(--mut)]">You haven&apos;t created a giveaway yet. <Link href="/create" className="text-lime-givar underline">Create one</Link>.</p> : (
          <ul className="space-y-3">{gs.map((g) => { const st = giveawayStatus(g); return (
            <li key={g.id} className="glass space-y-3 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{g.title}</p><p className="text-sm text-[var(--mut)]">{fmt(g.totalAmount, g.currency)} · {g._count.claims} of {g.winners} claimed{st === "live" ? ` · ends ${g.expiresAt.toLocaleDateString("en")}` : ""}</p></div><span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[st]}`}>{LABEL[st]}</span></div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/c/${g.claimSlug}`} className={btn}>Open</Link><Link href={`/c/${g.id}/community`} className={btn}>Community chat</Link>{g.mode === "PERSONAL" && <Link href={`/manage/${g.id}`} className={btn}>View codes</Link>}
                {st === "live" && <form action={cancelGiveaway.bind(null, g.id)}><ConfirmButton message="Cancel this giveaway? The unclaimed money returns to your wallet. The 5% fee is not refunded." className="rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-500">Cancel giveaway</ConfirmButton></form>}
                {st !== "live" && <Link href={`/create?from=${g.id}`} className="bg-lime-givar rounded-full px-4 py-2 text-sm font-semibold">Renew</Link>}
              </div></li>); })}</ul>)}
      </section>
      <section aria-labelledby="mc"><h2 id="mc" className="mb-2 font-semibold">Contests</h2>
        {cs.length === 0 ? <p className="glass rounded-2xl p-5 text-sm text-[var(--mut)]">You haven&apos;t hosted a contest yet. <Link href="/contests/create" className="text-lime-givar underline">Host one</Link>.</p> : (
          <ul className="space-y-3">{cs.map((c) => { const st = contestStatus(c); return (
            <li key={c.id} className="glass space-y-3 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{c.prize}</p><p className="text-sm text-[var(--mut)]">{c.entryFee ? `Entry ${fmt(c.entryFee, c.currency)}` : "Free entry"} · {c._count.entries}/{c.maxEntries} joined{st === "live" ? ` · draws ${c.endsAt.toLocaleDateString("en")}` : ""}</p></div><span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[st]}`}>{LABEL[st]}</span></div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/contests/${c.id}`} className={btn}>Open</Link><Link href={`/contests/${c.id}/community`} className={btn}>Community chat</Link>
                {st === "live" && <form action={cancelContest.bind(null, c.id)}><ConfirmButton message="Cancel this contest? Entrants will be told." className="rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-500">Cancel contest</ConfirmButton></form>}
                {st !== "live" && <Link href={`/contests/create?from=${c.id}`} className="bg-lime-givar rounded-full px-4 py-2 text-sm font-semibold">Run again</Link>}
              </div></li>); })}</ul>)}
      </section>
    </main>
  );
}
