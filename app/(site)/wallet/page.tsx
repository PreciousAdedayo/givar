import { redirect } from "next/navigation";
import { Prisma, TxType, TxStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { fmt } from "@/lib/money";
import TxRow from "@/components/TxRow";
import TxTable from "@/components/TxTable";
import WalletActions from "./WalletActions";

export const metadata = { title: "Wallet", robots: { index: false } };

export default async function Wallet({ searchParams }: { searchParams: { type?: string; status?: string } }) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const where: Prisma.TransactionWhereInput = { wallet: { userId } };
  if (searchParams.type && searchParams.type in TxType) where.type = searchParams.type as TxType;
  if (searchParams.status && searchParams.status in TxStatus) where.status = searchParams.status as TxStatus;
  const [txs, wallets] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, include: { wallet: { select: { currency: true } } } }),
    prisma.wallet.findMany({ where: { userId } }),
  ]);
  const w = (c: "NGN" | "USD") => wallets.find((x) => x.currency === c);
  const sel = "rounded-xl border border-[var(--line)] bg-transparent px-3 py-2";
  return (
    <main className="page max-w-4xl space-y-6 lg:max-w-6xl">
      <h1 className="text-2xl font-bold lg:text-3xl">Wallet</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="grad-brand rounded-2xl p-4"><p className="text-xs font-medium">NGN balance</p><p className="text-2xl font-bold">{fmt(w("NGN")?.balance ?? 0)}</p></div>
        <div className="grad-dark rounded-2xl p-4"><p className="text-xs opacity-80">USD balance</p><p className="text-2xl font-bold">{fmt(w("USD")?.balance ?? 0, "USD")}</p></div>
        <div className="glass col-span-2 rounded-2xl p-4 lg:col-span-1"><p className="text-xs text-[var(--mut)]">Held in giveaways</p><p className="text-2xl font-bold">{fmt(w("NGN")?.locked ?? 0)}</p></div>
      </div>
      <WalletActions />
      <section className="glass rounded-2xl p-5">
        <form className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-semibold">Transactions</h2>
          <select name="type" defaultValue={searchParams.type ?? ""} className={sel} aria-label="Type"><option value="">All types</option>{Object.keys(TxType).map((t) => <option key={t}>{t}</option>)}</select>
          <select name="status" defaultValue={searchParams.status ?? ""} className={sel} aria-label="Status"><option value="">All statuses</option>{Object.keys(TxStatus).map((t) => <option key={t}>{t}</option>)}</select>
          <button className="bg-lime-givar rounded-full px-4 py-2 font-semibold">Filter</button>
        </form>
        {txs.length === 0 ? <p className="mt-4 text-[var(--mut)]">No transactions match. Try clearing the filters.</p> : (
          <><ul className="mt-2 divide-y divide-[var(--line)] lg:hidden">{txs.map((t) => <TxRow key={t.id} t={t} />)}</ul><div className="mt-4 hidden lg:block"><TxTable txs={txs} /></div></>)}
      </section>
    </main>
  );
}
