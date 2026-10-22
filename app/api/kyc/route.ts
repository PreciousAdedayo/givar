import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { notify } from "@/lib/notify";
import { upgradeNgnAccount } from "@/lib/virtual-accounts";

const MAX_BYTES = 1_800_000; // two files must fit under typical 4.5 MB request limits
const MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const Meta = z.object({
  kind: z.enum(["BVN", "NIN", "PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE"]), country: z.enum(["NG", "US", "GB", "OTHER"]),
  legalName: z.string().trim().min(3).max(80), dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), address: z.string().trim().min(8).max(200), idNumber: z.string().trim().min(5).max(24),
});
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return bad("Sign in first.", 401);
  if (!(await limit(`kyc:${userId}`, 5, 3600))) return bad("Too many attempts. Try again later.", 429);
  const fd = await req.formData().catch(() => null); if (!fd) return bad("Invalid form.");
  const p = Meta.safeParse(Object.fromEntries(["kind", "country", "legalName", "dob", "address", "idNumber"].map((k) => [k, fd.get(k)])));
  if (!p.success) return bad("Please fill in every field correctly.");
  const m = p.data;
  if ((m.kind === "BVN" || m.kind === "NIN") && !/^\d{11}$/.test(m.idNumber)) return bad("A BVN or NIN is exactly 11 digits.");
  const dob = new Date(`${m.dob}T00:00:00Z`);
  if (isNaN(+dob) || Date.now() - dob.getTime() < 18 * 31557600000) return bad("You must be 18 or older.");

  const files: { kind: "ID_FRONT" | "SELFIE"; f: File }[] = [];
  for (const [field, kind] of [["idFront", "ID_FRONT"], ["selfie", "SELFIE"]] as const) {
    const f = fd.get(field);
    if (!(f instanceof File) || f.size === 0) return bad(kind === "SELFIE" ? "Add a selfie." : "Add a photo of your ID.");
    if (!MIME.includes(f.type)) return bad("Files must be JPG, PNG, WebP or PDF.");
    if (f.size > MAX_BYTES) return bad("Each file must be under 1.8 MB. Try a smaller photo.");
    files.push({ kind, f });
  }
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (me.kyc === "VERIFIED") return bad("You are already verified.", 409);
  if (await prisma.kycSubmission.findFirst({ where: { userId, status: "PENDING" } })) return bad("Your verification is already being reviewed.", 409);
  const idHash = createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "").update(m.idNumber.toUpperCase()).digest("hex");
  if (await prisma.kycSubmission.findFirst({ where: { idHash, NOT: { userId }, status: { not: "REJECTED" } } })) return bad("This ID is already linked to another account.", 409);

  const docs = await Promise.all(files.map(async ({ kind, f }) => ({ kind, mime: f.type, size: f.size, data: Buffer.from(await f.arrayBuffer()) })));
  await prisma.$transaction([
    prisma.kycSubmission.create({ data: { userId, kind: m.kind, idHash, idLast4: m.idNumber.slice(-4), country: m.country, legalName: m.legalName, dob: m.dob, address: m.address, docs: { create: docs } } }),
    prisma.user.update({ where: { id: userId }, data: { kyc: "PENDING", country: m.country } }),
  ]);
  await notify(userId, { type: "KYC", title: "Documents received", body: "Thanks. Our team is reviewing your documents and will tell you the result.", href: "/kyc", email: false });
  if (m.kind === "BVN") await upgradeNgnAccount(me, m.idNumber).catch((e) => prisma.analyticsEvent.create({ data: { type: "provision_failed", meta: { userId, error: String(e) } } })); // BVN is used once, never stored
  return NextResponse.json({ ok: true });
}
