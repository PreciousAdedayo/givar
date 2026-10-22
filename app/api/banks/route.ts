import { NextResponse } from "next/server";
import { listBanks } from "@/lib/payout";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(await listBanks()); }
