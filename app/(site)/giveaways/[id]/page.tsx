import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
// Keeps the SEO-friendly /giveaways/[id] URL working; the claim page is the canonical destination.
export default async function G({ params }: { params: { id: string } }) {
  const g = await prisma.giveaway.findUnique({ where: { id: params.id }, select: { claimSlug: true } });
  if (!g) notFound();
  permanentRedirect(`/c/${g.claimSlug}`);
}
