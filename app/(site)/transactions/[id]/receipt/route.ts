import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildReceipt } from "@/lib/receipt";
import { receiptData } from "@/lib/tx-detail";

/** Downloads a PDF receipt. Only the owner of the transaction can get it. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession(); if (!s) return new Response("Sign in first", { status: 401 });
  const t = await prisma.transaction.findFirst({ where: { id: params.id, wallet: { userId: s.user.id } }, include: { wallet: true } });
  if (!t) return new Response("Not found", { status: 404 });
  const bytes = await buildReceipt(receiptData(t, s.user.name ?? s.user.email ?? "Givar user"));
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="givar-receipt-${t.reference.slice(0, 24)}.pdf"`, "Cache-Control": "private, no-store" } });
}
