import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma, TxType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { fmt } from "@/lib/money";
import { CREDIT_TYPES, DEBIT_TYPES } from "@/lib/tx";
import TxRow from "@/components/TxRow";
import TxTable from "@/components/TxTable";

export const metadata = { title: "Transaction history", robots: { index: false } };
const filters = [["all", "All"], ["in", "Money in"], ["out", "Money out"], ["pending", "Pending"]] as const;
const dayLabel = (d: Date) => {
  const now = new Date(), y = new Date(Date.now() - 864e5);
  return d.toDateString() === now.toDateString() ? "Today" : d.toDateString() === y.toDateString() ? "Yesterday" : d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
};

export default async function Transactions({ searchParams }: { searchParams: { f?: string } }) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const f = searchParams.f ?? "all";
  const where: Prisma.TransactionWhereInput = { wallet: { userId } };
  if (f === "in") where.type = { in: CREDIT_TYPES }; else if (f === "out") where.type = { in: DEBIT_TYPES }; else if (f === "pending") where.status = "PENDING";
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const sum = (types: TxType[]) => prisma.transaction.aggregate({ _sum: { amount: true }, where: { wallet: { userId, currency: "NGN" }, status: "SUCCESS", type: { in: types }, createdAt: { gte: start } } });
  const [txs, inn, out, pending, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { wallet: { select: { currency: true } } } }),
    sum(CREDIT_TYPES), sum(DEBIT_TYPES),
    prisma.transaction.count({ where: { wallet: { userId }, status: "PENDING" } }),
    prisma.transaction.count({ where: { wallet: { userId } } }),
  ]);
  const groups = new Map<string, typeof txs>();
  for (const t of txs) { const k = dayLabel(t.createdAt); groups.set(k, [...(groups.get(k) ?? []), t]); }
  return (
    <main className="page max-w-2xl space-y-5 lg:max-w-6xl">
      <h1 className="text-2xl font-bold lg:text-3xl">Transaction history</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="grad-brand rounded-2xl p-4"><p className="text-xs font-medium">Money in this month</p><p className="text-xl font-bold">{fmt(inn._sum.amount ?? 0)}</p></div>
        <div className="grad-dark rounded-2xl p-4"><p className="text-xs opacity-80">Money out this month</p><p className="text-xl font-bold">{fmt(out._sum.amount ?? 0)}</p></div>
        <div className="glass hidden rounded-2xl p-4 lg:block"><p className="text-xs text-[var(--mut)]">Pending</p><p className="text-xl font-bold">{pending}</p></div>
        <div className="glass hidden rounded-2xl p-4 lg:block"><p className="text-xs text-[var(--mut)]">All transactions</p><p className="text-xl font-bold">{total}</p></div>
      </div>
      <div className="flex gap-2 overflow-x-auto" aria-label="Filter transactions">
        {filters.map(([k, l]) => <Link key={k} href={k === "all" ? "/transactions" : `/transactions?f=${k}`} aria-current={f === k ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${f === k ? "bg-lime-givar" : "glass"}`}>{l}</Link>)}
      </div>
      {txs.length === 0 ? <p className="glass rounded-2xl p-8 text-center text-[var(--mut)]">Nothing here yet. Try another filter, or <Link href="/wallet#add" className="text-lime-givar underline">add money</Link>.</p> : (
        <>
          <div className="space-y-5 lg:hidden">{Array.from(groups).map(([day, list]) => (
            <section key={day} aria-label={day}><h2 className="mb-1 text-sm font-semibold text-[var(--mut)]">{day}</h2><ul className="glass divide-y divide-[var(--line)] rounded-2xl px-4">{list.map((t) => <TxRow key={t.id} t={t} />)}</ul></section>))}</div>
          <div className="glass hidden rounded-3xl p-5 lg:block"><TxTable txs={txs} /></div>
        </>
      )}
      <p className="text-center text-xs text-[var(--mut)]">Showing your latest 100. Month totals cover naira transactions.</p>
    </main>
  );
}
