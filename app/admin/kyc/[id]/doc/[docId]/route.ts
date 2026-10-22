import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Serves a KYC document to admins only. Never cached, and every view is written to the audit log. */
export async function GET(_req: Request, { params }: { params: { id: string; docId: string } }) {
  const s = await getSession();
  if (s?.user.role !== "ADMIN") return new Response("Not found", { status: 404 });
  const doc = await prisma.kycDocument.findFirst({ where: { id: params.docId, submissionId: params.id } });
  if (!doc) return new Response("Not found", { status: 404 });
  await prisma.auditLog.create({ data: { adminId: s.user.id, action: "view_kyc_document", target: doc.id } });
  return new Response(new Uint8Array(doc.data), { headers: { "Content-Type": doc.mime, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" } });
}
