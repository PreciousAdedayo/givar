"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function JoinButton({ id, label }: { id: string; label: string }) {
  const r = useRouter(); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function join() {
    setBusy(true); const res = await fetch("/api/contests/join", { method: "POST", body: JSON.stringify({ contestId: id }) }); setBusy(false);
    if (res.status === 401) return r.push("/auth"); const j = await res.json();
    if (!res.ok) return setMsg(j.error); setMsg("You're in. Good luck!"); r.refresh();
  }
  return <div><button onClick={join} disabled={busy} className="w-full rounded-full bg-lime-givar py-2 font-semibold text-black disabled:opacity-60">{label}</button>{msg && <p role="status" className="mt-2 text-sm">{msg}</p>}</div>;
}
