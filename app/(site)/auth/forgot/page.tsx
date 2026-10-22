"use client";
import { useState } from "react";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function Forgot() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent) { e.preventDefault(); const r = await fetch("/api/account/forgot", { method: "POST", body: JSON.stringify({ email }) }); setMsg(r.ok ? "If that email has an account, a reset link is on its way." : (await r.json()).error); }
  return <main className="page max-w-md"><form onSubmit={go} className="glass space-y-4 rounded-2xl p-5 sm:p-6"><h1 className="text-2xl font-bold">Reset your password</h1>
    <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />{msg && <p role="status" className="text-sm">{msg}</p>}
    <button className="w-full rounded-full bg-lime-givar py-3 font-semibold text-black">Send reset link</button></form></main>;
}
