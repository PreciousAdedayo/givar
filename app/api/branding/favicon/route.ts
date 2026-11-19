import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await prisma.seoSettings.findUnique({ where: { id: "global" }, select: { faviconUrl: true } }).catch(() => null);
  const url = s?.faviconUrl;
  if (url && (url.startsWith("https://") || (url.startsWith("/") && !url.startsWith("//")))) return NextResponse.redirect(new URL(url, process.env.NEXT_PUBLIC_SITE_URL || "https://givar.app"));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#141725"/><path d="M32 5 59 32 32 59 5 32Z" fill="none" stroke="#D9F45B" stroke-width="4"/><path d="m32 19 13 13-13 13-13-13Z" fill="none" stroke="#D9F45B" stroke-width="3"/></svg>`;
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" } });
}
