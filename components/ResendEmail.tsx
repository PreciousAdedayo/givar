"use client";
import { useState } from "react";
export default function ResendEmail() {
  const [msg, setMsg] = useState("");
  async function go() { const r = await fetch("/api/account/resend-verification", { method: "POST" }); setMsg(r.ok ? "Sent. Check your inbox." : (await r.json()).error); }
  return <span className="text-right"><button onClick={go} className="rounded-full bg-[var(--line)] px-3 py-1 text-xs font-semibold">Send link</button>{msg && <span role="status" className="block text-xs text-[var(--mut)]">{msg}</span>}</span>;
}
