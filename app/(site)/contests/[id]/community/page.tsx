import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NOTICE, roomAccess } from "@/lib/chat";
import ChatRoom from "@/components/ChatRoom";

export const metadata = { title: "Contest community", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ContestCommunity({ params }: { params: { id: string } }) {
  const s = await getSession(); if (!s) redirect("/auth");
  const c = await prisma.contest.findUnique({ where: { id: params.id }, select: { id: true, prize: true, _count: { select: { entries: true } } } });
  if (!c) notFound();
  const access = await roomAccess(`c:${c.id}`, s.user.id, "USER");
  if (!access) return (
    <main className="page max-w-md space-y-3"><div className="glass space-y-2 rounded-2xl p-6"><h1 className="text-xl font-bold">Members only</h1><p className="text-sm text-[var(--mut)]">This chat is for the host and the people who entered this contest.</p><Link href={`/contests/${c.id}`} className="bg-lime-givar inline-block rounded-full px-5 py-2.5 font-semibold">Back to the contest</Link></div></main>
  );
  return (
    <main className="page max-w-2xl space-y-3">
      <Link href={`/contests/${c.id}`} className="text-sm text-[var(--mut)]">← {c.prize}</Link>
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold">{c.prize} · Community</h1><span className="grad-soft rounded-full px-2.5 py-0.5 text-xs font-semibold">{access.role === "owner" ? "You are the host" : "You entered"}</span><span className="text-xs text-[var(--mut)]">{c._count.entries + 1} members</span></div>
      <ChatRoom roomKey={access.key} meId={s.user.id} placeholder="Message the community…" empty="No messages yet. Say hello to the host and other entrants." />
      <p className="text-xs text-[var(--mut)]">{NOTICE}</p>
    </main>
  );
}
