"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
/** Only the host of a drawn contest can confirm the prize was handed over. */
export async function markDelivered(id: string) {
  const uid = await getUserId(); const c = await prisma.contest.findUnique({ where: { id } });
  if (!uid || !c || c.hostId !== uid || !c.drawnAt) throw new Error("Forbidden");
  await prisma.contest.update({ where: { id }, data: { deliveredAt: new Date() } });
  revalidatePath(`/contests/${id}`);
}
