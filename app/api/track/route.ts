import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, limit } from "@/lib/ratelimit";
const B = z.object({ path: z.string().max(200), visitorId: z.string().max(60), source: z.string().max(30) });
export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!(await limit(`trk:${clientIp(req)}`, 120, 60))) return done; // silently drop floods
  const p = B.safeParse(JSON.parse((await req.text()) || "{}"));
  if (!p.success) return done;
  const h = req.headers;
  await prisma.analyticsEvent.create({ data: { type: "pageview", ...p.data, country: h.get("x-vercel-ip-country"), city: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : null } }).catch(() => {});
  return done;
}
