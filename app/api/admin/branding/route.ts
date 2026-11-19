import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadPublicObject } from "@/lib/storage";
export const runtime = "nodejs";
const fields = { light: "logoLightUrl", dark: "logoDarkUrl", favicon: "faviconUrl" } as const;
export async function POST(req: Request) {
  const session = await getSession(); if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const fd = await req.formData(), kind = String(fd.get("kind") ?? "") as keyof typeof fields, file = fd.get("file");
  if (!["light", "dark", "favicon"].includes(kind) || !(file instanceof File)) return NextResponse.json({ error: "Choose a branding image." }, { status: 400 });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : "";
  if (!ext || file.size < 1 || file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Use PNG, WebP or JPG under 3 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (ext === "png" && !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return NextResponse.json({ error: "Invalid PNG file." }, { status: 400 });
  if (ext === "jpg" && !(bytes[0] === 255 && bytes[1] === 216)) return NextResponse.json({ error: "Invalid JPEG file." }, { status: 400 });
  if (ext === "webp" && !(bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP")) return NextResponse.json({ error: "Invalid WebP file." }, { status: 400 });
  try {
    const url = await uploadPublicObject("givar-public", `branding/${kind}-${randomUUID()}.${ext}`, bytes, file.type);
    const data = kind === "light" ? { logoLightUrl: url } : kind === "dark" ? { logoDarkUrl: url } : { faviconUrl: url };
    await prisma.seoSettings.upsert({ where: { id: "global" }, update: data, create: { id: "global", ...data } });
    return NextResponse.json({ ok: true, url });
  } catch (e) { console.error("branding upload failed", e); return NextResponse.json({ error: "Upload failed. Check Supabase Storage configuration." }, { status: 503 }); }
}
