import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    (<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <svg width="120" height="120" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2.2"><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>
    </div>), size);
}
