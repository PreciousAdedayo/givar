"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function VerifyPhone() {
  const r = useRouter(); const [step, setStep] = useState<"phone" | "code">("phone"); const [v, setV] = useState(""); const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const res = await fetch(step === "phone" ? "/api/phone/send" : "/api/phone/verify", { method: "POST", body: JSON.stringify(step === "phone" ? { phone: v } : { code: v }) });
    const j = await res.json(); if (!res.ok) return setMsg(j.error);
    if (step === "phone") { setStep("code"); setV(""); } else r.push("/");
  }
  return (
    <main className="page max-w-md"><form onSubmit={go} className="glass space-y-4 rounded-2xl p-5 sm:p-6">
      <h1 className="text-2xl font-bold">Verify your phone</h1>
      <p className="text-sm text-[var(--mut)]">{step === "phone" ? "This keeps giveaways fair: one claim per person." : "Enter the 6-digit code we sent you."}</p>
      <input className={input} inputMode={step === "phone" ? "tel" : "numeric"} placeholder={step === "phone" ? "+2348012345678" : "123456"} value={v} onChange={(e) => setV(e.target.value)} required />
      {msg && <p role="alert" className="text-sm text-red-400">{msg}</p>}
      <button className="w-full rounded-full bg-lime-givar py-3 font-semibold text-black">{step === "phone" ? "Send code" : "Verify"}</button>
    </form></main>
  );
}
