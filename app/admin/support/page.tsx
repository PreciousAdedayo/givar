import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ago } from "@/lib/admin";
import Avatar from "@/components/Avatar";
import { Card, Empty, PageHead, Pill } from "@/components/admin/ui";

export const metadata = { title: "Support inbox" };
export const dynamic = "force-dynamic";
const TABS = [["reply", "Needs reply"], ["open", "Open"], ["closed", "Closed"], ["all", "All"]] as const;

export default async function Support({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = TABS.some((t) => t[0] === searchParams.tab) ? searchParams.tab! : "reply";
  const threads = await prisma.supportThread.findMany({ where: tab === "closed" ? { status: "CLOSED" } : tab === "all" ? {} : { status: "OPEN" }, orderBy: { updatedAt: "desc" }, take: 100, include: { user: { select: { id: true, name: true, email: true, image: true } } } });
  const keys = threads.map((t) => `s:${t.id}`);
  const last = keys.length ? await prisma.$queryRaw<{ roomKey: string; body: string; createdAt: Date; fromStaff: boolean }[]>(Prisma.sql`SELECT DISTINCT ON ("roomKey") "roomKey", body, "createdAt", "fromStaff" FROM "ChatMessage" WHERE "roomKey" IN (${Prisma.join(keys)}) ORDER BY "roomKey", "createdAt" DESC`) : [];
  const rows = threads.map((t) => { const l = last.find((x) => x.roomKey === `s:${t.id}`); return { t, l, needs: t.status === "OPEN" && (!l || !l.fromStaff) }; }).filter((r) => tab !== "reply" || r.needs);
  return (
    <>
      <PageHead title="Support inbox" desc="Customers chatting with support. Open one to reply." />
      <div className="mb-4 flex flex-wrap gap-2">{TABS.map(([k, l]) => <Link key={k} href={`/admin/support?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-lime-givar" : "glass"}`}>{l}</Link>)}</div>
      <Card>
        {rows.length === 0 ? <Empty>{tab === "reply" ? "Nobody is waiting for a reply. Great job." : "No chats here."}</Empty> : (
          <ul className="divide-y divide-[var(--line)]">{rows.map(({ t, l, needs }) => (
            <li key={t.id}><Link href={`/admin/support/${t.id}`} className="flex items-center gap-3 py-3 hover:bg-[var(--line)]/40">
              <Avatar name={t.user.name} image={t.user.image} size={40} />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`truncate ${needs ? "font-bold" : "font-medium"}`}>{t.user.name ?? t.user.email}</span>{t.subject && <span className="truncate text-xs text-[var(--mut)]">· {t.subject}</span>}</span><span className="block truncate text-sm text-[var(--mut)]">{l ? `${l.fromStaff ? "You: " : ""}${l.body}` : "No messages"}</span></span>
              <span className="hidden text-xs text-[var(--mut)] sm:block">{ago(l?.createdAt ?? t.updatedAt)}</span>
              {needs ? <Pill tone="ok">needs reply</Pill> : <Pill>{t.status.toLowerCase()}</Pill>}<ChevronRight size={18} className="text-[var(--mut)]" aria-hidden />
            </Link></li>))}</ul>)}
      </Card>
    </>
  );
}
