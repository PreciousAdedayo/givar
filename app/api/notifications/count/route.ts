import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { unreadCount } from "@/lib/notify";
export const dynamic = "force-dynamic";
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ unread: 0 }, { status: 401 });
  return NextResponse.json({ unread: await unreadCount(userId) }, { headers: { "Cache-Control": "no-store" } });
}
