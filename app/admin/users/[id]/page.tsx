import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { ago, dt } from "@/lib/admin";
import Avatar from "@/components/Avatar";
import TxTable from "@/components/TxTable";
import { Card, PageHead, Pill, ghostCls } from "@/components/admin/ui";
import { toggleBan } from "../../actions";

export const metadata = { title: "User" };
export const dynamic = "force-dynamic";

const Fact = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-4 border-t border-[var(--line)] py-2 text-sm first:border-0"><span className="text-[var(--mut)]">{k}</span><span className="text-right">{v}</span></div>;
export default async function UserDetail({ params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({ where: { id: params.id }, include: { wallets: true, accounts: true, kycSubmissions: { orderBy: { createdAt: "desc" } }, _count: { select: { giveaways: true, claims: true, entries: true, contests: true } } } });
  if (!u) notFound();
  const txs = await prisma.transaction.findMany({ where: { wallet: { userId: u.id } }, orderBy: { createdAt: "desc" }, take: 10, include: { wallet: { select: { currency: true } } } });
  const w = (c: "NGN" | "USD") => u.wallets.find((x) => x.currency === c);
  return (
    <>
      <Link href="/admin/users" className="mb-3 inline-block text-sm text-[var(--mut)]">← All users</Link>
      <PageHead title={u.name ?? "Unnamed user"} desc={`ID ${u.id}`} right={<form action={toggleBan.bind(null, u.id)}><button className={ghostCls}>{u.banned ? "Unban user" : "Ban user"}</button></form>} />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card><div className="flex items-center gap-3"><Avatar name={u.name} image={u.image} size={56} /><div><p className="font-semibold">{u.name ?? "Unnamed"}</p><p className="text-sm text-[var(--mut)]">{u.email ?? u.phone}</p></div></div>
            <div className="mt-4">
              <Fact k="Role" v={<Pill tone={u.role === "ADMIN" ? "ok" : "mute"}>{u.role.toLowerCase()}</Pill>} /><Fact k="Account" v={u.banned ? <Pill tone="bad">banned</Pill> : <Pill tone="ok">active</Pill>} />
              <Fact k="Email" v={u.email ? <>{u.email} {u.emailVerified ? <Pill tone="ok">verified</Pill> : <Pill>unverified</Pill>}</> : "—"} /><Fact k="Phone" v={u.phone ? <>{u.phone} {u.phoneVerified ? <Pill tone="ok">verified</Pill> : <Pill>unverified</Pill>}</> : "—"} />
              <Fact k="Country" v={u.country ?? "—"} /><Fact k="Joined" v={`${dt(u.createdAt)} (${ago(u.createdAt)})`} />
            </div></Card>
          <Card title="Activity"><Fact k="Giveaways created" v={u._count.giveaways} /><Fact k="Giveaways claimed" v={u._count.claims} /><Fact k="Contests hosted" v={u._count.contests} /><Fact k="Contests entered" v={u._count.entries} /></Card>
        </div>
        <div className="space-y-4">
          <Card title="Wallets"><div className="grid grid-cols-2 gap-3"><div className="grad-brand rounded-xl p-3"><p className="text-xs">NGN</p><p className="text-xl font-bold">{fmt(w("NGN")?.balance ?? 0)}</p><p className="text-xs">{fmt(w("NGN")?.locked ?? 0)} held</p></div><div className="grad-dark rounded-xl p-3"><p className="text-xs opacity-80">USD</p><p className="text-xl font-bold">{fmt(w("USD")?.balance ?? 0, "USD")}</p><p className="text-xs opacity-80">{fmt(w("USD")?.locked ?? 0, "USD")} held</p></div></div>
            {u.accounts.length > 0 && <div className="mt-3 text-sm">{u.accounts.map((a) => <Fact key={a.id} k={`${a.currency} · ${a.bankName} (${a.provider})`} v={<span className="font-mono">{a.accountNumber}</span>} />)}</div>}</Card>
          <Card title="Identity verification (KYC)">
            <p className="mb-2 text-sm">Current status: <Pill tone={u.kyc === "VERIFIED" ? "ok" : u.kyc === "REJECTED" ? "bad" : "mute"}>{u.kyc.toLowerCase()}</Pill></p>
            {u.kycSubmissions.length === 0 ? <p className="text-sm text-[var(--mut)]">No submissions.</p> : <ul className="divide-y divide-[var(--line)] text-sm">{u.kycSubmissions.map((k) => <li key={k.id}><Link href={`/admin/kyc/${k.id}`} className="flex items-center justify-between py-2.5"><span>{k.kind} ••••{k.idLast4} · {dt(k.createdAt)}</span><Pill tone={k.status === "APPROVED" ? "ok" : k.status === "REJECTED" ? "bad" : "mute"}>{k.status.toLowerCase()} →</Pill></Link></li>)}</ul>}</Card>
          <Card title="Latest transactions" action={<Link href={`/admin/transactions?user=${u.id}`} className="text-sm text-lime-givar">See all</Link>}>{txs.length === 0 ? <p className="text-sm text-[var(--mut)]">None yet.</p> : <div className="overflow-x-auto"><TxTable txs={txs} linked={false} /></div>}</Card>
        </div>
      </div>
    </>
  );
}
