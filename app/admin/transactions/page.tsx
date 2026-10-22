import Link from "next/link";
import { Prisma, TxStatus, TxType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { PAGE_SIZE, dt, pageNum } from "@/lib/admin";
import { txMeta } from "@/lib/tx";
import { Card, Empty, PageHead, Pager, Pill, btnCls, ghostCls, inputCls } from "@/components/admin/ui";

export const metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";
type SP = { type?: string; status?: string; currency?: string; q?: string; user?: string; from?: string; to?: string; page?: string };

export default async function AdminTransactions({ searchParams: s }: { searchParams: SP }) {
  const page = pageNum(s.page), q = s.q?.trim();
  const where: Prisma.TransactionWhereInput = {};
  if (s.type && s.type in TxType) where.type = s.type as TxType;
  if (s.status && s.status in TxStatus) where.status = s.status as TxStatus;
  const wallet: Prisma.WalletWhereInput = {};
  if (s.currency === "NGN" || s.currency === "USD") wallet.currency = s.currency;
  if (s.user) wallet.userId = s.user;
  if (Object.keys(wallet).length) where.wallet = wallet;
  if (q) where.reference = { contains: q, mode: "insensitive" };
  const range: Prisma.DateTimeFilter = {};
  if (s.from && /^\d{4}-\d{2}-\d{2}$/.test(s.from)) range.gte = new Date(`${s.from}T00:00:00Z`);
  if (s.to && /^\d{4}-\d{2}-\d{2}$/.test(s.to)) range.lt = new Date(new Date(`${s.to}T00:00:00Z`).getTime() + 864e5);
  if (range.gte || range.lt) where.createdAt = range;
  const [rows, total] = await Promise.all([prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { wallet: { select: { currency: true, user: { select: { id: true, name: true } } } } } }), prisma.transaction.count({ where })]);
  return (
    <>
      <PageHead title="Transactions" desc={`${total.toLocaleString()} matching${s.user ? " · one user only" : ""}`} />
      <form className="glass mb-4 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter transactions">
        {s.user && <input type="hidden" name="user" value={s.user} />}
        <label className="text-xs text-[var(--mut)]">Type<select name="type" defaultValue={s.type ?? ""} className={`${inputCls} mt-1`}><option value="">Any</option>{Object.keys(TxType).map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-xs text-[var(--mut)]">Status<select name="status" defaultValue={s.status ?? ""} className={`${inputCls} mt-1`}><option value="">Any</option>{Object.keys(TxStatus).map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-xs text-[var(--mut)]">Currency<select name="currency" defaultValue={s.currency ?? ""} className={`${inputCls} mt-1`}><option value="">Any</option><option>NGN</option><option>USD</option></select></label>
        <label className="text-xs text-[var(--mut)]">Reference<input name="q" defaultValue={q} placeholder="e.g. flw_ or wd_" className={`${inputCls} mt-1`} /></label>
        <label className="text-xs text-[var(--mut)]">From<input type="date" name="from" defaultValue={s.from} className={`${inputCls} mt-1`} /></label>
        <label className="text-xs text-[var(--mut)]">To<input type="date" name="to" defaultValue={s.to} className={`${inputCls} mt-1`} /></label>
        <div className="flex items-end gap-2 sm:col-span-2"><button className={btnCls}>Apply</button><Link href="/admin/transactions" className={ghostCls}>Reset</Link></div>
      </form>
      <Card>
        {rows.length === 0 ? <Empty>No transactions match.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs text-[var(--mut)]"><tr><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">User</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Reference</th><th className="pb-2 text-right font-medium">Amount</th></tr></thead>
            <tbody>{rows.map((t) => (
              <tr key={t.id} className="border-t border-[var(--line)]">
                <td className="py-3">{txMeta[t.type].label}</td><td><Link href={`/admin/users/${t.wallet.user.id}`} className="underline">{t.wallet.user.name ?? "Unnamed"}</Link></td>
                <td><Pill tone={t.status === "SUCCESS" ? "ok" : t.status === "FAILED" ? "bad" : "mute"}>{t.status.toLowerCase()}</Pill></td><td className="text-[var(--mut)]">{dt(t.createdAt)}</td><td className="font-mono text-xs text-[var(--mut)]">{t.reference}</td>
                <td className="text-right font-semibold">{txMeta[t.type].credit ? "+" : "−"}{fmt(t.amount, t.wallet.currency)}</td>
              </tr>))}</tbody></table></div>
        )}
      </Card>
      <Pager page={page} total={total} size={PAGE_SIZE} path="/admin/transactions" params={{ type: s.type, status: s.status, currency: s.currency, q, user: s.user, from: s.from, to: s.to }} />
    </>
  );
}
