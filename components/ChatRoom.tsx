"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Msg = { id: string; userId: string; name: string; fromStaff: boolean; hidden: boolean; body: string; at: string };
const time = (iso: string) => { const d = new Date(iso), t = new Date(); return d.toDateString() === t.toDateString() ? d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString("en", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }); };

/** Chat window. Checks for new messages every 4 seconds while the tab is visible. */
export default function ChatRoom({ roomKey, meId, draft = "", placeholder = "Write a message…", empty = "No messages yet. Say hello!", canned = [], topic }: { roomKey: string; meId: string; draft?: string; placeholder?: string; empty?: string; canned?: string[]; topic?: string }) {
  const [key, setKey] = useState(roomKey); const [msgs, setMsgs] = useState<Msg[]>([]); const [text, setText] = useState(draft); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null); const stick = useRef(true);
  const load = useCallback(async () => {
    if (key === "s:new" || document.hidden) return;
    try { const r = await fetch(`/api/chat/${encodeURIComponent(key)}`, { cache: "no-store" }); if (r.ok) { setMsgs((await r.json()).messages); setReady(true); } } catch {}
  }, [key]);
  useEffect(() => { if (key === "s:new") { setReady(true); return; } load(); const t = setInterval(load, 4000); document.addEventListener("visibilitychange", load); return () => { clearInterval(t); document.removeEventListener("visibilitychange", load); }; }, [key, load]);
  useEffect(() => { const el = box.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs]);
  async function send(e?: React.FormEvent) {
    e?.preventDefault(); const body = text.trim(); if (!body || busy) return; setBusy(true); setErr("");
    const r = await fetch(`/api/chat/${encodeURIComponent(key)}`, { method: "POST", body: JSON.stringify({ body, topic }) }); const j = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Couldn't send. Try again.");
    setText(""); stick.current = true; if (j.room && j.room !== key) setKey(j.room); else load();
  }
  return (
    <div className="glass flex h-[calc(100dvh-15rem)] min-h-[360px] flex-col overflow-hidden rounded-2xl lg:h-[calc(100dvh-14rem)]">
      <div ref={box} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Messages">
        {ready && msgs.length === 0 && <p className="py-10 text-center text-sm text-[var(--mut)]">{empty}</p>}
        {msgs.map((m) => { const mine = m.userId === meId && !m.fromStaff; return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${m.hidden ? "border border-dashed border-[var(--line)] text-[var(--mut)]" : mine ? "grad-brand" : m.fromStaff ? "grad-dark" : "bg-[var(--line)]"}`}>
              {!mine && !m.hidden && <p className={`text-xs font-semibold ${m.fromStaff ? "text-lime-givar" : "text-[var(--mut)]"}`}>{m.name}{m.fromStaff && " · staff"}</p>}
              <p className="whitespace-pre-wrap break-words text-sm">{m.hidden ? "This message was removed by a moderator." : m.body}</p>
              <p className="mt-0.5 text-right text-[10px] opacity-70">{time(m.at)}</p>
            </div></div>); })}
      </div>
      {canned.length > 0 && <div className="flex gap-2 overflow-x-auto border-t border-[var(--line)] px-3 py-2">{canned.map((c) => <button key={c} type="button" onClick={() => setText(c)} className="whitespace-nowrap rounded-full border border-[var(--line)] px-3 py-1 text-xs">{c.slice(0, 40)}{c.length > 40 ? "…" : ""}</button>)}</div>}
      <form onSubmit={send} className="border-t border-[var(--line)] p-3">
        {err && <p role="alert" className="mb-2 text-xs text-red-500">{err}</p>}
        <div className="flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} maxLength={500} placeholder={placeholder} aria-label="Message" className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm outline-none focus:border-lime-givar" />
          <button disabled={busy || !text.trim()} aria-label="Send message" className="bg-lime-givar grid h-11 w-11 shrink-0 place-items-center rounded-full disabled:opacity-50"><Send size={18} aria-hidden /></button>
        </div>
      </form>
    </div>
  );
}
