import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { describeDevice } from "@/lib/device";
import { ago } from "@/lib/admin";
import SecurityForm from "./SecurityForm";
import TwoFactorCard from "./TwoFactorCard";
import PinCard from "./PinCard";
import SessionsCard from "./SessionsCard";

export const metadata = { title: "Security", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Security() {
  const s = await getSession(); if (!s) redirect("/auth");
  const [me, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { passwordHash: true, emailVerified: true, phoneVerified: true, twoFactorEnabled: true, pinHash: true, kyc: true, backupCodes: true } }),
    prisma.loginSession.findMany({ where: { userId: s.user.id, revokedAt: null }, orderBy: { lastSeenAt: "desc" }, take: 20 }),
  ]);
  const checks: [boolean, string, string][] = [
    [!!me.passwordHash, "Password set", "Add a strong password below"], [me.emailVerified || me.phoneVerified, "Email or phone verified", "Verify from your profile"],
    [me.twoFactorEnabled, "Two-factor authentication on", "Turn it on below"], [!!me.pinHash, "Transaction PIN set", "Set one below"], [me.kyc === "VERIFIED", "Identity verified", "Complete verification"],
  ];
  const score = checks.filter((c) => c[0]).length;
  return (
    <main className="page max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold lg:text-3xl">Security</h1>
      <section className={`${score === checks.length ? "grad-brand" : "glass"} rounded-2xl p-5`} aria-labelledby="sc">
        <div className="flex items-center justify-between"><h2 id="sc" className="font-semibold">Security checkup</h2><span className="text-2xl font-bold">{score}/{checks.length}</span></div>
        <div className="my-3 flex gap-1.5" role="img" aria-label={`${score} of ${checks.length} done`}>{checks.map((_, i) => <span key={i} className={`h-2 flex-1 rounded-full ${i < score ? "grad-brand" : "bg-[var(--line)]"}`} />)}</div>
        <ul className="space-y-1.5 text-sm">{checks.map(([ok, t, hint]) => <li key={t} className="flex items-center justify-between gap-3"><span>{ok ? "✓" : "○"} {t}</span>{!ok && <span className="text-xs text-[var(--mut)]">{hint}</span>}</li>)}</ul>
      </section>
      <TwoFactorCard enabled={me.twoFactorEnabled} hasPassword={!!me.passwordHash} backupLeft={(() => {
  try {
    const codes: unknown = JSON.parse(me.backupCodes || "[]");
    return Array.isArray(codes) ? codes.length : 0;
  } catch {
    return 0;
  }
})()} />
      <PinCard hasPin={!!me.pinHash} hasPassword={!!me.passwordHash} />
      <SessionsCard currentId={s.user.sid ?? ""} sessions={sessions.map((x) => ({ id: x.id, device: describeDevice(x.ua), country: x.country, ip: x.ip ? x.ip.replace(/(\d+\.\d+)\.\d+\.\d+/, "$1.•.•") : null, last: ago(x.lastSeenAt) }))} />
      <SecurityForm hasPassword={!!me.passwordHash} />
    </main>
  );
}
