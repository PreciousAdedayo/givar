import Link from "next/link";
import { ChevronRight, Gift, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ago } from "@/lib/admin";
import { Card, Empty, PageHead, Pill, btnCls, inputCls } from "@/components/admin/ui";

export const metadata = { title: "Community chats" };
export const dynamic = "force-dynamic";

export default async function Communities({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim().toLowerCase();
  const rooms = await prisma.chatMessage.groupBy({ by: ["roomKey"], where: { OR: [{ roomKey: { startsWith: "g:" } }, { roomKey: { startsWith: "c:" } }] }, _count: true, _max: { createdAt: true }, orderBy: { _max: { createdAt: "desc" } }, take: 100 });
  const hidden = await prisma.chatMessage.groupBy({ by: ["roomKey"], where: { hidden: true, roomKey: { in: rooms.map((r) => r.roomKey) } }, _count: true });
  const gIds = rooms.filter((r) => r.roomKey.startsWith("g:")).map((r) => r.roomKey.slice(2)), cIds = rooms.filter((r) => r.roomKey.startsWith("c:")).map((r) => r.roomKey.slice(2));
  const [gs, cs] = await Promise.all([prisma.giveaway.findMany({ where: { id: { in: gIds } }, select: { id: true, title: true, creator: { select: { name: true } } } }), prisma.contest.findMany({ where: { id: { in: cIds } }, select: { id: true, prize: true, host: { select: { name: true } } } })]);
  const rows = rooms.map((r) => { const g = gs.find((x) => `g:${x.id}` === r.roomKey), c = cs.find((x) => `c:${x.id}` === r.roomKey); return { key: r.roomKey, kind: g ? "Giveaway" : "Contest", title: g?.title ?? c?.prize ?? "(deleted)", host: g?.creator.name ?? c?.host.name ?? "", n: r._count, last: r._max.createdAt, removed: hidden.find((h) => h.roomKey === r.roomKey)?._count ?? 0 }; }).filter((r) => !q || r.title.toLowerCase().includes(q) || r.host.toLowerCase().includes(q));
  return (
    <>
      <PageHead title="Community chats" desc="Monitor the private chats inside giveaways and contests. Open a room to read it, remove messages, mute people, or post an announcement." />
      <form className="glass mb-4 flex items-end gap-3 rounded-2xl p-4" aria-label="Search rooms"><label className="min-w-[200px] flex-1 text-xs text-[var(--mut)]">Search<input name="q" defaultValue={searchParams.q} placeholder="Giveaway, contest or host name" className={`${inputCls} mt-1`} /></label><button className={btnCls}>Search</button></form>
      <Card>
        {rows.length === 0 ? <Empty>No community messages yet.</Empty> : (
          <ul className="divide-y divide-[var(--line)]">{rows.map((r) => (
            <li key={r.key}><Link href={`/admin/communities/${encodeURIComponent(r.key)}`} className="flex items-center gap-3 py-3 hover:bg-[var(--line)]/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--line)]">{r.kind === "Giveaway" ? <Gift size={18} aria-hidden /> : <Trophy size={18} aria-hidden />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{r.title}</span><span className="block text-xs text-[var(--mut)]">{r.kind} · host {r.host || "unknown"} · {r.n} messages{r.last ? ` · active ${ago(r.last)}` : ""}</span></span>
              {r.removed > 0 && <Pill tone="bad">{r.removed} removed</Pill>}<ChevronRight size={18} className="text-[var(--mut)]" aria-hidden />
            </Link></li>))}</ul>)}
      </Card>
    </>
  );
}
