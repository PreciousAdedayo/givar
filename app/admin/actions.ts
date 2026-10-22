"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { refundGiveaway } from "@/lib/refund";
import { notify, notifyMany } from "@/lib/notify";
import { settleWithdrawal } from "@/lib/payout";
import { MANAGED_PAGES } from "@/lib/seo";

// Every action re-checks the admin role on the server (hiding a button is not security) and writes an audit entry.
async function admin() { const s = await getSession(); if (s?.user.role !== "ADMIN") throw new Error("Forbidden"); return s.user.id; }
const audit = (adminId: string, action: string, target: string) => prisma.auditLog.create({ data: { adminId, action, target } });

export async function toggleBan(id: string) { const a = await admin(); const u = await prisma.user.findUniqueOrThrow({ where: { id } }); await prisma.user.update({ where: { id }, data: { banned: !u.banned } }); await audit(a, u.banned ? "unban_user" : "ban_user", id); revalidatePath("/admin/users"); revalidatePath(`/admin/users/${id}`); }
export async function flagGiveaway(id: string) { const a = await admin(); const g = await prisma.giveaway.findUniqueOrThrow({ where: { id } }); await prisma.giveaway.update({ where: { id }, data: { flagged: !g.flagged } }); await audit(a, g.flagged ? "unflag_giveaway" : "flag_giveaway", id); revalidatePath("/admin/giveaways"); }
/** "Delete" = cancel: hide it and refund unclaimed escrow. Claims already paid are kept for the audit trail. */
export async function cancelGiveaway(id: string) { const a = await admin(); const refunded = await refundGiveaway(id); await prisma.giveaway.update({ where: { id }, data: { flagged: true } }); await audit(a, `cancel_giveaway(refund ${refunded})`, id); revalidatePath("/admin/giveaways"); }

// ---------- KYC review ----------
export async function approveKyc(id: string) {
  const a = await admin();
  const sub = await prisma.kycSubmission.findUniqueOrThrow({ where: { id } });
  // Only the first decision counts: the PENDING guard stops two admins approving/rejecting the same submission
  const r = await prisma.kycSubmission.updateMany({ where: { id, status: "PENDING" }, data: { status: "APPROVED", reviewedById: a, reviewedAt: new Date(), rejectReason: null } });
  if (r.count === 1) {
    await prisma.user.update({ where: { id: sub.userId }, data: { kyc: "VERIFIED" } });
    await audit(a, "kyc_approve", id);
    await notify(sub.userId, { type: "KYC", title: "Your identity is verified", body: "Good news: your identity has been verified. You can now withdraw money.", href: "/wallet" });
  }
  revalidatePath("/admin/kyc"); redirect(`/admin/kyc/${id}?done=${r.count === 1 ? "approved" : "already"}`);
}
export async function rejectKyc(id: string, fd: FormData) {
  const a = await admin();
  const preset = String(fd.get("preset") ?? "").trim(), extra = String(fd.get("extra") ?? "").trim().slice(0, 300);
  if (!preset) redirect(`/admin/kyc/${id}?err=reason`);
  const reason = extra ? `${preset}: ${extra}` : preset;
  const sub = await prisma.kycSubmission.findUniqueOrThrow({ where: { id } });
  const r = await prisma.kycSubmission.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", reviewedById: a, reviewedAt: new Date(), rejectReason: reason } });
  if (r.count === 1) {
    await prisma.user.update({ where: { id: sub.userId }, data: { kyc: "REJECTED" } });
    await audit(a, "kyc_reject", id);
    await notify(sub.userId, { type: "KYC", title: "Verification needs attention", body: `We couldn't verify your identity yet. Reason: ${reason}. You can submit again with clearer documents.`, href: "/kyc" });
  }
  revalidatePath("/admin/kyc"); redirect(`/admin/kyc/${id}?done=${r.count === 1 ? "rejected" : "already"}`);
}
/** Undo a decision (e.g. a mistake): puts the submission back in the queue. */
export async function reopenKyc(id: string) {
  const a = await admin();
  const sub = await prisma.kycSubmission.findUniqueOrThrow({ where: { id } });
  await prisma.kycSubmission.update({ where: { id }, data: { status: "PENDING", reviewedById: null, reviewedAt: null, rejectReason: null } });
  await prisma.user.update({ where: { id: sub.userId }, data: { kyc: "PENDING" } });
  await audit(a, "kyc_reopen", id); revalidatePath("/admin/kyc"); redirect(`/admin/kyc/${id}`);
}

// ---------- SEO ----------
const clean = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max) || null;
export async function saveSeoPage(fd: FormData) {
  const a = await admin();
  const path = String(fd.get("path") ?? "");
  if (!MANAGED_PAGES.some((p) => p.path === path)) throw new Error("Unknown page");
  const back = (err: string) => redirect(`/admin/seo/pages?path=${encodeURIComponent(path)}&err=${err}`);
  const canonical = clean(fd, "canonical", 300), ogImage = clean(fd, "ogImage", 500);
  if (canonical && !(canonical.startsWith("/") || canonical.startsWith("https://"))) back("canonical");
  if (ogImage && !(ogImage.startsWith("/") || ogImage.startsWith("https://"))) back("image");
  const data = { title: clean(fd, "title", 120), description: clean(fd, "description", 320), ogImage, canonical, noindex: fd.get("noindex") === "on" };
  await prisma.seoPage.upsert({ where: { path }, update: data, create: { path, ...data } });
  await audit(a, "seo_page_save", path); revalidateTag("seo"); revalidatePath(path); revalidatePath("/sitemap.xml");
  redirect(`/admin/seo/pages?path=${encodeURIComponent(path)}&saved=1`);
}
export async function resetSeoPage(path: string) {
  const a = await admin();
  await prisma.seoPage.deleteMany({ where: { path } }); await audit(a, "seo_page_reset", path); revalidateTag("seo"); revalidatePath(path);
  redirect(`/admin/seo/pages?path=${encodeURIComponent(path)}&saved=reset`);
}
export async function saveSeoSettings(fd: FormData) {
  const a = await admin();
  const titleTemplate = String(fd.get("titleTemplate") ?? "").trim().slice(0, 120);
  if (!titleTemplate.includes("%s")) redirect("/admin/seo/settings?err=template");
  const lines = (k: string, ok: (l: string) => boolean) => String(fd.get(k) ?? "").split("\n").map((l) => l.trim()).filter(ok).slice(0, 30).join("\n") || null;
  const data = {
    siteName: String(fd.get("siteName") ?? "Givar").trim().slice(0, 60) || "Givar", titleTemplate, defaultDescription: clean(fd, "defaultDescription", 320), ogImage: clean(fd, "ogImage", 500),
    twitterHandle: clean(fd, "twitterHandle", 40), googleVerification: clean(fd, "googleVerification", 120), bingVerification: clean(fd, "bingVerification", 120),
    robotsExtra: lines("robotsExtra", (l) => l.startsWith("/")), sameAs: lines("sameAs", (l) => l.startsWith("https://")),
  };
  await prisma.seoSettings.upsert({ where: { id: "global" }, update: data, create: { id: "global", ...data } });
  await audit(a, "seo_settings_save", "global"); revalidateTag("seo"); revalidatePath("/", "layout"); revalidatePath("/robots.txt");
  redirect("/admin/seo/settings?saved=1");
}

// ---------- Notifications: broadcast ----------
/** Sends an in-app announcement to a group of users. Banned users are skipped. Not emailed, to avoid accidental mass email. */
export async function sendBroadcast(fd: FormData) {
  const a = await admin();
  const title = clean(fd, "title", 80), body = clean(fd, "body", 300), href = clean(fd, "href", 200);
  if (!title || !body) redirect("/admin/notifications?err=fields");
  if (href && !(href.startsWith("/") && !href.startsWith("//"))) redirect("/admin/notifications?err=href");
  if (fd.get("confirm") !== "on") redirect("/admin/notifications?err=confirm");
  const audience = String(fd.get("audience") ?? "all");
  const where: Prisma.UserWhereInput = { banned: false };
  if (audience === "kyc_verified") where.kyc = "VERIFIED";
  else if (audience === "kyc_unverified") where.kyc = { not: "VERIFIED" };
  else if (audience === "phone_unverified") where.phoneVerified = false;
  else if (audience === "one") where.email = String(fd.get("email") ?? "").trim().toLowerCase();
  const users = await prisma.user.findMany({ where, select: { id: true }, take: 100000 });
  if (users.length === 0) redirect("/admin/notifications?err=none");
  const b = await prisma.broadcast.create({ data: { adminId: a, title, body, href, audience, sent: 0 } });
  const sent = await notifyMany(users.map((u) => u.id), { type: "SYSTEM", title, body, href: href ?? undefined, broadcastId: b.id });
  await prisma.broadcast.update({ where: { id: b.id }, data: { sent } });
  await audit(a, `broadcast(${sent}): ${title}`.slice(0, 150), audience);
  redirect(`/admin/notifications/${b.id}?sent=${sent}`);
}

// ---------- Withdrawals (manual payouts) ----------
export async function payWithdrawal(reference: string) { const a = await admin(); await settleWithdrawal(reference, true); await audit(a, "withdrawal_paid", reference); revalidatePath("/admin/withdrawals"); redirect("/admin/withdrawals?done=marked+as+paid"); }
export async function rejectWithdrawal(reference: string) { const a = await admin(); await settleWithdrawal(reference, false); await audit(a, "withdrawal_rejected", reference); revalidatePath("/admin/withdrawals"); redirect("/admin/withdrawals?done=rejected+and+refunded"); }

// ---------- Chats: support inbox + community moderation ----------
export async function hideMessage(id: string, hide: boolean, back: string) { const a = await admin(); const m = await prisma.chatMessage.update({ where: { id }, data: { hidden: hide, hiddenById: hide ? a : null } }); await audit(a, hide ? "chat_hide_message" : "chat_unhide_message", `${m.roomKey}/${id}`); revalidatePath(back); redirect(back); }
export async function muteChatUser(userId: string, back: string, fd: FormData) { const a = await admin(); const h = Number(fd.get("hours") ?? 24); await prisma.user.update({ where: { id: userId }, data: { chatMutedUntil: h > 0 ? new Date(Date.now() + h * 3600_000) : null } }); await audit(a, h > 0 ? `chat_mute(${h}h)` : "chat_unmute", userId); revalidatePath(back); redirect(back); }
export async function staffAnnounce(room: string, fd: FormData) { const a = await admin(); const body = String(fd.get("body") ?? "").trim().slice(0, 500); if (body) { await prisma.chatMessage.create({ data: { roomKey: room, userId: a, body, fromStaff: true } }); await audit(a, "chat_staff_post", room); } const back = `/admin/communities/${encodeURIComponent(room)}`; revalidatePath(back); redirect(back); }
export async function closeSupport(id: string) { const a = await admin(); await prisma.supportThread.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } }); await audit(a, "support_close", id); revalidatePath("/admin/support"); redirect(`/admin/support/${id}`); }
export async function reopenSupport(id: string) { const a = await admin(); await prisma.supportThread.update({ where: { id }, data: { status: "OPEN", closedAt: null } }); await audit(a, "support_reopen", id); revalidatePath("/admin/support"); redirect(`/admin/support/${id}`); }
