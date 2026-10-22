import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fmt } from "@/lib/money";
import { ago } from "@/lib/admin";
import { REFERRAL_BONUS, REFERRAL_MIN_DEPOSIT, ensureReferralCode } from "@/lib/referral";
import { SITE } from "@/lib/seo";
import ReferralShare from "./ReferralShare";

export const metadata = { title: "Invite friends", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Referrals() {
  const s = await getSession(); if (!s) redirect("/auth");
  const code = await ensureReferralCode(s.user.id);
  const [friends, rewards] = await Promise.all([
    prisma.user.findMany({ where: { referredById: s.user.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, createdAt: true } }),
    prisma.referralReward.findMany({ where: { referrerId: s.user.id }, select: { referredId: true, amount: true } }),
  ]);
  const paid = new Set(rewards.map((r) => r.referredId)), earned = rewards.reduce((a, r) => a + r.amount, 0);
  const mask = (n?: string | null) => { const [a, b] = (n ?? "").split(" "); return a ? (b ? `${a} ${b[0]}.` : a) : "A friend"; };
  return (
    <main className="page max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold lg:text-3xl">Invite friends</h1>
      <section className="grad-brand shadow-glow rounded-3xl p-6"><p className="text-sm font-medium">Earn {fmt(REFERRAL_BONUS)} for every friend who joins</p><p className="mt-1 text-sm">You get {fmt(REFERRAL_BONUS)} in your wallet when a friend you invite makes their first deposit of {fmt(REFERRAL_MIN_DEPOSIT)} or more.</p></section>
      <ReferralShare code={code ?? ""} link={`${SITE}/auth?ref=${code}`} />
      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Invited", String(friends.length)], ["Qualified", String(rewards.length)], ["Earned", fmt(earned)]].map(([l, v]) => <div key={l} className="glass rounded-2xl p-4"><p className="text-xs text-[var(--mut)]">{l}</p><p className="text-xl font-bold">{v}</p></div>)}
      </div>
      <section className="glass rounded-2xl p-5" aria-labelledby="fr"><h2 id="fr" className="mb-2 font-semibold">Your friends</h2>
        {friends.length === 0 ? <p className="text-sm text-[var(--mut)]">Nobody yet. Share your link to get started.</p> : <ul className="divide-y divide-[var(--line)] text-sm">{friends.map((f) => <li key={f.id} className="flex items-center justify-between gap-3 py-3"><span>{mask(f.name)} <span className="text-xs text-[var(--mut)]">joined {ago(f.createdAt)}</span></span><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paid.has(f.id) ? "grad-soft" : "bg-[var(--line)] text-[var(--mut)]"}`}>{paid.has(f.id) ? `Earned ${fmt(REFERRAL_BONUS)}` : "Waiting for first deposit"}</span></li>)}</ul>}
      </section>
      <p className="text-xs text-[var(--mut)]">One bonus per friend. Fake or duplicate accounts are removed and their bonuses reversed.</p>
    </main>
  );
}
