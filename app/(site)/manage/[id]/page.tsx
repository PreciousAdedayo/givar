import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fmt } from "@/lib/money";
import { SITE } from "@/lib/seo";
import { dt } from "@/lib/admin";
import CodeList from "@/components/CodeList";

export const metadata = { title: "Giveaway codes", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function GiveawayCodes({ params }: { params: { id: string } }) {
  const s = await getSession(); if (!s) redirect("/auth");
  const g = await prisma.giveaway.findFirst({ where: { id: params.id, creatorId: s.user.id }, include: { personalCodes: { orderBy: { createdAt: "asc" } } } });
  if (!g) notFound();
  const users = await prisma.user.findMany({ where: { id: { in: g.personalCodes.map((c) => c.redeemedById).filter(Boolean) as string[] } }, select: { id: true, name: true } });
  const who = (id: string | null) => users.find((u) => u.id === id)?.name ?? "A user";
  const used = g.personalCodes.filter((c) => c.redeemedAt).length;
  return (
    <main className="page max-w-2xl space-y-5">
      <Link href="/manage" className="text-sm text-[var(--mut)]">← My giveaways</Link>
      <div><h1 className="text-2xl font-bold">{g.title}</h1><p className="text-sm text-[var(--mut)]">{g.mode === "PERSONAL" ? `${used} of ${g.winners} one-time codes used` : "This giveaway uses one shared link and code"}</p></div>
      {g.mode === "PERSONAL" ? (
        <>
          <CodeList codes={g.personalCodes.map((c) => ({ code: c.code, amount: fmt(c.amount, g.currency), link: `${SITE}/c/${g.claimSlug}?code=${c.code}`, used: c.redeemedAt ? `Claimed by ${who(c.redeemedById)} · ${dt(c.redeemedAt)}` : null }))} title={g.title} />
          <p className="text-xs text-[var(--mut)]">Each code works once. Share each one with a different person. Unused codes return to your wallet when the giveaway ends.</p>
        </>
      ) : <div className="glass rounded-2xl p-5"><p className="font-mono text-xl tracking-widest">{g.claimCode}</p><p className="mt-1 break-all text-sm text-[var(--mut)]">{SITE}/c/{g.claimSlug}</p></div>}
    </main>
  );
}
