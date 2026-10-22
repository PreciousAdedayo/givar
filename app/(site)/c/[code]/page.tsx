import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import ClaimButton from "./ClaimButton";
import { getSession } from "@/lib/session";
import { roomAccess } from "@/lib/chat";
import ConfirmButton from "@/components/ConfirmButton";
import { cancelGiveaway } from "../../manage/actions";

const find = (code: string) => prisma.giveaway.findFirst({ where: { OR: [{ claimSlug: code }, { claimCode: code.toUpperCase() }, { personalCodes: { some: { code: code.toUpperCase() } } }], flagged: false } });
const mask = (n?: string | null) => { const [a, b] = (n ?? "").split(" "); return a ? (b ? `${a} ${b[0]}.` : a) : "Someone"; };

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const g = await find(params.code);
  if (!g) return { title: "Giveaway not found", robots: { index: false } };
  const ended = g.expiresAt < new Date() || g.winnersLeft === 0 || !!g.cancelledAt; // ended giveaways are thin pages: keep them out of search results
  return { title: `Claim ${g.title}`, description: `Claim your share of ${fmt(g.totalAmount, g.currency)} on Givar. ${g.winnersLeft} of ${g.winners} prizes left.`, alternates: { canonical: `/c/${g.claimSlug}` }, robots: ended ? { index: false, follow: true } : undefined };
}

const Brand = () => (
  <Link href="/" className="flex items-center gap-2 text-lg font-bold lg:hidden"><svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>Givar</Link>
);

export default async function ClaimPage({ params, searchParams }: { params: { code: string }; searchParams: { code?: string } }) {
  const g = await find(params.code);
  if (!g) notFound(); // a real HTTP 404, not a "soft 404" page that returns 200
  const winners = await prisma.claim.findMany({ where: { giveawayId: g.id }, orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } });
  const expired = g.expiresAt < new Date(), gone = g.winnersLeft === 0, cancelled = !!g.cancelledAt;
  const s = await getSession(), access = s ? await roomAccess(`g:${g.id}`, s.user.id, "USER") : null, isHost = !!s && s.user.id === g.creatorId;
  return (
    <main className="page max-w-md lg:max-w-6xl"><Brand />
      <div className="mt-4 grid gap-5 lg:mt-0 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="glass space-y-3 rounded-2xl p-5 sm:p-6 lg:col-start-1 lg:row-start-1">
          <h1 className="text-2xl font-bold lg:text-3xl">{g.title}</h1>
          {g.description && <p className="text-[var(--mut)]">{g.description}</p>}
          <p className="text-4xl font-bold lg:text-5xl">{fmt(g.totalAmount, g.currency)}</p>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="grad-brand h-full rounded-full" style={{ width: `${((g.winners - g.winnersLeft) / g.winners) * 100}%` }} /></div>
          <p className="text-sm text-[var(--mut)]">{g.winnersLeft} of {g.winners} prizes left · ends {g.expiresAt.toLocaleDateString("en")}</p>
        </section>
        <aside className="glass space-y-4 rounded-2xl p-5 sm:p-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <h2 className="text-lg font-semibold">Claim your share</h2>
          {cancelled ? <p className="text-red-500">This giveaway was cancelled by the host.</p> : expired ? <p className="text-red-500">This giveaway has expired.</p> : gone ? <p className="text-red-500">All prizes have been claimed.</p> : <ClaimButton code={g.claimSlug} question={g.question} personal={g.mode === "PERSONAL"} defaultCode={(searchParams.code ?? (/^GV-/i.test(params.code) ? params.code : "")).toUpperCase()} />}
          <ul className="space-y-1 border-t border-[var(--line)] pt-4 text-sm text-[var(--mut)]"><li>Verified phone number required</li><li>{g.mode === "PERSONAL" ? "Each code works once. Enter the code the host gave you" : "One claim per person"}</li><li>Money goes straight to your Givar wallet</li></ul>
          {access && <Link href={`/c/${g.id}/community`} className="glass block rounded-xl p-3 text-center text-sm font-semibold">Open the community chat</Link>}
          {isHost && <div className="space-y-2 border-t border-[var(--line)] pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">You are the host</p>{!cancelled && !expired && !gone ? <form action={cancelGiveaway.bind(null, g.id)}><ConfirmButton message="Cancel this giveaway? The unclaimed money returns to your wallet. The 5% fee is not refunded." className="w-full rounded-full border border-red-500/50 py-2.5 text-sm font-semibold text-red-500">Cancel giveaway</ConfirmButton></form> : <Link href={`/create?from=${g.id}`} className="bg-lime-givar block rounded-full py-2.5 text-center text-sm font-semibold">Renew this giveaway</Link>}</div>}
        </aside>
        {winners.length > 0 && (
          <section className="glass rounded-2xl p-5 sm:p-6 lg:col-start-1 lg:row-start-2"><h2 className="font-semibold">Winners</h2>
            <ul className="mt-2 divide-y divide-[var(--line)] text-sm">{winners.map((w) => <li key={w.id} className="flex justify-between py-2"><span>{mask(w.user.name)}</span><span className="text-[var(--mut)]">{fmt(w.amount, g.currency)} · {w.createdAt.toLocaleDateString("en")}</span></li>)}</ul></section>
        )}
      </div>
    </main>
  );
}
