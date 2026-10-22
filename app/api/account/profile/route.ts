import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
export async function PATCH(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ name: z.string().trim().min(2).max(60), country: z.enum(["NG", "US", "GB", "OTHER"]) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter your name (2 to 60 characters)." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: p.data });
  return NextResponse.json({ ok: true });
}
