import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { DEFAULT_DESCRIPTION, SITE, getSeoSettings } from "@/lib/seo";

const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Site-wide defaults. Admin > SEO > Settings can change the template, description, social handle and verification tags.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSeoSettings().catch(() => null);
  const name = s?.siteName || "Givar";
  const description = s?.defaultDescription || DEFAULT_DESCRIPTION;
  return {
    metadataBase: new URL(SITE),
    applicationName: name,
    title: { default: "Givar.app - Global Giveaway Platform", template: s?.titleTemplate?.includes("%s") ? s.titleTemplate : "%s | Givar.app - Global Giveaway Platform" },
    description,
    openGraph: { type: "website", siteName: name, title: "Givar - Give. Claim. Win.", description, url: SITE, locale: "en_NG" },
    twitter: { card: "summary_large_image", title: "Givar - Give. Claim. Win.", description, ...(s?.twitterHandle ? { site: s.twitterHandle, creator: s.twitterHandle } : {}) },
    verification: { google: s?.googleVerification || undefined, other: s?.bingVerification ? { "msvalidate.01": s.bingVerification } : undefined },
  };
}
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }, { media: "(prefers-color-scheme: light)", color: "#f7f8f1" }], width: "device-width", initialScale: 1 };

// Runs before paint so the saved light theme doesn't flash dark
const themeScript = `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${sans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
