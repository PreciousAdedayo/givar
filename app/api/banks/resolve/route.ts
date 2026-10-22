import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/session";
import { resolveAccount } from "@/lib/payout";
export async function POST(req: Request) {
  if (!(await getUserId())) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ bankCode: z.string(), accountNumber: z.string().regex(/^\d{10}$/) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter a 10-digit account number." }, { status: 400 });
  const name = await resolveAccount(p.data.bankCode, p.data.accountNumber);
  return name ? NextResponse.json({ name }) : NextResponse.json({ error: "We couldn't find that account. Check the bank and number." }, { status: 404 });
}
