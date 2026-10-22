import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { PAGE_SIZE, ago, pageNum } from "@/lib/admin";
import { Card, Empty, PageHead, Pager, Pill, btnCls, ghostCls, inputCls } from "@/components/admin/ui";
import { cancelGiveaway, flagGiveaway } from "../actions";

export const metadata = { title: "Giveaways" };
export const dynamic = "force-dynamic";

export default async function AdminGiveaways({ searchParams }: { searchParams: { q?: string; show?: string; page?: string } }) {
  const q = searchParams.q?.trim(), page = pageNum(searchParams.page), show = searchParams.show ?? "";
  const now = new Date();
  const where: Prisma.GiveawayWhereInput = { ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { claimCode: { contains: q.toUpperCase() } }] } : {}), ...(show === "hidden" ? { flagged: true } : show === "live" ? { flagged: false, expiresAt: { gt: now }, winnersLeft: { gt: 0 } } : show === "expired" ? { expiresAt: { lte: now } } : {}) };
  const [rows, total] = await Promise.all([prisma.giveaway.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { creator: { select: { id: true, name: true } } } }), prisma.giveaway.count({ where })]);
  return (
    <>
      <PageHead title="Giveaways" desc={`${total.toLocaleString()} matching`} />
      <form className="glass mb-4 flex flex-wrap items-end gap-3 rounded-2xl p-4" aria-label="Filter giveaways">
        <label className="min-w-[200px] flex-1 text-xs text-[var(--mut)]">Search<input name="q" defaultValue={q} placeholder="Title or code" className={`${inputCls} mt-1`} /></label>
        <label className="text-xs text-[var(--mut)]">Show<select name="show" defaultValue={show} className={`${inputCls} mt-1`}><option value="">All</option><option value="live">Live</option><option value="hidden">Hidden / flagged</option><option value="expired">Expired</option></select></label>
        <button className={btnCls}>Filter</button><Link href="/admin/giveaways" className={ghostCls}>Reset</Link>
      </form>
      <Card>
        {rows.length === 0 ? <Empty>No giveaways match.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-[var(--mut)]"><tr><th className="pb-2 font-medium">Giveaway</th><th className="pb-2 font-medium">Amount</th><th className="pb-2 font-medium">Left</th><th className="pb-2 font-medium">State</th><th className="pb-2 text-right font-medium">Actions</th></tr></thead>
            <tbody>{rows.map((g) => {
              const live = !g.flagged && g.expiresAt > now && g.winnersLeft > 0;
              return (
                <tr key={g.id} className="border-t border-[var(--line)] align-top">
                  <td className="py-3"><Link href={`/c/${g.claimSlug}`} className="font-medium underline-offset-2 hover:underline">{g.title}</Link><span className="block text-xs text-[var(--mut)]">by <Link href={`/admin/users/${g.creator.id}`} className="underline">{g.creator.name ?? "Unnamed"}</Link> · {g.claimCode} · {ago(g.createdAt)}</span></td>
                  <td>{fmt(g.totalAmount, g.currency)}<span className="block text-xs text-[var(--mut)]">{fmt(g.escrowRemaining, g.currency)} in escrow</span></td>
                  <td>{g.winnersLeft}/{g.winners}</td>
                  <td>{g.flagged ? <Pill tone="bad">hidden</Pill> : live ? <Pill tone="ok">live</Pill> : <Pill>ended</Pill>}</td>
                  <td className="space-x-2 whitespace-nowrap text-right"><form className="inline" action={flagGiveaway.bind(null, g.id)}><button className={ghostCls}>{g.flagged ? "Unflag" : "Flag"}</button></form><form className="inline" action={cancelGiveaway.bind(null, g.id)}><button className={ghostCls}>Cancel &amp; refund</button></form></td>
                </tr>);
            })}</tbody></table></div>
        )}
      </Card>
      <Pager page={page} total={total} size={PAGE_SIZE} path="/admin/giveaways" params={{ q, show }} />
    </>
  );
}
