import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dt, pageNum } from "@/lib/admin";
import { Card, PageHead, Pager } from "@/components/admin/ui";

export const metadata = { title: "Announcement results" };
export const dynamic = "force-dynamic";
const SIZE = 25;

export default async function BroadcastResults({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string; page?: string; sent?: string } }) {
  const b = await prisma.broadcast.findUnique({ where: { id: params.id } }); if (!b) notFound();
  const tab = ["opened", "seen", "unseen"].includes(searchParams.tab ?? "") ? searchParams.tab! : "opened", page = pageNum(searchParams.page);
  const base = { broadcastId: b.id };
  const where = tab === "opened" ? { ...base, openedAt: { not: null } } : tab === "seen" ? { ...base, readAt: { not: null }, openedAt: null } : { ...base, readAt: null };
  const [seen, opened, rows, total, opens] = await Promise.all([
    prisma.notification.count({ where: { ...base, readAt: { not: null } } }), prisma.notification.count({ where: { ...base, openedAt: { not: null } } }),
    prisma.notification.findMany({ where, orderBy: tab === "unseen" ? { createdAt: "desc" } : { openedAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { user: { select: { id: true, name: true, email: true } } } }),
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where: { ...base, openedAt: { not: null } }, select: { openedAt: true }, take: 50000 }),
  ]);
  // opens per hour for the first 24 hours after sending
  const hours = Array.from({ length: 24 }, () => 0);
  for (const o of opens) { const h = Math.floor((o.openedAt!.getTime() - b.createdAt.getTime()) / 3600000); if (h >= 0 && h < 24) hours[h]++; }
  const max = Math.max(1, ...hours), pct = (n: number) => (b.sent ? `${Math.round((n / b.sent) * 100)}%` : "0%");
  const tabs: [string, string, number][] = [["opened", "Opened it", opened], ["seen", "Saw it, didn't open", Math.max(0, seen - opened)], ["unseen", "Haven't seen it", Math.max(0, b.sent - seen)]];
  return (
    <>
      <Link href="/admin/notifications" className="mb-3 inline-block text-sm text-[var(--mut)]">← Notifications</Link>
      <PageHead title={b.title} desc={`Sent ${dt(b.createdAt)} to ${b.sent.toLocaleString()} users (${b.audience.replaceAll("_", " ")})`} />
      {searchParams.sent && <p role="status" className="grad-soft mb-4 rounded-xl p-3 text-sm">Sent to {Number(searchParams.sent).toLocaleString()} user(s). Results will fill in as people open their notifications.</p>}
      <p className="glass mb-4 rounded-2xl p-4 text-sm">{b.body}{b.href && <span className="text-[var(--mut)]"> → {b.href}</span>}</p>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Sent", b.sent.toLocaleString(), ""], ["Seen", seen.toLocaleString(), pct(seen)], ["Opened", opened.toLocaleString(), pct(opened)], ["Not seen yet", Math.max(0, b.sent - seen).toLocaleString(), pct(Math.max(0, b.sent - seen))]].map(([l, v, p]) => <div key={l} className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p>{p && <p className="text-xs text-[var(--mut)]">{p} of those sent</p>}</div>)}
      </div>
      <Card title="Opens in the first 24 hours" className="mb-4">
        <div className="flex h-28 items-end gap-1" role="img" aria-label="Opens per hour for the first 24 hours">{hours.map((n, i) => <div key={i} title={`Hour ${i + 1}: ${n}`} className="grad-brand flex-1 rounded-t" style={{ height: `${Math.max(3, (n / max) * 100)}%`, opacity: n ? 1 : 0.25 }} />)}</div>
        <div className="mt-1 flex justify-between text-xs text-[var(--mut)]"><span>sent</span><span>+12h</span><span>+24h</span></div>
      </Card>
      <div className="mb-3 flex flex-wrap gap-2">{tabs.map(([k, l, n]) => <Link key={k} href={`/admin/notifications/${b.id}?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-lime-givar" : "glass"}`}>{l} ({n.toLocaleString()})</Link>)}</div>
      <Card>{rows.length === 0 ? <p className="py-6 text-center text-sm text-[var(--mut)]">Nobody here yet.</p> : <ul className="divide-y divide-[var(--line)] text-sm">{rows.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2.5"><Link href={`/admin/users/${r.user.id}`} className="underline">{r.user.name ?? r.user.email ?? "User"}</Link><span className="text-xs text-[var(--mut)]">{tab === "opened" && r.openedAt ? `opened ${dt(r.openedAt)}` : tab === "seen" && r.readAt ? `seen ${dt(r.readAt)}` : "not seen"}</span></li>)}</ul>}</Card>
      <Pager page={page} total={total} size={SIZE} path={`/admin/notifications/${b.id}`} params={{ tab }} />
    </>
  );
}
