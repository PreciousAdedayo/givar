import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, dt } from "@/lib/admin";
import ChatRoom from "@/components/ChatRoom";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { Card, PageHead, Pill } from "@/components/admin/ui";
import { closeSupport, reopenSupport } from "../../actions";

export const metadata = { title: "Support chat" };
export const dynamic = "force-dynamic";
const CANNED = [
  "Hi! Thanks for contacting Givar support. Let me look into this for you.", "Could you share the transaction reference (it starts with flw_, wd_ or claim_)?",
  "Your withdrawal is being processed. USD withdrawals take 1 to 2 business days.", "Thanks for your patience. This has been fixed on our side. Please check and let us know.",
  "For your security, please never share your password or PIN. We will never ask for them.", "Is there anything else I can help you with today?",
];
export default async function SupportThreadPage({ params }: { params: { id: string } }) {
  const s = await requireAdmin();
  const t = await prisma.supportThread.findUnique({ where: { id: params.id }, include: { user: { include: { wallets: true } } } });
  if (!t) notFound();
  const u = t.user;
  return (
    <>
      <Link href="/admin/support" className="mb-3 inline-block text-sm text-[var(--mut)]">← Support inbox</Link>
      <PageHead title={u.name ?? u.email ?? "Customer"} desc={`Chat started ${dt(t.createdAt)}${t.subject ? ` · ${t.subject}` : ""}`} right={<span className="flex items-center gap-2"><Pill tone={t.status === "OPEN" ? "ok" : "mute"}>{t.status.toLowerCase()}</Pill>{t.status === "OPEN" ? <form action={closeSupport.bind(null, t.id)}><button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">Close chat</button></form> : <form action={reopenSupport.bind(null, t.id)}><button className="bg-lime-givar rounded-full px-4 py-2 text-sm font-semibold">Reopen</button></form>}</span>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ChatRoom roomKey={`s:${t.id}`} meId={s.user.id} canned={CANNED} placeholder="Reply to the customer…" empty="No messages yet." />
        <aside className="space-y-4"><Card title="Customer"><dl className="space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[var(--mut)]">Email</dt><dd className="break-all text-right">{u.email ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--mut)]">Phone</dt><dd>{u.phone ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--mut)]">KYC</dt><dd>{u.kyc.toLowerCase()}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--mut)]">Status</dt><dd>{u.banned ? "banned" : "active"}</dd></div></dl><Link href={`/admin/users/${u.id}`} className="mt-3 inline-block text-sm text-lime-givar underline">Open full profile →</Link></Card>
          <p className="text-xs text-[var(--mut)]">Replies show as &quot;Givar Team&quot;. The customer is notified, and emailed if they are offline.</p></aside>
      </div>
      <AutoRefresh seconds={30} />
    </>
  );
}
