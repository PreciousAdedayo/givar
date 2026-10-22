import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, limit } from "@/lib/ratelimit";
// Receives browser errors from app/error.tsx so they show up in the admin event log
export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!(await limit(`rpt:${clientIp(req)}`, 10, 60))) return done;
  const p = z.object({ message: z.string().max(300), digest: z.string().max(60).optional(), path: z.string().max(200) }).safeParse(await req.json().catch(() => ({})));
  if (p.success) await prisma.analyticsEvent.create({ data: { type: "client_error", path: p.data.path, meta: p.data } }).catch(() => {});
  return done;
}
