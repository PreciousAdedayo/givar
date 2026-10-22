import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { unreadChatCount } from "@/lib/chat";
export const dynamic = "force-dynamic";
export async function GET() {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ unread: 0 }, { status: 401 });
  return NextResponse.json({ unread: await unreadChatCount(userId).catch(() => 0) }, { headers: { "Cache-Control": "no-store" } });
}
