import Link from "next/link";
import { redirect } from "next/navigation";
import { BellOff, Gift, Info, Lock, ShieldCheck, Trophy, Wallet, Settings, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { ago } from "@/lib/admin";
import { markAllRead, openNotification } from "./actions";

export const metadata = { title: "Notifications", robots: { index: false } };
export const dynamic = "force-dynamic";
const SIZE = 20;
const ICON: Record<string, LucideIcon> = { DEPOSIT: Wallet, WITHDRAWAL: Wallet, CLAIM: Gift, GIVEAWAY: Gift, CONTEST: Trophy, KYC: ShieldCheck, SECURITY: Lock, SYSTEM: Info };
const day = (d: Date) => { const n = new Date(), y = new Date(Date.now() - 864e5); return d.toDateString() === n.toDateString() ? "Today" : d.toDateString() === y.toDateString() ? "Yesterday" : d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }); };

export default async function Notifications({ searchParams }: { searchParams: { tab?: string; page?: string } }) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const unreadOnly = searchParams.tab === "unread", page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const where = { userId, ...(unreadOnly ? { readAt: null } : {}) };
  const [rows, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE }),
    prisma.notification.count({ where }), prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  const groups = new Map<string, typeof rows>();
  for (const n of rows) { const k = day(n.createdAt); groups.set(k, [...(groups.get(k) ?? []), n]); }
  const pages = Math.max(1, Math.ceil(total / SIZE)), href = (p: number) => `/notifications?${unreadOnly ? "tab=unread&" : ""}page=${p}`;
  return (
    <main className="page max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold lg:text-3xl">Notifications</h1><p className="text-sm text-[var(--mut)]">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p></div>
        <Link href="/notifications/settings" className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"><Settings size={16} aria-hidden />Settings</Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[["", "All"], ["unread", "Unread"]].map(([k, l]) => <Link key={k} href={k ? "/notifications?tab=unread" : "/notifications"} aria-current={(unreadOnly ? "unread" : "") === k ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${(unreadOnly ? "unread" : "") === k ? "bg-lime-givar" : "glass"}`}>{l}</Link>)}
        {unread > 0 && <form action={markAllRead} className="ml-auto"><button className="text-sm font-semibold text-lime-givar">Mark all as read</button></form>}
      </div>
      {rows.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-10 text-center"><BellOff size={32} className="text-[var(--mut)]" aria-hidden /><p className="font-semibold">{unreadOnly ? "No unread notifications" : "Nothing here yet"}</p><p className="text-sm text-[var(--mut)]">We'll tell you when money arrives, giveaways are claimed, or something needs your attention.</p></div>
      ) : Array.from(groups).map(([label, list]) => (
        <section key={label} aria-label={label}><h2 className="mb-1 text-sm font-semibold text-[var(--mut)]">{label}</h2>
          <ul className="glass divide-y divide-[var(--line)] rounded-2xl">
            {list.map((n) => { const Icon = ICON[n.type] ?? Info; return (
              <li key={n.id}><form action={openNotification.bind(null, n.id)}>
                <button className="flex w-full items-start gap-3 p-4 text-left hover:bg-[var(--line)]/40">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${n.readAt ? "bg-[var(--line)]" : "grad-brand"}`}><Icon size={18} aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className={`block ${n.readAt ? "font-medium" : "font-bold"}`}>{n.title}</span><span className="mt-0.5 block text-sm text-[var(--mut)]">{n.body}</span><span className="mt-1 block text-xs text-[var(--mut)]">{ago(n.createdAt)}</span></span>
                  {!n.readAt && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-text)]" role="img" aria-label="Unread" />}
                </button></form></li>); })}
          </ul></section>
      ))}
      {pages > 1 && <div className="flex items-center justify-between text-sm"><span className="text-[var(--mut)]">Page {page} of {pages}</span><span className="flex gap-2">{page > 1 && <Link href={href(page - 1)} className="glass rounded-full px-4 py-2 font-semibold">← Newer</Link>}{page < pages && <Link href={href(page + 1)} className="glass rounded-full px-4 py-2 font-semibold">Older →</Link>}</span></div>}
    </main>
  );
}
