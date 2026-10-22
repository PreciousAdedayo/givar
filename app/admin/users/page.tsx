import Link from "next/link";
import { KycStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, ago, pageNum } from "@/lib/admin";
import Avatar from "@/components/Avatar";
import { Card, Empty, PageHead, Pager, Pill, btnCls, ghostCls, inputCls } from "@/components/admin/ui";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function Users({ searchParams }: { searchParams: { q?: string; kyc?: string; status?: string; page?: string } }) {
  const q = searchParams.q?.trim(), page = pageNum(searchParams.page);
  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { id: q }];
  if (searchParams.kyc && searchParams.kyc in KycStatus) where.kyc = searchParams.kyc as KycStatus;
  if (searchParams.status === "banned") where.banned = true; else if (searchParams.status === "active") where.banned = false;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { _count: { select: { giveaways: true, claims: true } }, kycSubmissions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } } } }),
    prisma.user.count({ where }),
  ]);
  return (
    <>
      <PageHead title="Users" desc={`${total.toLocaleString()} matching`} />
      <form className="glass mb-4 flex flex-wrap items-end gap-3 rounded-2xl p-4" aria-label="Filter users">
        <label className="min-w-[200px] flex-1 text-xs text-[var(--mut)]">Search<input name="q" defaultValue={q} placeholder="Name, email, phone or ID" className={`${inputCls} mt-1`} /></label>
        <label className="text-xs text-[var(--mut)]">KYC<select name="kyc" defaultValue={searchParams.kyc ?? ""} className={`${inputCls} mt-1`}><option value="">Any</option>{Object.keys(KycStatus).map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="text-xs text-[var(--mut)]">Account<select name="status" defaultValue={searchParams.status ?? ""} className={`${inputCls} mt-1`}><option value="">Any</option><option value="active">Active</option><option value="banned">Banned</option></select></label>
        <button className={btnCls}>Filter</button><Link href="/admin/users" className={ghostCls}>Reset</Link>
      </form>
      <Card>
        {users.length === 0 ? <Empty>No users match.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-[var(--mut)]"><tr><th className="pb-2 font-medium">User</th><th className="pb-2 font-medium">KYC</th><th className="pb-2 font-medium">Activity</th><th className="pb-2 font-medium">Joined</th><th className="pb-2 font-medium">Status</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--line)]">
                <td className="py-3"><Link href={`/admin/users/${u.id}`} className="flex items-center gap-3"><Avatar name={u.name} image={u.image} size={36} /><span><span className="block font-medium">{u.name ?? "Unnamed"}</span><span className="block text-xs text-[var(--mut)]">{u.email ?? u.phone}</span></span></Link></td>
                <td>{u.kycSubmissions[0] ? <Link href={`/admin/kyc/${u.kycSubmissions[0].id}`}><Pill tone={u.kyc === "VERIFIED" ? "ok" : u.kyc === "REJECTED" ? "bad" : "mute"}>{u.kyc.toLowerCase()} · review →</Pill></Link> : <Pill>{u.kyc.toLowerCase()}</Pill>}</td>
                <td className="text-[var(--mut)]">{u._count.giveaways} created · {u._count.claims} claims</td>
                <td className="text-[var(--mut)]">{ago(u.createdAt)}</td>
                <td>{u.banned ? <Pill tone="bad">banned</Pill> : <Pill tone="ok">active</Pill>}</td>
              </tr>))}</tbody></table></div>
        )}
      </Card>
      <Pager page={page} total={total} size={PAGE_SIZE} path="/admin/users" params={{ q, kyc: searchParams.kyc, status: searchParams.status }} />
    </>
  );
}
