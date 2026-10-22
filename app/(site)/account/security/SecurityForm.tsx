"use client";
import { useState } from "react";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function SecurityForm({ hasPassword }: { hasPassword: boolean }) {
  const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const res = await fetch("/api/account/password", { method: "POST", body: JSON.stringify({ current: cur || undefined, password: pw }) });
    const j = await res.json(); setOk(res.ok); setMsg(res.ok ? "Password updated. Other devices were signed out." : j.error); if (res.ok) { setCur(""); setPw(""); }
  }
  return (
    <form onSubmit={save} className="glass space-y-3 rounded-2xl p-5 sm:p-6">
      <h2 className="font-semibold">{hasPassword ? "Change password" : "Set a password"}</h2>
      {hasPassword && <input className={input} type="password" placeholder="Current password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required />}
      <input className={input} type="password" placeholder="New password (8+ characters)" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required />
      {msg && <p role={ok ? "status" : "alert"} className={`text-sm ${ok ? "text-lime-givar" : "text-red-500"}`}>{msg}</p>}
      <button className="bg-lime-givar w-full rounded-full py-3 font-semibold">Update password</button>
    </form>
  );
}
