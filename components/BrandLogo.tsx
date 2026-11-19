import { prisma } from "@/lib/prisma";

/** Theme-aware full logo. Upload separate light/dark assets in Admin > SEO > Site settings. */
export default async function BrandLogo({ size = "normal" }: { size?: "normal" | "small" }) {
  const settings = await prisma.seoSettings.findUnique({ where: { id: "global" }, select: { logoLightUrl: true, logoDarkUrl: true } }).catch(() => null);
  const width = size === "small" ? 126 : 164;
  const height = size === "small" ? 30 : 40;
  if (!settings?.logoLightUrl && !settings?.logoDarkUrl) return <span className="inline-flex items-center gap-2 whitespace-nowrap"><svg width={size === "small" ? 27 : 32} height={size === "small" ? 27 : 32} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-[var(--accent-text)]"><path d="M16 2 30 16 16 30 2 16Z"/><path d="M16 9 23 16 16 23 9 16Z"/></svg><span className={size === "small" ? "text-lg font-bold" : "text-xl font-bold"}>Givar</span></span>;
  return <span className="brand-logo inline-flex shrink-0 items-center"><>{settings.logoLightUrl && <img src={settings.logoLightUrl} alt="Givar" width={width} height={height} className="brand-logo-light max-h-10 max-w-[164px] object-contain" />}{settings.logoDarkUrl && <img src={settings.logoDarkUrl} alt="Givar" width={width} height={height} className="brand-logo-dark max-h-10 max-w-[164px] object-contain" />}{!settings.logoLightUrl && settings.logoDarkUrl && <img src={settings.logoDarkUrl} alt="Givar" width={width} height={height} className="brand-logo-light max-h-10 max-w-[164px] object-contain" />}{!settings.logoDarkUrl && settings.logoLightUrl && <img src={settings.logoLightUrl} alt="Givar" width={width} height={height} className="brand-logo-dark max-h-10 max-w-[164px] object-contain" />}</></span>;
}
