import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dt } from "@/lib/admin";
import { Card, PageHead, btnCls, inputCls } from "@/components/admin/ui";
import { sendBroadcast } from "../actions";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";
const ERR: Record<string, string> = { fields: "Add a title and a message.", href: "The link must be a path on this site, like /giveaways.", confirm: "Tick the box to confirm.", none: "No users match that audience." };

export default async function AdminNotifications({ searchParams }: { searchParams: { sent?: string; err?: string } }) {
  const [list, totals] = await Promise.all([
    prisma.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.groupBy({ by: ["type"], _count: true, where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } }, orderBy: { _count: { type: "desc" } } }),
  ]);
  const ids = list.map((b) => b.id);
  const [seen, opened] = ids.length ? await Promise.all([prisma.notification.groupBy({ by: ["broadcastId"], where: { broadcastId: { in: ids }, readAt: { not: null } }, _count: true }), prisma.notification.groupBy({ by: ["broadcastId"], where: { broadcastId: { in: ids }, openedAt: { not: null } }, _count: true })]) : [[], []];
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "0%");
  return (
    <>
      <PageHead title="Notifications" desc="Send an announcement to users' notification bell. See what the system has sent this week." />
      {searchParams.sent && <p role="status" className="grad-soft mb-4 rounded-xl p-3 text-sm">Sent to {Number(searchParams.sent).toLocaleString()} user(s).</p>}
      {searchParams.err && <p role="alert" className="mb-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-500">{ERR[searchParams.err] ?? "Something went wrong."}</p>}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form action={sendBroadcast} className="glass space-y-4 rounded-2xl p-5">
          <h2 className="font-semibold">New announcement</h2>
          <label className="block text-sm font-medium">Send to<select name="audience" className={`${inputCls} mt-1`} defaultValue="all"><option value="all">Everyone (not banned)</option><option value="kyc_verified">Verified users</option><option value="kyc_unverified">Users who are not verified yet</option><option value="phone_unverified">Users with an unverified phone</option><option value="one">One user (enter their email below)</option></select></label>
          <label className="block text-sm font-medium">Email of the user (only for “One user”)<input name="email" type="email" className={`${inputCls} mt-1`} /></label>
          <label className="block text-sm font-medium">Title<input name="title" maxLength={80} required className={`${inputCls} mt-1`} placeholder="New: contests with free entry" /></label>
          <label className="block text-sm font-medium">Message<textarea name="body" rows={3} maxLength={300} required className={`${inputCls} mt-1`} /></label>
          <label className="block text-sm font-medium">Link when tapped (optional)<input name="href" placeholder="/contests" className={`${inputCls} mt-1`} /></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" required className="mt-1" />I understand this appears in these users&apos; notifications right away and cannot be unsent.</label>
          <button className={btnCls}>Send announcement</button>
          <p className="text-xs text-[var(--mut)]">Announcements are in-app only. They are not emailed.</p>
        </form>
        <div className="space-y-4">
          <Card title="Sent by the system (7 days)">{totals.length === 0 ? <p className="text-sm text-[var(--mut)]">Nothing yet.</p> : <ul className="space-y-2 text-sm">{totals.map((t) => <li key={t.type} className="flex justify-between"><span>{t.type.toLowerCase()}</span><span className="text-[var(--mut)]">{t._count.toLocaleString()}</span></li>)}</ul>}</Card>
          <Card title="Recent announcements"><p className="mb-2 text-xs text-[var(--mut)]">Seen = the user opened their notifications. Opened = they tapped this one.</p>{list.length === 0 ? <p className="text-sm text-[var(--mut)]">None yet.</p> : <ul className="divide-y divide-[var(--line)] text-sm">{list.map((r) => { const s = seen.find((x) => x.broadcastId === r.id)?._count ?? 0, o = opened.find((x) => x.broadcastId === r.id)?._count ?? 0; return <li key={r.id}><Link href={`/admin/notifications/${r.id}`} className="block py-2.5 hover:bg-[var(--line)]/40"><p className="font-medium">{r.title}</p><p className="text-xs text-[var(--mut)]">{dt(r.createdAt)} · sent to {r.sent.toLocaleString()} · seen {pct(s, r.sent)} · opened {pct(o, r.sent)}</p></Link></li>; })}</ul>}</Card>
        </div>
      </div>
    </>
  );
}
