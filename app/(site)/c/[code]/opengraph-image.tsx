import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A Givar cash giveaway";

export default async function Image({ params }: { params: { code: string } }) {
  const g = await prisma.giveaway.findFirst({ where: { OR: [{ claimSlug: params.code }, { claimCode: params.code.toUpperCase() }], flagged: false }, select: { title: true, totalAmount: true, currency: true, winners: true, winnersLeft: true } }).catch(() => null);
  const amount = g ? `${g.currency} ${(g.totalAmount / 100).toLocaleString("en-US")}` : "Cash giveaway";
  return new ImageResponse(
    (<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg,#0a0a0a 0%,#1c2210 100%)", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
        <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2"><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg><span style={{ marginLeft: 16 }}>Givar</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 44, color: "#a3a69a", maxWidth: 1000 }}>{g?.title ?? "Claim your share"}</div>
        <div style={{ fontSize: 132, fontWeight: 700, color: "#D8F24A", lineHeight: 1.05 }}>{amount}</div>
        <div style={{ fontSize: 36, marginTop: 12 }}>{g ? `${g.winnersLeft} of ${g.winners} prizes left. Claim now.` : "Give. Claim. Win."}</div>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#a3a69a" }}>givar.app</div>
    </div>), size);
}
