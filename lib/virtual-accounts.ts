import { prisma } from "./prisma";

type User = { id: string; email: string | null; phone: string | null; name: string | null };
type Acct = { accountNumber: string; bankName: string; accountName: string };
const mock = (prefix: string, bank: string, name: string): Acct => ({
  accountNumber: prefix + String(Math.floor(Math.random() * 1e9)).padStart(9, "0"), bankName: bank, accountName: name,
});

/** NGN account via Flutterwave. Permanent NGN accounts need a BVN/NIN, so until KYC is done
 *  we call with is_permanent:false only if you choose; here we require the key and fall back to a mock. */
async function flutterwaveNgn(u: User, txRef: string, bvn?: string): Promise<Acct & { provider: string }> {
  const name = `Givar - ${u.name ?? "User"}`;
  if (!process.env.FLUTTERWAVE_SECRET || !bvn) return { ...mock("90", "Wema Bank (test)", name), provider: "mock" };
  const res = await fetch(`${process.env.FLUTTERWAVE_BASE ?? "https://api.flutterwave.com/v3"}/virtual-account-numbers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email ?? `${u.id}@givar.app`, is_permanent: true, bvn, tx_ref: txRef, phonenumber: u.phone, firstname: u.name?.split(" ")[0], lastname: u.name?.split(" ")[1] ?? "-", narration: name }),
  });
  const j = await res.json();
  if (j.status !== "success") throw new Error(j.message ?? "Flutterwave error");
  return { accountNumber: j.data.account_number, bankName: j.data.bank_name, accountName: name, provider: "flutterwave" };
}

/** USD account via Strowallet / Maplerad. TODO: confirm the exact endpoint + payload in your provider docs. */
async function usdAccount(u: User): Promise<Acct & { provider: string }> {
  const name = `Givar - ${u.name ?? "User"}`;
  if (!process.env.STROWALLET_KEY) return { ...mock("40", "Givar USD (test)", name), provider: "mock" };
  throw new Error("Strowallet USD provisioning: implement per provider docs");
}

/** Creates wallets + virtual accounts. Safe to call again: it only fills what's missing.
 *  Provider failures never block signup; accounts can be retried from the dashboard. */
export async function provisionUser(u: User, bvn?: string) {
  for (const currency of ["NGN", "USD"] as const)
    await prisma.wallet.upsert({ where: { userId_currency: { userId: u.id, currency } }, update: {}, create: { userId: u.id, currency } });
  const have = await prisma.virtualAccount.findMany({ where: { userId: u.id } });
  for (const currency of ["NGN", "USD"] as const) {
    if (have.some((a) => a.currency === currency)) continue;
    try {
      const txRef = `givar_${currency}_${u.id}`;
      const a = currency === "NGN" ? await flutterwaveNgn(u, txRef, bvn) : await usdAccount(u);
      await prisma.virtualAccount.create({ data: { userId: u.id, currency, txRef, provider: a.provider, accountNumber: a.accountNumber, bankName: a.bankName, accountName: a.accountName } });
    } catch (e) {
      await prisma.analyticsEvent.create({ data: { type: "provision_failed", meta: { userId: u.id, currency, error: String(e) } } });
    }
  }
}

/** After BVN KYC: swap the test NGN account for a real permanent one. No-op without a Flutterwave key or if already real. */
export async function upgradeNgnAccount(u: User, bvn: string) {
  if (!process.env.FLUTTERWAVE_SECRET) return;
  const cur = await prisma.virtualAccount.findFirst({ where: { userId: u.id, currency: "NGN" } });
  if (cur && cur.provider !== "mock") return;
  const txRef = `givar_NGN_${u.id}_v2`;
  const a = await flutterwaveNgn(u, txRef, bvn);
  await prisma.$transaction([
    ...(cur ? [prisma.virtualAccount.delete({ where: { id: cur.id } })] : []),
    prisma.virtualAccount.create({ data: { userId: u.id, currency: "NGN", txRef, provider: a.provider, accountNumber: a.accountNumber, bankName: a.bankName, accountName: a.accountName } }),
  ]);
}
