"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Eye, EyeOff, Plus } from "lucide-react";

export default function BalanceCard({ ngn, usd, held }: { ngn: string; usd: string; held: string }) {
  const [hide, setHide] = useState(false);
  useEffect(() => { try { setHide(localStorage.getItem("gv-hide") === "1"); } catch {} }, []);
  function toggle() { const n = !hide; setHide(n); try { localStorage.setItem("gv-hide", n ? "1" : "0"); } catch {} }
  const v = (s: string) => (hide ? "••••••" : s);
  return (
    <section aria-label="Wallet balance" className="grad-brand shadow-glow relative flex flex-col overflow-hidden rounded-3xl p-5 lg:h-full lg:p-7">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#B6D626]/50 blur-2xl" />
      <div className="relative flex items-center justify-between gap-2 text-sm font-medium">
        <span className="flex items-center gap-2">Available balance
          <button onClick={toggle} aria-pressed={hide} aria-label={hide ? "Show balance" : "Hide balance"} className="grid h-7 w-7 place-items-center rounded-full bg-white/30">{hide ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}</button></span>
        <Link href="/transactions" className="flex items-center gap-0.5 whitespace-nowrap text-xs sm:text-sm">Transaction history<ChevronRight size={16} aria-hidden /></Link>
      </div>
      <p className="relative mt-3 text-4xl font-bold tracking-tight">{v(ngn)}</p>
      <p className="relative mt-1 text-sm">{v(usd)} USD · {v(held)} held in giveaways</p>
      <div className="relative mt-5 flex gap-3 lg:mt-auto lg:pt-6">
        <Link href="/wallet#add" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0a0a0a] py-3 text-sm font-semibold text-[#D8F24A]"><Plus size={16} aria-hidden />Add money</Link>
        <Link href="/wallet#withdraw" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/40 py-3 text-sm font-semibold"><ArrowUpRight size={16} aria-hidden />Withdraw</Link>
      </div>
    </section>
  );
}
