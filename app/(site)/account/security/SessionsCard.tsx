"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type S = { id: string; device: string; country: string | null; ip: string | null; last: string };
export default function SessionsCard({ sessions, currentId }: { sessions: S[]; currentId: string }) {
  const r = useRouter(); const [busy, setBusy] = useState("");
  async function act(body: object, key: string) { setBusy(key); await fetch("/api/security/sessions", { method: "POST", body: JSON.stringify(body) }); setBusy(""); r.refresh(); }
  const others = sessions.filter((s) => s.id !== currentId).length;
  return (
    <section className="glass space-y-3 rounded-2xl p-5 sm:p-6" aria-labelledby="ses">
      <div><h2 id="ses" className="font-semibold">Where you&apos;re signed in</h2><p className="text-sm text-[var(--mut)]">If you don&apos;t recognise a device, sign it out and change your password.</p></div>
      <ul className="divide-y divide-[var(--line)]">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0"><span className="block font-medium">{s.device} {s.id === currentId && <span className="grad-soft ml-1 rounded-full px-2 py-0.5 text-xs font-semibold">This device</span>}</span><span className="block text-xs text-[var(--mut)]">{[s.country, s.ip, `active ${s.last}`].filter(Boolean).join(" · ")}</span></span>
            {s.id !== currentId && <button onClick={() => act({ action: "revoke", id: s.id }, s.id)} disabled={busy === s.id} className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold">Sign out</button>}</li>))}
        {sessions.length === 0 && <li className="py-3 text-sm text-[var(--mut)]">No sessions recorded yet.</li>}
      </ul>
      {others > 0 && <button onClick={() => act({ action: "revoke_others" }, "all")} disabled={busy === "all"} className="w-full rounded-full border border-red-500/50 py-2.5 text-sm font-semibold text-red-500">Sign out all other devices ({others})</button>}
    </section>
  );
}
