import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import CreateForm, { type CreateInitial } from "./CreateForm";

export const metadata: Metadata = { title: "Create a giveaway", robots: { index: false } };
export const dynamic = "force-dynamic";

/** /create?from=<id> pre-fills the form from one of your earlier giveaways (renew). */
export default async function Create({ searchParams }: { searchParams: { from?: string } }) {
  const uid = searchParams.from ? await getUserId() : null;
  const g = uid && searchParams.from ? await prisma.giveaway.findFirst({ where: { id: searchParams.from, creatorId: uid } }) : null;
  const initial: CreateInitial | undefined = g ? { title: g.title, description: g.description ?? "", currency: g.currency, amount: String(g.totalAmount / 100), winners: String(g.winners), distribution: g.distribution, claimType: g.claimType, question: g.question ?? "", mode: g.mode } : undefined;
  return <CreateForm initial={initial} renewing={g?.title} />;
}
