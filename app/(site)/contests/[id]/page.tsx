import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { fmt } from "@/lib/money";
import Reveal from "./Reveal";
import { markDelivered } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";
import { cancelContest } from "../../manage/actions";

const mask = (n?: string | null) => { const [a, b] = (n ?? "").split(" "); return a ? (b ? `${a} ${b[0]}.` : a) : "Someone"; };
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const c = await prisma.contest.findUnique({ where: { id: params.id } });
  return c ? { title: c.prize, description: `Enter to win: ${c.prize}. ${c.entryFee ? `Entry ${fmt(c.entryFee, c.currency)}.` : "Free entry."}`, alternates: { canonical: `/contests/${c.id}` }, robots: c.drawnAt || c.cancelledAt ? { index: false, follow: true } : undefined } : { title: "Contest not found", robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function ContestPage({ params }: { params: { id: string } }) {
  const c = await prisma.contest.findUnique({ where: { id: params.id }, include: { host: { select: { name: true, email: true, phone: true } }, entries: { take: 30, include: { user: { select: { name: true } } } }, _count: { select: { entries: true } } } });
  if (!c) notFound();
  const uid = await getUserId();
  const winner = c.winnerId ? await prisma.user.findUnique({ where: { id: c.winnerId }, select: { name: true, email: true, phone: true } }) : null;
  const isHost = uid === c.hostId, isWinner = !!uid && uid === c.winnerId;
  const entered = !!uid && !!(await prisma.contestEntry.findFirst({ where: { contestId: c.id, userId: uid }, select: { id: true } }));
  const contact = (u: { name: string | null; email: string | null; phone: string | null }) => `${u.name ?? ""} · ${u.email ?? u.phone ?? ""}`;
  return (
    <main className="page max-w-lg space-y-5">
      <h1 className="text-3xl font-bold">{c.prize}</h1>
      {c.partner && <p className="text-sm text-lime-givar">Partner: {c.partner}</p>}
      <p className="text-[var(--mut)]">{c.entryFee ? `Entry ${fmt(c.entryFee, c.currency)}` : "Free entry"} · {c._count.entries}/{c.maxEntries} joined · {c.drawnAt ? "drawn" : `draws ${c.endsAt.toLocaleString("en")}`}</p>
      {c.drawnAt && (winner ? <Reveal names={c.entries.map((e) => mask(e.user.name))} winner={mask(winner.name)} /> : <p className="glass rounded-2xl p-5">This contest ended with no entries.</p>)}
      {isWinner && c.host && <p className="glass rounded-2xl p-4 text-sm">You won! Contact the host to collect your prize: <b>{contact(c.host)}</b></p>}
      {isHost && winner && <div className="glass space-y-2 rounded-2xl p-4 text-sm"><p>Winner: <b>{contact(winner)}</b></p>
        {c.deliveredAt ? <p className="text-lime-givar">Prize marked as delivered.</p> : <form action={markDelivered.bind(null, c.id)}><button className="rounded-full bg-lime-givar px-4 py-2 font-semibold text-black">Mark prize delivered</button></form>}</div>}
      {c.cancelledAt && <p role="status" className="rounded-2xl bg-red-500/15 p-4 text-sm text-red-500">This contest was cancelled by the host.</p>}
      {(isHost || entered) && <Link href={`/contests/${c.id}/community`} className="glass block rounded-2xl p-4 text-center font-semibold">Open the community chat</Link>}
      {isHost && <section className="glass space-y-2 rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">You are the host</p>{!c.drawnAt && !c.cancelledAt && c.endsAt > new Date() ? <form action={cancelContest.bind(null, c.id)}><ConfirmButton message="Cancel this contest? Entrants will be told." className="w-full rounded-full border border-red-500/50 py-2.5 text-sm font-semibold text-red-500">Cancel contest</ConfirmButton></form> : <Link href={`/contests/create?from=${c.id}`} className="bg-lime-givar block rounded-full py-2.5 text-center text-sm font-semibold">Run this contest again</Link>}</section>}
    </main>
  );
}
