/** Sends mail through Resend. Without a key it logs the message (dev). */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log(`[email:dev] to=${to} subject=${subject}\n${html}`); return; }
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Givar <no-reply@givar.app>", to, subject, html }) });
  if (!r.ok) throw new Error(`Email failed (${r.status})`);
}
