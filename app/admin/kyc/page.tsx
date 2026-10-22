import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, ago, pageNum } from "@/lib/admin";
import Avatar from "@/components/Avatar";
import { Card, Empty, PageHead, Pager, Pill, inputCls, btnCls } from "@/components/admin/ui";

export const metadata = { title: "KYC reviews" };
export const dynamic = "force-dynamic";
const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

export default async function KycQueue({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  const status = (TABS as readonly string[]).includes(searchParams.status ?? "") ? searchParams.status! : "PENDING";
  const q = searchParams.q?.trim(), page = pageNum(searchParams.page);
  const where: Prisma.KycSubmissionWhereInput = { ...(status !== "ALL" ? { status } : {}), ...(q ? { OR: [{ legalName: { contains: q, mode: "insensitive" } }, { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } }] } : {}) };
  const [rows, total, counts] = await Promise.all([
    prisma.kycSubmission.findMany({ where, orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { user: { select: { name: true, email: true, phone: true, image: true } }, _count: { select: { docs: true } } } }),
    prisma.kycSubmission.count({ where }),
    prisma.kycSubmission.groupBy({ by: ["status"], _count: true }),
  ]);
  const n = (s: string) => s === "ALL" ? counts.reduce((a, c) => a + c._count, 0) : counts.find((c) => c.status === s)?._count ?? 0;
  return (
    <>
      <PageHead title="KYC reviews" desc="Click a submission to see the full details and documents, then approve or reject." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => <Link key={t} href={`/admin/kyc?status=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={status === t ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${status === t ? "bg-lime-givar" : "glass"}`}>{t === "ALL" ? "All" : t[0] + t.slice(1).toLowerCase()} <span className="opacity-70">({n(t)})</span></Link>)}
        <form className="ml-auto flex gap-2"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search name or email" className={`${inputCls} w-56`} aria-label="Search KYC" /><button className={btnCls}>Search</button></form>
      </div>
      <Card>
        {rows.length === 0 ? <Empty>{status === "PENDING" ? "Nothing waiting. Great job." : "No submissions here."}</Empty> : (
          <ul className="divide-y divide-[var(--line)]">{rows.map((k) => (
            <li key={k.id}>
              <Link href={`/admin/kyc/${k.id}`} className="flex items-center gap-3 py-3 hover:bg-[var(--line)]/40">
                <Avatar name={k.user.name} image={k.user.image} size={40} />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{k.legalName ?? k.user.name ?? "Unnamed"}</span><span className="block truncate text-xs text-[var(--mut)]">{k.user.email ?? k.user.phone} · {k.kind} ••••{k.idLast4} · {k.country} · {k._count.docs} document{k._count.docs === 1 ? "" : "s"}</span></span>
                <span className="hidden text-xs text-[var(--mut)] sm:block">{ago(k.createdAt)}</span>
                <Pill tone={k.status === "APPROVED" ? "ok" : k.status === "REJECTED" ? "bad" : "mute"}>{k.status.toLowerCase()}</Pill><ChevronRight size={18} className="text-[var(--mut)]" aria-hidden />
              </Link>
            </li>))}</ul>
        )}
      </Card>
      <Pager page={page} total={total} size={PAGE_SIZE} path="/admin/kyc" params={{ status, q }} />
    </>
  );
}
