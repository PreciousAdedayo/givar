"use client";
import { useState } from "react";
import confetti from "canvas-confetti";

export default function ClaimButton({ code, question, personal, defaultCode = "" }: { code: string; question?: string | null; personal?: boolean; defaultCode?: string }) {
  const [mine, setMine] = useState(defaultCode);
  const [state, setState] = useState<{ ok?: string; err?: string }>({}); const [busy, setBusy] = useState(false); const [ans, setAns] = useState("");
  async function claim() {
    setBusy(true);
    // Lightweight device id: stored once, sent as a fingerprint (server enforces uniqueness)
    let fp = localStorage.getItem("givar_fp"); if (!fp) { fp = crypto.randomUUID(); localStorage.setItem("givar_fp", fp); }
    const res = await fetch("/api/claims", { method: "POST", body: JSON.stringify({ code: personal ? mine.trim().toUpperCase() : code, fingerprint: fp, answer: ans }) });
    const j = await res.json(); setBusy(false);
    if (res.status === 401) { location.href = `/auth`; return; }
    if (j.needsPhone) { location.href = "/verify-phone"; return; }
    if (!res.ok) return setState({ err: j.error });
    const amt = new Intl.NumberFormat("en", { style: "currency", currency: j.currency }).format(j.amount / 100);
    setState({ ok: `${amt} added to your wallet` });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors: ["#D8F24A", "#ffffff"] });
  }
  if (state.ok) return <p role="status" className="text-xl font-bold text-lime-givar">{state.ok}</p>;
  return (<div className="space-y-3">
    {personal && <input className="w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 text-center font-mono text-lg uppercase tracking-widest" placeholder="GV-XXXX-XXXX" aria-label="Your one-time code" value={mine} onChange={(e) => setMine(e.target.value)} maxLength={14} />}
    {question && <input className="w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3" placeholder={question} value={ans} onChange={(e) => setAns(e.target.value)} />}
    <button onClick={claim} disabled={busy || (!!question && !ans.trim()) || (!!personal && mine.trim().length < 12)} className="w-full rounded-full bg-lime-givar py-3 font-semibold text-black disabled:opacity-60">{busy ? "Claiming…" : "Claim now"}</button>
    {state.err && <p role="alert" className="text-sm text-red-400">{state.err}</p>}</div>);
}
