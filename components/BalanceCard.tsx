
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";

export default function BalanceCard({
  ngn,
  usd,
  held,
}: {
  ngn: string;
  usd: string;
  held: string;
}) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    try {
      setHide(localStorage.getItem("gv-hide") === "1");
    } catch {}
  }, []);

  function toggle() {
    const n = !hide;
    setHide(n);
    try {
      localStorage.setItem("gv-hide", n ? "1" : "0");
    } catch {}
  }

  const v = (s: string) => (hide ? "••••••" : s);

  return (
    <section
      aria-label="Wallet balance"
      className="grad-brand shadow-glow relative flex min-w-0 flex-col overflow-hidden rounded-3xl p-5 lg:h-full lg:p-7"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/30 blur-2xl" />

      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#B6D626]/50 blur-2xl" />

      <div className="relative flex min-w-0 items-center justify-between gap-2 text-sm font-medium">
        <span className="flex min-w-0 items-center gap-2">
          <span className="whitespace-nowrap">Available balance</span>

          <button
            onClick={toggle}
            aria-pressed={hide}
            aria-label={hide ? "Show balance" : "Hide balance"}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/30"
          >
            {hide ? (
              <EyeOff size={15} aria-hidden />
            ) : (
              <Eye size={15} aria-hidden />
            )}
          </button>
        </span>

        <Link
          href="/transactions"
          className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs sm:text-sm"
        >
          History
          <ChevronRight size={16} aria-hidden />
        </Link>
      </div>

      <p className="relative mt-3 break-words text-4xl font-bold tracking-tight">
        {v(ngn)}
      </p>

      <p className="relative mt-1 break-words text-sm">
        {v(usd)} USD · {v(held)} held in giveaways
      </p>

      <div className="relative mt-5 grid min-w-0 grid-cols-2 gap-3 lg:mt-auto lg:pt-6">
        <Link
          href="/wallet#add"
          className="flex min-w-0 items-center justify-center gap-1.5 rounded-full bg-[#0a0a0a] px-2 py-3 text-center text-sm font-semibold text-[#D8F24A]"
        >
          <Plus size={16} className="shrink-0" aria-hidden />
          <span>Add money</span>
        </Link>

        <Link
          href="/wallet#withdraw"
          className="flex min-w-0 items-center justify-center gap-1.5 rounded-full bg-white/40 px-2 py-3 text-center text-sm font-semibold"
        >
          <ArrowUpRight size={16} className="shrink-0" aria-hidden />
          <span>Withdraw</span>
        </Link>
      </div>
    </section>
  );
}
