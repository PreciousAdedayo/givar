import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Legacy USD virtual-account webhook. USD wallet funding is crypto-only. */
export async function POST(req: Request) {
  if (!process.env.STROWALLET_WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== process.env.STROWALLET_WEBHOOK_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.analyticsEvent.create({ data: { type: "webhook_ignored", path: "strowallet", meta: { reason: "USD virtual-account deposits are disabled; use approved stablecoin deposits" } } }).catch(() => {});
  return NextResponse.json({ error: "USD virtual-account deposits are disabled. Use crypto deposits." }, { status: 410 });
}
