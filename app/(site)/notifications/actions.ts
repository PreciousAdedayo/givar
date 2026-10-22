"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { safeHref } from "@/lib/notify-rules";

/** Marks one notification read, then goes to the page it points at. */
export async function openNotification(id: string) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const n = await prisma.notification.findFirst({ where: { id, userId } });
  if (n && !n.openedAt) await prisma.notification.update({ where: { id }, data: { openedAt: new Date(), readAt: n.readAt ?? new Date() } });
  redirect(safeHref(n?.href));
}
export async function markAllRead() {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications"); redirect("/notifications");
}
export async function savePrefs(fd: FormData) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const on = (k: string) => fd.get(k) === "on";
  const data = { emailMoney: on("emailMoney"), emailGiveaways: on("emailGiveaways"), emailContests: on("emailContests"), emailNews: on("emailNews") };
  await prisma.notificationPref.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  redirect("/notifications/settings?saved=1");
}
