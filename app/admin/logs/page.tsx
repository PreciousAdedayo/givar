import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, dt, pageNum } from "@/lib/admin";
import { Card, Empty, PageHead, Pager } from "@/components/admin/ui";

export const metadata = { title: "Logs" };
export const dynamic = "force-dynamic";

export default async function Logs({ searchParams }: { searchParams: { tab?: string; page?: string } }) {
  const tab = searchParams.tab === "audit" ? "audit" : "events", page = pageNum(searchParams.page), skip = (page - 1) * PAGE_SIZE;
  const [events, eventTotal, audit, auditTotal] = await Promise.all([
    tab === "events" ? prisma.analyticsEvent.findMany({ where: { type: { not: "pageview" } }, orderBy: { createdAt: "desc" }, skip, take: PAGE_SIZE }) : [],
    prisma.analyticsEvent.count({ where: { type: { not: "pageview" } } }),
    tab === "audit" ? prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip, take: PAGE_SIZE }) : [],
    prisma.auditLog.count(),
  ]);
  const adminIds = Array.from(new Set(audit.map((a) => a.adminId)));
  const admins = adminIds.length ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true, email: true } }) : [];
  const who = (id: string) => { const a = admins.find((x) => x.id === id); return a?.name ?? a?.email ?? id; };
  const Tab = ({ k, l, n }: { k: string; l: string; n: number }) => <Link href={`/admin/logs?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-lime-givar" : "glass"}`}>{l} ({n})</Link>;
  return (
    <>
      <PageHead title="Logs" desc="Webhook and provisioning failures, browser errors, and everything admins have done." />
      <div className="mb-4 flex gap-2"><Tab k="events" l="System events" n={eventTotal} /><Tab k="audit" l="Admin audit log" n={auditTotal} /></div>
      <Card>
        {tab === "events" ? (events.length === 0 ? <Empty>No system events. Everything is running cleanly.</Empty> : (
          <ul className="divide-y divide-[var(--line)] text-sm">{events.map((e) => { const m = e.meta as { error?: string; message?: string } | null; return <li key={e.id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{e.type}{e.path ? ` · ${e.path}` : ""}</span><span className="text-xs text-[var(--mut)]">{dt(e.createdAt)}</span></div><p className="mt-1 break-words text-xs text-[var(--mut)]">{(m?.error ?? m?.message ?? "").toString().slice(0, 300)}</p></li>; })}</ul>))
          : (audit.length === 0 ? <Empty>No admin actions recorded yet.</Empty> : (
          <ul className="divide-y divide-[var(--line)] text-sm">{audit.map((a) => <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span><b className="font-medium">{who(a.adminId)}</b> · {a.action}</span><span className="text-xs text-[var(--mut)]"><span className="font-mono">{a.target}</span> · {dt(a.createdAt)}</span></li>)}</ul>))}
      </Card>
      <Pager page={page} total={tab === "events" ? eventTotal : auditTotal} size={PAGE_SIZE} path="/admin/logs" params={{ tab }} />
    </>
  );
}
