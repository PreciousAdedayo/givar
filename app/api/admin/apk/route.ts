import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSignedPublicUpload } from "@/lib/storage";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const session = await getSession(); if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.version !== "string" || typeof body.fileName !== "string" || !Number.isSafeInteger(body.fileSize)) return NextResponse.json({ error: "Invalid upload details." }, { status: 400 });
  const version = body.version.trim(), fileName = body.fileName.trim();
  if (!/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(version)) return NextResponse.json({ error: "Use a version such as 1.2.0." }, { status: 400 });
  if (!fileName.toLowerCase().endsWith(".apk") || body.fileSize < 4 || body.fileSize > 150 * 1024 * 1024) return NextResponse.json({ error: "Choose an APK file no larger than 150 MB." }, { status: 400 });
  if (await prisma.appRelease.findUnique({ where: { version } })) return NextResponse.json({ error: "That version already exists. Use a new version number." }, { status: 409 });
  try {
    const path = `releases/${version.replace(/[^a-zA-Z0-9.-]/g, "_")}-${randomUUID()}.apk`;
    const upload = await createSignedPublicUpload("givar-public", path);
    return NextResponse.json({ ok: true, path, signedUrl: upload.signedUrl, fileUrl: upload.publicUrl, version, fileName: fileName.slice(0,180), fileSize: body.fileSize, notes: String(body.notes ?? "").slice(0,3000), minAndroidVersion: String(body.minAndroidVersion ?? "").slice(0,30), published: body.published === true });
  } catch (e) { console.error("APK signed upload creation failed", e); return NextResponse.json({ error: "Could not prepare the upload. Check Supabase Storage configuration." }, { status: 503 }); }
}
export async function PUT(req: Request) {
  const session = await getSession(); if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.path !== "string" || !/^releases\/[a-zA-Z0-9._-]+-[a-f0-9-]+\.apk$/i.test(body.path) || typeof body.fileUrl !== "string") return NextResponse.json({ error: "Invalid uploaded file reference." }, { status: 400 });
  const storageBase = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!storageBase || !body.fileUrl.startsWith(`${storageBase}/storage/v1/object/public/givar-public/`) || !/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(String(body.version ?? ""))) return NextResponse.json({ error: "Invalid release metadata." }, { status: 400 });
  const head = await fetch(body.fileUrl, { method: "HEAD", signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!head?.ok || Number(head.headers.get("content-length") ?? 0) !== Number(body.fileSize)) return NextResponse.json({ error: "The APK upload could not be verified or its size does not match." }, { status: 400 });
  const signatureResponse = await fetch(body.fileUrl, { headers: { Range: "bytes=0-3" }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  const signature = signatureResponse?.ok ? Buffer.from(await signatureResponse.arrayBuffer()).subarray(0, 2).toString() : "";
  if (signature !== "PK") return NextResponse.json({ error: "Uploaded file is not a valid APK archive." }, { status: 400 });
  if (!Number.isSafeInteger(body.fileSize) || body.fileSize < 4 || body.fileSize > 150 * 1024 * 1024 || !String(body.fileName ?? "").toLowerCase().endsWith(".apk")) return NextResponse.json({ error: "Invalid APK metadata." }, { status: 400 });
  try {
    const release = await prisma.$transaction(async (tx) => {
      if (body.published) await tx.appRelease.updateMany({ where: { published: true }, data: { published: false } });
      return tx.appRelease.create({ data: { version: body.version, releaseNotes: body.notes || null, fileUrl: body.fileUrl, fileName: body.fileName, fileSize: body.fileSize, minAndroidVersion: body.minAndroidVersion || null, published: !!body.published, uploadedById: session.user.id } });
    });
    return NextResponse.json({ ok: true, id: release.id });
  } catch (e) { console.error("APK release finalize failed", e); return NextResponse.json({ error: "Could not save release record. Check whether the version already exists." }, { status: 500 }); }
}
export async function PATCH(req: Request) {
  const session = await getSession(); if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null); if (!body || typeof body.id !== "string" || typeof body.published !== "boolean") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await prisma.$transaction(async (tx) => { if (body.published) await tx.appRelease.updateMany({ where: { published: true }, data: { published: false } }); await tx.appRelease.update({ where: { id: body.id }, data: { published: body.published } }); });
  return NextResponse.json({ ok: true });
}
