"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
export default function ClaimByCode() {
  const r = useRouter(); const [v, setV] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault(); const c = v.trim().toUpperCase(); if (!c) return;
    r.push(`/c/${encodeURIComponent(/^GV-/.test(c) ? c : /^[A-Z0-9]{6}$/.test(c) ? `GV-${c}` : c)}`);
  }
  return (
    <form onSubmit={go} className="glass flex items-center gap-2 rounded-2xl p-3">
      <Ticket size={20} className="ml-1 shrink-0 text-lime-givar" aria-hidden />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Have a code? e.g. GV-8X2K91" aria-label="Giveaway code" className="min-w-0 flex-1 bg-transparent px-1 py-2 font-mono text-sm uppercase outline-none placeholder:normal-case" />
      <button className="bg-lime-givar rounded-full px-5 py-2 text-sm font-semibold">Claim</button>
    </form>
  );
}
