import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A Givar prize contest";

export default async function Image({ params }: { params: { id: string } }) {
  const c = await prisma.contest.findUnique({ where: { id: params.id }, select: { prize: true, partner: true, entryFee: true, currency: true } }).catch(() => null);
  return new ImageResponse(
    (<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg,#0a0a0a 0%,#1c2210 100%)", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
        <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2"><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg><span style={{ marginLeft: 16 }}>Givar contest</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {c?.partner && <div style={{ fontSize: 34, color: "#D8F24A" }}>Partner: {c.partner}</div>}
        <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05, maxWidth: 1050 }}>{c?.prize ?? "Win a prize"}</div>
        <div style={{ fontSize: 36, marginTop: 16, color: "#a3a69a" }}>{c ? (c.entryFee ? `Entry ${c.currency} ${(c.entryFee / 100).toLocaleString("en-US")}` : "Free entry") : "Enter now"}</div>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#a3a69a" }}>givar.app</div>
    </div>), size);
}
