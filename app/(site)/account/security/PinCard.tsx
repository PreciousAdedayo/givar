"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar tracking-[0.4em]";
export default function PinCard({ hasPin, hasPassword }: { hasPin: boolean; hasPassword: boolean }) {
  const r = useRouter(); const [open, setOpen] = useState(false); const [pin, setPin] = useState(""); const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const res = await fetch("/api/security/pin", { method: "POST", body: JSON.stringify({ pin, current: cur || undefined, password: pw || undefined }) }); const j = await res.json();
    setOk(res.ok); setMsg(res.ok ? "Transaction PIN saved." : j.error); if (res.ok) { setOpen(false); setPin(""); setCur(""); setPw(""); r.refresh(); }
  }
  const digits = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value.replace(/\D/g, "").slice(0, 4));
  return (
    <section className="glass space-y-3 rounded-2xl p-5 sm:p-6" aria-labelledby="pin">
      <div className="flex items-start justify-between gap-3"><div><h2 id="pin" className="font-semibold">Transaction PIN</h2><p className="text-sm text-[var(--mut)]">A 4-digit PIN you enter to withdraw money. Five wrong tries lock it for 30 minutes.</p></div><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${hasPin ? "grad-soft" : "bg-[var(--line)] text-[var(--mut)]"}`}>{hasPin ? "Set" : "Not set"}</span></div>
      {!open && <button onClick={() => { setOpen(true); setMsg(""); }} className={`${hasPin ? "rounded-full border border-[var(--line)]" : "bg-lime-givar rounded-full"} px-5 py-2.5 font-semibold`}>{hasPin ? "Change PIN" : "Set PIN"}</button>}
      {open && (
        <form onSubmit={save} className="space-y-3">
          {hasPin ? <input className={input} type="password" inputMode="numeric" placeholder="Current PIN" value={cur} onChange={digits(setCur)} required /> : hasPassword && <input className="w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3" type="password" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />}
          <input className={input} type="password" inputMode="numeric" placeholder="New 4-digit PIN" value={pin} onChange={digits(setPin)} required />
          <div className="flex gap-2"><button className="bg-lime-givar rounded-full px-5 py-2.5 font-semibold">Save PIN</button><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[var(--line)] px-5 py-2.5 font-semibold">Cancel</button></div>
        </form>)}
      {msg && <p role={ok ? "status" : "alert"} className={`text-sm ${ok ? "text-lime-givar" : "text-red-500"}`}>{msg}</p>}
    </section>
  );
}
