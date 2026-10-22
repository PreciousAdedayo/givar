import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Givar - Give. Claim. Win.", short_name: "Givar", description: "Create giveaway links, claim cash by code and win prizes.", start_url: "/", display: "standalone", background_color: "#0a0a0a", theme_color: "#0a0a0a", icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }] };
}
