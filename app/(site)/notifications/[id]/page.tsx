import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Bell, Wallet, Gift, Trophy, ShieldCheck, Lock, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { safeHref } from "@/lib/notify-rules";

export const metadata = { title: "Notification", robots: { index: false } };
export const dynamic = "force-dynamic";
const icons: Record<string, typeof Bell> = { DEPOSIT: Wallet, WITHDRAWAL: Wallet, CLAIM: Gift, GIVEAWAY: Gift, CONTEST: Trophy, KYC: ShieldCheck, SECURITY: Lock, SYSTEM: Info, SUPPORT: Info };

export default async function NotificationDetail({ params }: { params: { id: string } }) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const n = await prisma.notification.findFirst({ where: { id: params.id, userId } });
  if (!n) notFound();
  if (!n.openedAt || !n.readAt) await prisma.notification.update({ where: { id: n.id }, data: { openedAt: n.openedAt ?? new Date(), readAt: n.readAt ?? new Date() } });
  const Icon = icons[n.type] ?? Bell;
  const destination = safeHref(n.href);
  return <main className="page max-w-2xl space-y-5">
    <Link href="/notifications" className="inline-flex items-center gap-2 text-sm text-[var(--mut)] hover:text-[var(--fg)]"><ArrowLeft size={16} />All notifications</Link>
    <article className="glass overflow-hidden rounded-3xl">
      <div className="flex items-center gap-3 border-b border-[var(--line)] p-5 sm:p-7"><span className="grad-brand grid h-12 w-12 shrink-0 place-items-center rounded-2xl"><Icon size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--mut)]">{n.type.replaceAll("_", " ")}</p><p className="text-xs text-[var(--mut)]">{n.createdAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p></div></div>
      <div className="space-y-4 p-5 sm:p-7"><h1 className="text-2xl font-bold">{n.title}</h1><p className="whitespace-pre-wrap text-base leading-7 text-[var(--mut)]">{n.body}</p>
        {n.href && <Link href={destination} className="bg-lime-givar inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">Continue <ExternalLink size={16} /></Link>}
      </div>
    </article>
  </main>;
}
