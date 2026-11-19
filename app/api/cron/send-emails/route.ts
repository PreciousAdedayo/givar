import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
export const runtime = "nodejs";
export const maxDuration = 240;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stale = new Date(Date.now() - 10 * 60 * 1000);
  const jobs = await prisma.emailJob.findMany({ where: { OR: [{ status: "PENDING" }, { status: "PROCESSING", processingAt: { lt: stale } }] }, orderBy: { createdAt: "asc" }, take: 10 });
  let sent = 0, failed = 0, skipped = 0;
  for (const job of jobs) {
    const claim = await prisma.emailJob.updateMany({ where: { id: job.id, OR: [{ status: "PENDING" }, { status: "PROCESSING", processingAt: { lt: stale } }] }, data: { status: "PROCESSING", processingAt: new Date(), attempts: { increment: 1 } } });
    if (claim.count !== 1) { skipped++; continue; }
    try {
      await sendEmail(job.to, job.subject, job.html);
      await prisma.emailJob.update({ where: { id: job.id }, data: { status: "SENT", sentAt: new Date(), processingAt: null, lastError: null } });
      if (job.broadcastId) await prisma.broadcast.update({ where: { id: job.broadcastId }, data: { emailSent: { increment: 1 } } });
      sent++;
    } catch (e) {
      const attempts = job.attempts + 1;
      await prisma.emailJob.update({ where: { id: job.id }, data: { status: attempts >= 3 ? "FAILED" : "PENDING", processingAt: null, lastError: String(e).slice(0, 500) } });
      failed++;
    }
  }
  return NextResponse.json({ ok: true, checked: jobs.length, sent, failed, skipped });
}
