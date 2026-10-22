import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, LifeBuoy, MessageCircle, Trophy } from "lucide-react";
import { getSession } from "@/lib/session";
import { myRooms } from "@/lib/chat";
import { ago } from "@/lib/admin";

export const metadata = { title: "Chats", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Chats() {
  const s = await getSession(); if (!s) redirect("/auth");
  const rooms = await myRooms(s.user.id);
  const hasSupport = rooms.some((r) => r.kind === "support");
  const list = hasSupport ? rooms : [{ key: "s:new", kind: "support" as const, title: "Givar support", href: "/help/chat", host: false, last: null, unread: 0 }, ...rooms];
  return (
    <main className="page max-w-2xl space-y-5">
      <div><h1 className="text-2xl font-bold lg:text-3xl">Chats</h1><p className="text-sm text-[var(--mut)]">Support, and the community chat of every giveaway and contest you host or joined.</p></div>
      <ul className="glass divide-y divide-[var(--line)] overflow-hidden rounded-2xl">
        {list.map((r) => { const Icon = r.kind === "support" ? LifeBuoy : r.kind === "contest" ? Trophy : Gift; return (
          <li key={r.key}><Link href={r.href} className="flex items-center gap-3 p-4 hover:bg-[var(--line)]/40">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${r.unread ? "grad-brand" : "bg-[var(--line)]"}`}><Icon size={19} aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`truncate ${r.unread ? "font-bold" : "font-medium"}`}>{r.title}</span>{r.kind !== "support" && <span className="shrink-0 rounded-full bg-[var(--line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--mut)]">{r.host ? "Host" : r.kind === "contest" ? "Entrant" : "Winner"}</span>}</span>
              <span className="block truncate text-sm text-[var(--mut)]">{r.last ? `${r.last.who}: ${r.last.body}` : r.kind === "support" ? "Ask us anything. A real person replies." : "No messages yet"}</span></span>
            <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-[var(--mut)]">{r.last && ago(r.last.at)}{r.unread > 0 && <span className="grad-brand rounded-full px-2 py-0.5 font-bold text-[11px]">{r.unread > 99 ? "99+" : r.unread}</span>}</span>
          </Link></li>); })}
      </ul>
      {rooms.length === 0 && <div className="glass flex flex-col items-center gap-2 rounded-2xl p-8 text-center"><MessageCircle size={30} className="text-[var(--mut)]" aria-hidden /><p className="font-semibold">No community chats yet</p><p className="text-sm text-[var(--mut)]">When you create a giveaway or contest, or claim or join one, its chat appears here.</p></div>}
    </main>
  );
}
