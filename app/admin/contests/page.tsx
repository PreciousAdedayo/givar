import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { PAGE_SIZE, dt, pageNum } from "@/lib/admin";
import { Card, Empty, PageHead, Pager, Pill } from "@/components/admin/ui";

export const metadata = { title: "Contests" };
export const dynamic = "force-dynamic";

export default async function AdminContests({ searchParams }: { searchParams: { page?: string } }) {
  const page = pageNum(searchParams.page);
  const [rows, total] = await Promise.all([prisma.contest.findMany({ orderBy: { endsAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { host: { select: { id: true, name: true } }, _count: { select: { entries: true } } } }), prisma.contest.count()]);
  return (
    <>
      <PageHead title="Contests" desc={`${total.toLocaleString()} total`} />
      <Card>
        {rows.length === 0 ? <Empty>No contests yet.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-[var(--mut)]"><tr><th className="pb-2 font-medium">Prize</th><th className="pb-2 font-medium">Host</th><th className="pb-2 font-medium">Entries</th><th className="pb-2 font-medium">Entry fee</th><th className="pb-2 font-medium">Ends</th><th className="pb-2 font-medium">State</th></tr></thead>
            <tbody>{rows.map((c) => (
              <tr key={c.id} className="border-t border-[var(--line)]">
                <td className="py-3"><Link href={`/contests/${c.id}`} className="font-medium hover:underline">{c.prize}</Link>{c.partner && <span className="block text-xs text-[var(--mut)]">Partner: {c.partner}</span>}</td>
                <td><Link href={`/admin/users/${c.host.id}`} className="underline">{c.host.name ?? "Unnamed"}</Link></td><td>{c._count.entries}/{c.maxEntries}</td><td>{c.entryFee ? fmt(c.entryFee, c.currency) : "Free"}</td><td className="text-[var(--mut)]">{dt(c.endsAt)}</td>
                <td>{c.deliveredAt ? <Pill tone="ok">prize delivered</Pill> : c.drawnAt ? <Pill>{c.winnerId ? "drawn" : "no entries"}</Pill> : <Pill tone="ok">open</Pill>}</td>
              </tr>))}</tbody></table></div>
        )}
      </Card>
      <Pager page={page} total={total} size={PAGE_SIZE} path="/admin/contests" params={{}} />
    </>
  );
}
