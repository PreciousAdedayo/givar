import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import ContestForm, { type ContestInitial } from "./ContestForm";

export const metadata: Metadata = { title: "Host a contest", robots: { index: false } };
export const dynamic = "force-dynamic";

/** /contests/create?from=<id> runs one of your earlier contests again. */
export default async function CreateContest({ searchParams }: { searchParams: { from?: string } }) {
  const uid = searchParams.from ? await getUserId() : null;
  const c = uid && searchParams.from ? await prisma.contest.findFirst({ where: { id: searchParams.from, hostId: uid } }) : null;
  const initial: ContestInitial | undefined = c ? { prize: c.prize, image: c.image ?? "", entryFee: String(c.entryFee / 100), maxEntries: String(c.maxEntries), partner: c.partner ?? "" } : undefined;
  return <ContestForm initial={initial} renewing={c?.prize} />;
}
