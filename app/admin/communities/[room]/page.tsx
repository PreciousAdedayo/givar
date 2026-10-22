import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dt, requireAdmin } from "@/lib/admin";
import { parseRoom } from "@/lib/chat";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { Card, PageHead, Pill, btnCls, inputCls } from "@/components/admin/ui";
import { hideMessage, muteChatUser, staffAnnounce } from "../../actions";

export const metadata = { title: "Community chat" };
export const dynamic = "force-dynamic";

export default async function CommunityRoom({ params }: { params: { room: string } }) {
  await requireAdmin();
  const key = decodeURIComponent(params.room), r = parseRoom(key); if (!r || r.kind === "s") notFound();
  const info = r.kind === "g" ? await prisma.giveaway.findUnique({ where: { id: r.id }, select: { title: true, claimSlug: true, creator: { select: { id: true, name: true } }, _count: { select: { claims: true } } } }) : await prisma.contest.findUnique({ where: { id: r.id }, select: { prize: true, host: { select: { id: true, name: true } }, _count: { select: { entries: true } } } });
  if (!info) notFound();
  const title = "title" in info ? info.title : info.prize, host = "creator" in info ? info.creator : info.host, members = "claims" in info._count ? info._count.claims : info._count.entries;
  const msgs = await prisma.chatMessage.findMany({ where: { roomKey: key }, orderBy: { createdAt: "asc" }, take: 300, include: { user: { select: { id: true, name: true, email: true, chatMutedUntil: true } } } });
  const back = `/admin/communities/${encodeURIComponent(key)}`;
  return (
    <>
      <Link href="/admin/communities" className="mb-3 inline-block text-sm text-[var(--mut)]">← All community chats</Link>
      <PageHead title={title} desc={`${r.kind === "g" ? "Giveaway" : "Contest"} community · host ${host.name ?? "unknown"} · ${members} participant${members === 1 ? "" : "s"} · ${msgs.length} messages`} right={<Link href={r.kind === "g" ? `/c/${"claimSlug" in info ? info.claimSlug : r.id}` : `/contests/${r.id}`} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">Open public page</Link>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card title="Transcript (live, read-only)">
          {msgs.length === 0 ? <p className="py-8 text-center text-sm text-[var(--mut)]">No messages yet.</p> : (
            <ul className="divide-y divide-[var(--line)]">{msgs.map((m) => (
              <li key={m.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{m.fromStaff ? "Givar Team" : (m.user.name ?? m.user.email)}{m.user.id === host.id && !m.fromStaff && <span className="ml-2 text-xs text-lime-givar">host</span>}{m.user.chatMutedUntil && m.user.chatMutedUntil > new Date() && <span className="ml-2"><Pill tone="bad">muted</Pill></span>}</span><span className="text-xs text-[var(--mut)]">{dt(m.createdAt)}</span></div>
                <p className={`mt-1 whitespace-pre-wrap break-words ${m.hidden ? "text-[var(--mut)] line-through" : ""}`}>{m.body}</p>
                {m.hidden && <p className="text-xs text-red-500">Removed from the chat. Users see &quot;removed by a moderator&quot;.</p>}
                {!m.fromStaff && <div className="mt-2 flex flex-wrap items-center gap-2">
                  <form action={hideMessage.bind(null, m.id, !m.hidden, back)}><button className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold">{m.hidden ? "Restore message" : "Remove message"}</button></form>
                  <form action={muteChatUser.bind(null, m.user.id, back)} className="flex items-center gap-1"><select name="hours" className={`${inputCls} !w-auto !py-1 text-xs`} aria-label="Mute for"><option value="24">Mute 24h</option><option value="168">Mute 7 days</option><option value="720">Mute 30 days</option><option value="0">Unmute</option></select><button className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-semibold text-red-500">Apply</button></form></div>}
              </li>))}</ul>)}
        </Card>
        <aside className="space-y-4">
          <Card title="Post as Givar Team"><form action={staffAnnounce.bind(null, key)} className="space-y-2"><textarea name="body" rows={3} maxLength={500} required placeholder="e.g. Please keep the chat friendly and on topic." className={inputCls} /><button className={btnCls}>Post announcement</button></form><p className="mt-2 text-xs text-[var(--mut)]">Everyone in the room will see it, marked as staff.</p></Card>
          <Card title="About monitoring"><p className="text-xs text-[var(--mut)]">Members are told that moderators can review chats. Removing a message hides it for everyone but keeps it here. Muting stops a person from posting in any chat. Every action is recorded in the audit log.</p></Card>
        </aside>
      </div>
      <AutoRefresh seconds={10} />
    </>
  );
}
