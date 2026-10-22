import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ChatRoom from "@/components/ChatRoom";

export const metadata = { title: "Chat with support", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SupportChat({ searchParams }: { searchParams: { topic?: string } }) {
  const s = await getSession(); if (!s) redirect("/auth");
  const open = await prisma.supportThread.findFirst({ where: { userId: s.user.id, status: "OPEN" }, orderBy: { createdAt: "desc" }, select: { id: true } });
  const topic = searchParams.topic?.slice(0, 120);
  return (
    <main className="page max-w-2xl space-y-3">
      <Link href="/help" className="text-sm text-[var(--mut)]">← Help</Link>
      <div><h1 className="text-2xl font-bold">Chat with support</h1><p className="text-sm text-[var(--mut)]">A real person replies, usually within a few hours. We aren&apos;t online around the clock, so leave your message and we&apos;ll get back to you.</p></div>
      <ChatRoom roomKey={open ? `s:${open.id}` : "s:new"} meId={s.user.id} topic={topic} draft={topic ? `Hi, I need help with: ${topic}. ` : ""} placeholder="Describe what you need help with…" empty="Hi! How can we help? Tell us what's going on." />
      <p className="text-xs text-[var(--mut)]">Never share your password, PIN or full card number in chat.</p>
    </main>
  );
}
