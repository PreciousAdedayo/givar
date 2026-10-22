import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NOTICE, roomAccess } from "@/lib/chat";
import ChatRoom from "@/components/ChatRoom";

export const metadata = { title: "Giveaway community", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function GiveawayCommunity({ params }: { params: { code: string } }) {
  const s = await getSession(); if (!s) redirect("/auth");
  const g = await prisma.giveaway.findFirst({ where: { OR: [{ id: params.code }, { claimSlug: params.code }, { claimCode: params.code.toUpperCase() }] }, select: { id: true, title: true, claimSlug: true, _count: { select: { claims: true } } } });
  if (!g) notFound();
  const access = await roomAccess(`g:${g.id}`, s.user.id, "USER");
  if (!access) return (
    <main className="page max-w-md space-y-3"><div className="glass space-y-2 rounded-2xl p-6"><h1 className="text-xl font-bold">Members only</h1><p className="text-sm text-[var(--mut)]">This chat is for the host and the people who claimed this giveaway.</p><Link href={`/c/${g.claimSlug}`} className="bg-lime-givar inline-block rounded-full px-5 py-2.5 font-semibold">Back to the giveaway</Link></div></main>
  );
  return (
    <main className="page max-w-2xl space-y-3">
      <Link href={`/c/${g.claimSlug}`} className="text-sm text-[var(--mut)]">← {g.title}</Link>
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold">{g.title} · Community</h1><span className="grad-soft rounded-full px-2.5 py-0.5 text-xs font-semibold">{access.role === "owner" ? "You are the host" : "You are a winner"}</span><span className="text-xs text-[var(--mut)]">{g._count.claims + 1} members</span></div>
      <ChatRoom roomKey={access.key} meId={s.user.id} placeholder="Message the community…" empty="No messages yet. Say hello to the host and the other winners." />
      <p className="text-xs text-[var(--mut)]">{NOTICE}</p>
    </main>
  );
}
