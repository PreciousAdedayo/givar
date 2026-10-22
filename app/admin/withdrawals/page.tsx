import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { maskAcct } from "@/lib/withdraw-usd";
import { dt } from "@/lib/admin";
import { Card, Empty, PageHead, Pill } from "@/components/admin/ui";
import { payWithdrawal, rejectWithdrawal } from "../actions";

export const metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";
type D = { method?: string; accountName?: string; bankName?: string; accountNumber?: string; routingNumber?: string; swift?: string; country?: string; accountType?: string };

export default async function Withdrawals({ searchParams }: { searchParams: { done?: string } }) {
  const rows = await prisma.transaction.findMany({ where: { type: "WITHDRAWAL", status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { wallet: { select: { currency: true, user: { select: { id: true, name: true, email: true } } } } }, take: 100 });
  return (
    <>
      <PageHead title="Withdrawals" desc="USD withdrawals are paid by you from your bank or provider. Pay it, then mark it paid. If you can't pay it, reject it and the money returns to the user." />
      {searchParams.done && <p role="status" className="grad-soft mb-4 rounded-xl p-3 text-sm">Done: {searchParams.done}.</p>}
      {rows.length === 0 ? <Card><Empty>No pending withdrawals.</Empty></Card> : (
        <div className="space-y-3">{rows.map((t) => { const d = (t.meta ?? {}) as D, usd = t.wallet.currency === "USD"; return (
          <Card key={t.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xl font-bold">{fmt(t.amount, t.wallet.currency)} <Pill>{usd ? "manual USD payout" : "NGN transfer pending"}</Pill></p>
                <p className="text-sm text-[var(--mut)]">For <Link href={`/admin/users/${t.wallet.user.id}`} className="underline">{t.wallet.user.name ?? t.wallet.user.email}</Link> · {dt(t.createdAt)} · <span className="font-mono">{t.reference}</span></p></div>
              <div className="flex gap-2"><form action={payWithdrawal.bind(null, t.reference)}><button className="bg-lime-givar rounded-full px-4 py-2 text-sm font-semibold">Mark as paid</button></form><form action={rejectWithdrawal.bind(null, t.reference)}><button className="rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-500">Reject and refund</button></form></div>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {([["Method", d.method ?? "Bank transfer"], ["Account name", d.accountName], ["Bank", d.bankName], ["Account number", d.accountNumber], ["Routing number", d.routingNumber], ["SWIFT / BIC", d.swift], ["Country", d.country], ["Account type", d.accountType]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-t border-[var(--line)] py-1.5"><dt className="text-[var(--mut)]">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
            <p className="mt-2 text-xs text-[var(--mut)]">Account shown to the user as {maskAcct(d.accountNumber)}. Full details are visible to admins only.</p>
          </Card>); })}</div>)}
    </>
  );
}
