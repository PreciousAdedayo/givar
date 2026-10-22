import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/session";
import Avatar from "./Avatar";
import SidebarNav from "./SidebarNav";
import { unreadCount } from "@/lib/notify";
import { unreadChatCount } from "@/lib/chat";

/** Desktop navigation (lg and up). Phones use the bottom bar instead. */
export default async function Sidebar() {
  const s = await getSession();
  const unread = s ? await unreadCount(s.user.id).catch(() => 0) : 0;
  const chats = s ? await unreadChatCount(s.user.id).catch(() => 0) : 0;
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)] p-5 backdrop-blur lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>Givar</Link>
      <Link href="/create" className="bg-lime-givar shadow-glow mb-5 flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold"><Plus size={18} aria-hidden />Create giveaway</Link>
      <SidebarNav signedIn={!!s} admin={s?.user.role === "ADMIN"} unread={unread} chats={chats} />
      <div className="mt-auto">
        {s ? (
          <Link href="/account" className="glass flex items-center gap-3 rounded-2xl p-3"><Avatar name={s.user.name} size={40} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{s.user.name ?? "Your profile"}</span><span className="block truncate text-xs text-[var(--mut)]">{s.user.email}</span></span></Link>
        ) : (
          <div className="space-y-2"><Link href="/auth" className="bg-lime-givar block rounded-full py-2.5 text-center text-sm font-semibold">Create free account</Link><Link href="/auth" className="glass block rounded-full py-2.5 text-center text-sm font-semibold">Sign in</Link></div>
        )}
      </div>
    </aside>
  );
}
