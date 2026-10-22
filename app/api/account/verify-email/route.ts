import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/tokens";
export async function GET(req: Request) {
  const url = new URL(req.url); const token = url.searchParams.get("token") ?? "";
  const userId = token ? await consumeToken(token, "VERIFY") : null;
  if (userId) await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  return NextResponse.redirect(new URL(userId ? "/" : "/auth", url.origin));
}
