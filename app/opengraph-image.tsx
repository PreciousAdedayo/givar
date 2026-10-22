import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Givar - Give. Claim. Win.";
export default function Image() {
  return new ImageResponse(
    (<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#0a0a0a", color: "#fff", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 120, fontWeight: 700 }}>
        <svg width="110" height="110" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2"><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>
        <span style={{ marginLeft: 24 }}>Givar</span>
      </div>
      <div style={{ fontSize: 40, color: "#a1a19c", marginTop: 24 }}>Give. Claim. Win.</div>
    </div>), size);
}
