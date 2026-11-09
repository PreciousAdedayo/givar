import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { ago } from "@/lib/admin";
import { loadAnalytics, parseFilters } from "@/lib/analytics";
import { Card, PageHead, Pill, Stat } from "@/components/admin/ui";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function Overview() {
  const f = parseFilters({ r: "14" });
  const week = new Date(Date.now() - 7 * 864e5);
  const [a, users, giveaways, contests, given, fees, pendingKyc, pendingWd, failed, flagged, newUsers, newKyc] = await Promise.all([
    loadAnalytics(f),
    prisma.user.count(), prisma.giveaway.count(), prisma.contest.count(), prisma.claim.aggregate({ _sum: { amount: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "FEE", status: "SUCCESS", wallet: { currency: "NGN" } } }),
    prisma.kycSubmission.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.analyticsEvent.count({ where: { type: { in: ["webhook_failed", "provision_failed"] }, createdAt: { gte: week } } }),
    prisma.giveaway.count({ where: { flagged: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, email: true, phone: true, createdAt: true } }),
    prisma.kycSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } } } }),
  ]);
  const todo: [string, number, string][] = [["KYC waiting for review", pendingKyc, "/admin/kyc?status=PENDING"], ["Withdrawals pending", pendingWd, "/admin/transactions?type=WITHDRAWAL&status=PENDING"], ["Failed webhooks (7 days)", failed, "/admin/logs"], ["Flagged giveaways", flagged, "/admin/giveaways?show=hidden"]];
  return (
    <>
      <PageHead title="Overview" desc="What needs your attention, and how the platform is doing." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todo.map(([l, n, h]) => <Stat key={l} label={l} value={String(n)} href={h} tone={n > 0 && l.startsWith("KYC") ? "brand" : undefined} sub={n > 0 ? "Open →" : "All clear"} />)}
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Users" value={users.toLocaleString()} /><Stat label="Giveaways" value={giveaways.toLocaleString()} /><Stat label="Given out (claimed)" value={fmt(given._sum.amount ?? 0)} /><Stat label="Revenue (NGN fees)" value={fmt(fees._sum.amount ?? 0)} sub={`${contests} contests run`} />
      </div>
      <Card title="Last 14 days" action={<Link href="/admin/analytics" className="flex items-center text-sm text-lime-givar">Full analytics with filters<ChevronRight size={16} aria-hidden /></Link>} className="mb-5"><AnalyticsCharts data={a} only={["visitors", "signups"]} /></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Newest users" action={<Link href="/admin/users" className="text-sm text-lime-givar">All users</Link>}>
          <ul className="divide-y divide-[var(--line)] text-sm">{newUsers.map((u) => <li key={u.id}><Link href={`/admin/users/${u.id}`} className="flex justify-between gap-3 py-2.5"><span className="truncate">{u.name ?? u.email ?? u.phone}</span><span className="text-[var(--mut)]">{ago(u.createdAt)}</span></Link></li>)}</ul>
        </Card>
        <Card title="Latest KYC submissions" action={<Link href="/admin/kyc" className="text-sm text-lime-givar">All reviews</Link>}>
          {newKyc.length === 0 ? <p className="text-sm text-[var(--mut)]">No submissions yet.</p> : <ul className="divide-y divide-[var(--line)] text-sm">{newKyc.map((k) => <li key={k.id}><Link href={`/admin/kyc/${k.id}`} className="flex items-center justify-between gap-3 py-2.5"><span className="truncate">{k.user.name ?? "Unnamed"} · {k.kind}</span><span className="flex items-center gap-2"><Pill tone={k.status === "APPROVED" ? "ok" : k.status === "REJECTED" ? "bad" : "mute"}>{k.status.toLowerCase()}</Pill><span className="text-[var(--mut)]">{ago(k.createdAt)}</span></span></Link></li>)}</ul>}
        </Card>
      </div>
    </>
  );
}
