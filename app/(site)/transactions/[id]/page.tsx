import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download, LifeBuoy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fmt } from "@/lib/money";
import { txMeta } from "@/lib/tx";
import { dt } from "@/lib/admin";
import { detailRows } from "@/lib/tx-detail";
import CopyButton from "@/components/CopyButton";

export const metadata = { title: "Transaction", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TransactionDetail({ params }: { params: { id: string } }) {
  const s = await getSession(); if (!s) redirect("/auth");
  const t = await prisma.transaction.findFirst({ where: { id: params.id, wallet: { userId: s.user.id } }, include: { wallet: true } });
  if (!t) notFound();
  const m = txMeta[t.type], Icon = m.icon, ok = t.status === "SUCCESS";
  const rows: [string, React.ReactNode][] = [...detailRows(t), ["Status", t.status === "SUCCESS" ? "Successful" : t.status === "PENDING" ? "Pending" : "Failed"], ["Date", dt(t.createdAt)], ["Currency", t.wallet.currency],
    ["Reference", <span key="r" className="flex items-center justify-end gap-2"><span className="break-all font-mono text-xs">{t.reference}</span><CopyButton value={t.reference} label="Copy reference" /></span>]];
  return (
    <main className="page max-w-lg space-y-5">
      <Link href="/transactions" className="text-sm text-[var(--mut)]">← Transactions</Link>
      <section className={`${m.credit && ok ? "grad-brand" : "glass"} rounded-3xl p-6 text-center`}>
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${m.credit && ok ? "bg-white/40" : "bg-[var(--line)]"}`}><Icon size={24} aria-hidden /></span>
        <p className="mt-3 text-sm font-medium">{m.label}</p>
        <p className="text-4xl font-bold tracking-tight">{m.credit ? "+" : "−"}{fmt(t.amount, t.wallet.currency)}</p>
        <p className="mt-1 text-sm">{t.status === "PENDING" ? "In progress" : ok ? "Completed" : "Did not go through"}</p>
      </section>
      <section className="glass rounded-2xl p-5" aria-label="Details"><dl>{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-t border-[var(--line)] py-2.5 text-sm first:border-0"><dt className="text-[var(--mut)]">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl></section>
      {t.status === "PENDING" && t.type === "WITHDRAWAL" && <p className="glass rounded-2xl p-4 text-sm text-[var(--mut)]">Your withdrawal is being processed. If it fails, the money returns to your wallet automatically.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={`/transactions/${t.id}/receipt`} className="bg-lime-givar flex items-center justify-center gap-2 rounded-full py-3 font-semibold"><Download size={18} aria-hidden />Download receipt (PDF)</a>
        <Link href={`/help/chat?topic=${encodeURIComponent(`Transaction ${t.reference}`)}`} className="glass flex items-center justify-center gap-2 rounded-full py-3 font-semibold"><LifeBuoy size={18} aria-hidden />Report a problem</Link>
      </div>
    </main>
  );
}
