import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    (<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", borderRadius: 14 }}>
      <svg width="44" height="44" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2.4"><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>
    </div>), size);
}
