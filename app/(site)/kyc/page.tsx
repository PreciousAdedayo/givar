import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { dt } from "@/lib/admin";
import KycWizard from "./KycForm";

export const metadata = { title: "Verify your identity", robots: { index: false } };
export const dynamic = "force-dynamic";

const Step = ({ done, active, label, sub }: { done: boolean; active: boolean; label: string; sub?: string }) => (
  <li className="flex gap-3"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "grad-brand" : active ? "grad-soft" : "bg-[var(--line)] text-[var(--mut)]"}`}>{done ? <Check size={15} aria-hidden /> : active ? <Clock size={14} aria-hidden /> : ""}</span><span><span className={`block font-medium ${done || active ? "" : "text-[var(--mut)]"}`}>{label}</span>{sub && <span className="block text-xs text-[var(--mut)]">{sub}</span>}</span></li>
);

export default async function Kyc() {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const [me, last] = await Promise.all([prisma.user.findUniqueOrThrow({ where: { id: userId } }), prisma.kycSubmission.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { status: true, rejectReason: true, createdAt: true, reviewedAt: true } })]);
  const pending = me.kyc === "PENDING", verified = me.kyc === "VERIFIED", rejected = me.kyc === "REJECTED" && last?.status === "REJECTED";
  return (
    <main className="page max-w-xl space-y-5">
      <div><h1 className="text-2xl font-bold lg:text-3xl">Verify your identity</h1><p className="text-sm text-[var(--mut)]">Takes about 3 minutes. Required to withdraw money.</p></div>
      {(pending || verified || rejected) && (
        <section className="glass rounded-2xl p-5" aria-label="Verification progress"><ol className="space-y-4">
          <Step done active={false} label="Documents submitted" sub={last ? dt(last.createdAt) : undefined} />
          <Step done={verified || rejected} active={pending} label="Under review" sub={pending ? "Usually within a day. We will notify you." : undefined} />
          <Step done={verified} active={false} label={rejected ? "Needs another try" : "Verified"} sub={verified && last?.reviewedAt ? dt(last.reviewedAt) : undefined} />
        </ol></section>)}
      {verified && <section className="grad-brand rounded-2xl p-5"><div className="flex items-center gap-3"><ShieldCheck size={28} aria-hidden /><b className="text-lg">You&apos;re verified</b></div><ul className="mt-3 space-y-1 text-sm"><li>✓ Withdraw to your bank in naira or dollars</li><li>✓ A permanent naira account number</li><li>✓ Higher trust on your giveaways and contests</li></ul><Link href="/wallet" className="mt-4 inline-block rounded-full bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-[#D8F24A]">Go to wallet</Link></section>}
      {rejected && <p role="alert" className="rounded-2xl bg-red-500/15 p-4 text-sm text-red-500"><b>We couldn&apos;t verify you yet.</b><br />Reason: {last?.rejectReason}<br />Please submit again below with clearer photos.</p>}
      {pending && <section className="glass space-y-2 rounded-2xl p-5 text-sm"><h2 className="font-semibold">While you wait</h2><p className="text-[var(--mut)]">You can still receive money, claim giveaways and enter contests. Withdrawals unlock once we verify you. If we need anything else, we&apos;ll message you.</p><Link href="/help/chat?topic=Identity%20verification" className="inline-block text-lime-givar underline">Ask support about your verification</Link></section>}
      {!pending && !verified && <KycWizard defaultName={me.name ?? ""} />}
      <section className="glass space-y-2 rounded-2xl p-5 text-sm" aria-label="Privacy"><h2 className="font-semibold">Your privacy</h2><p className="text-[var(--mut)]">Your photos are stored privately and only our verification team can see them. We never keep your full ID number, only the last 4 digits.</p></section>
    </main>
  );
}
