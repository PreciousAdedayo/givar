/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dt } from "@/lib/admin";
import { fmt } from "@/lib/money";
import { Card, PageHead, Pill, inputCls } from "@/components/admin/ui";
import { approveKyc, rejectKyc, reopenKyc } from "../../actions";

export const metadata = { title: "KYC review" };
export const dynamic = "force-dynamic";
const REASONS = ["Document is blurry or unreadable", "Name does not match the account", "Selfie does not match the ID photo", "Document is expired", "ID number is invalid", "Date of birth is wrong or under 18", "Other (explain below)"];
const norm = (s?: string | null) => (s ?? "").toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");
const Fact = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-4 border-t border-[var(--line)] py-2.5 text-sm first:border-0"><span className="text-[var(--mut)]">{k}</span><span className="text-right font-medium">{v}</span></div>;
const Check = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => <li className="flex items-start gap-2 text-sm">{ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-lime-givar" aria-label="Passed" /> : <TriangleAlert size={17} className="mt-0.5 shrink-0 text-red-500" aria-label="Needs attention" />}<span>{children}</span></li>;

export default async function KycReview({ params, searchParams }: { params: { id: string }; searchParams: { done?: string; err?: string } }) {
  const k = await prisma.kycSubmission.findUnique({ where: { id: params.id }, include: { docs: { select: { id: true, kind: true, mime: true, size: true } }, user: { include: { wallets: true, _count: { select: { giveaways: true, claims: true } } } } } });
  if (!k) notFound();
  const [others, history, nextPending, reviewer] = await Promise.all([
    prisma.kycSubmission.findMany({ where: { idHash: k.idHash, NOT: { userId: k.userId } }, select: { userId: true, user: { select: { name: true } } } }),
    prisma.kycSubmission.findMany({ where: { userId: k.userId, NOT: { id: k.id } }, orderBy: { createdAt: "desc" }, select: { id: true, status: true, createdAt: true, rejectReason: true } }),
    prisma.kycSubmission.findFirst({ where: { status: "PENDING", NOT: { id: k.id } }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    k.reviewedById ? prisma.user.findUnique({ where: { id: k.reviewedById }, select: { name: true, email: true } }) : null,
  ]);
  const u = k.user;
  const nameOk = !!norm(k.legalName) && norm(k.legalName) === norm(u.name);
  const age = k.dob ? Math.floor((Date.now() - new Date(`${k.dob}T00:00:00Z`).getTime()) / 31557600000) : null;
  const deposits = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "DEPOSIT", status: "SUCCESS", wallet: { userId: u.id, currency: "NGN" } } });
  return (
    <>
      <Link href="/admin/kyc" className="mb-3 inline-block text-sm text-[var(--mut)]">← All KYC reviews</Link>
      <PageHead title={k.legalName ?? u.name ?? "KYC submission"} desc={`Submitted ${dt(k.createdAt)}`} right={<Pill tone={k.status === "APPROVED" ? "ok" : k.status === "REJECTED" ? "bad" : "mute"}>{k.status.toLowerCase()}</Pill>} />
      {searchParams.done && <p role="status" className="grad-soft mb-4 rounded-xl p-3 text-sm">{searchParams.done === "already" ? "Someone already reviewed this submission." : `Submission ${searchParams.done}. ${nextPending ? "" : "The queue is empty."}`} {nextPending && <Link href={`/admin/kyc/${nextPending.id}`} className="font-semibold underline">Review next pending →</Link>}</p>}
      {searchParams.err && <p role="alert" className="mb-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-500">Choose a rejection reason first.</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card title="Documents">
            {k.docs.length === 0 ? <p className="text-sm text-[var(--mut)]">No documents were uploaded with this submission.</p> : (
              <div className="grid gap-4 sm:grid-cols-2">{k.docs.map((d) => (
                <figure key={d.id}><figcaption className="mb-1 text-xs text-[var(--mut)]">{d.kind === "SELFIE" ? "Selfie" : "ID document"} · {(d.size / 1024).toFixed(0)} KB</figcaption>
                  {d.mime.startsWith("image/") ? <a href={`/admin/kyc/${k.id}/doc/${d.id}`} target="_blank" rel="noreferrer"><img src={`/admin/kyc/${k.id}/doc/${d.id}`} alt={`${d.kind === "SELFIE" ? "Selfie" : "ID document"} uploaded by the user`} className="max-h-96 w-full rounded-xl border border-[var(--line)] bg-black/20 object-contain" /></a>
                    : <a href={`/admin/kyc/${k.id}/doc/${d.id}`} target="_blank" rel="noreferrer" className="glass block rounded-xl p-6 text-center text-sm underline">Open PDF</a>}
                </figure>))}</div>)}
            <p className="mt-3 text-xs text-[var(--mut)]">Opening a document is recorded in the audit log. Click an image to see it full size.</p>
          </Card>
          <Card title="Submitted details">
            <Fact k="Legal name" v={k.legalName ?? "—"} /><Fact k="Date of birth" v={k.dob ? `${k.dob}${age !== null ? ` (age ${age})` : ""}` : "—"} /><Fact k="Address" v={k.address ?? "—"} />
            <Fact k="ID type" v={k.kind.replaceAll("_", " ")} /><Fact k="ID number" v={`•••••••${k.idLast4} (full number is never stored)`} /><Fact k="Country" v={k.country} />
          </Card>
          {history.length > 0 && <Card title="Earlier submissions by this user"><ul className="divide-y divide-[var(--line)] text-sm">{history.map((h) => <li key={h.id}><Link href={`/admin/kyc/${h.id}`} className="flex justify-between gap-3 py-2.5"><span>{dt(h.createdAt)}{h.rejectReason ? ` · ${h.rejectReason}` : ""}</span><Pill tone={h.status === "APPROVED" ? "ok" : h.status === "REJECTED" ? "bad" : "mute"}>{h.status.toLowerCase()}</Pill></Link></li>)}</ul></Card>}
        </div>
        <div className="space-y-4">
          <Card title="Automatic checks"><ul className="space-y-2.5">
            <Check ok={nameOk}>{nameOk ? "Legal name matches the account name" : `Legal name differs from the account name (${u.name ?? "none"})`}</Check>
            <Check ok={age !== null && age >= 18}>{age !== null && age >= 18 ? `Over 18 (age ${age})` : "Under 18 or date of birth missing"}</Check>
            <Check ok={k.docs.length >= 2}>{k.docs.length >= 2 ? "ID and selfie both uploaded" : "Missing a document"}</Check>
            <Check ok={others.length === 0}>{others.length === 0 ? "ID number not used on any other account" : `Same ID number used by ${others.length} other account(s): ${others.map((o) => o.user.name ?? o.userId).join(", ")}`}</Check>
            <Check ok={u.phoneVerified}>{u.phoneVerified ? "Phone number verified" : "Phone number not verified"}</Check>
          </ul></Card>
          <Card title="Account"><Fact k="Name" v={<Link href={`/admin/users/${u.id}`} className="underline">{u.name ?? "Unnamed"}</Link>} /><Fact k="Email" v={u.email ?? "—"} /><Fact k="Phone" v={u.phone ?? "—"} /><Fact k="Member since" v={dt(u.createdAt)} /><Fact k="Activity" v={`${u._count.giveaways} created · ${u._count.claims} claims`} /><Fact k="Total deposited (NGN)" v={fmt(deposits._sum.amount ?? 0)} /></Card>
          <Card title="Decision">
            {k.status === "PENDING" ? (
              <div className="space-y-4">
                <form action={approveKyc.bind(null, k.id)}><button className="bg-lime-givar w-full rounded-full py-3 font-semibold">Approve and verify user</button></form>
                <form action={rejectKyc.bind(null, k.id)} className="space-y-2 border-t border-[var(--line)] pt-4"><label className="block text-xs text-[var(--mut)]">Reason for rejecting (the user is told)<select name="preset" required defaultValue="" className={`${inputCls} mt-1`}><option value="" disabled>Choose a reason…</option>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
                  <label className="block text-xs text-[var(--mut)]">Extra details (optional)<textarea name="extra" rows={3} maxLength={300} className={`${inputCls} mt-1`} /></label>
                  <button className="w-full rounded-full border border-red-500/50 py-3 font-semibold text-red-500">Reject</button></form>
              </div>
            ) : (
              <div className="space-y-3 text-sm"><Fact k="Decision" v={k.status.toLowerCase()} /><Fact k="Reviewed by" v={reviewer?.name ?? reviewer?.email ?? "—"} /><Fact k="Reviewed" v={k.reviewedAt ? dt(k.reviewedAt) : "—"} />{k.rejectReason && <Fact k="Reason" v={k.rejectReason} />}
                <form action={reopenKyc.bind(null, k.id)}><button className="glass w-full rounded-full py-2.5 font-semibold">Re-open for review</button></form></div>)}
          </Card>
          {nextPending && <Link href={`/admin/kyc/${nextPending.id}`} className="glass block rounded-2xl p-4 text-center text-sm font-semibold">Skip to next pending →</Link>}
        </div>
      </div>
    </>
  );
}
