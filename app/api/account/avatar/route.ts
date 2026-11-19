import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deletePublicObject, uploadPublicObject } from "@/lib/storage";

export const runtime = "nodejs";
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const fd = await req.formData(); const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  const type = file.type as keyof typeof TYPES;
  if (!(type in TYPES) || file.size < 1 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Use a JPG, PNG or WebP image under 5 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid = type === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 : type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!valid) return NextResponse.json({ error: "The selected file is not a valid image." }, { status: 400 });
  try {
    const path = `avatars/${userId}/${randomUUID()}.${TYPES[type]}`;
    const image = await uploadPublicObject("givar-public", path, bytes, type);
    const old = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
    await prisma.user.update({ where: { id: userId }, data: { image } });
    const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const prefix = `${base}/storage/v1/object/public/givar-public/`;
    if (base && old?.image?.startsWith(prefix)) await deletePublicObject("givar-public", decodeURIComponent(old.image.slice(prefix.length))).catch(() => {});
    return NextResponse.json({ ok: true, image });
  } catch (e) { console.error("avatar upload failed", e); return NextResponse.json({ error: "Image storage is not configured or the upload failed. Contact the administrator." }, { status: 503 }); }
}
export async function DELETE() {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const old = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const prefix = `${base}/storage/v1/object/public/givar-public/`;
  if (base && old?.image?.startsWith(prefix)) await deletePublicObject("givar-public", decodeURIComponent(old.image.slice(prefix.length))).catch(() => {});
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  return NextResponse.json({ ok: true });
}
