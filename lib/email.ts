/** Sends transactional email through Resend using one consistent, responsive Givar wrapper. */
function brandedEmail(content: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Givar</title></head>
  <body style="margin:0;padding:24px 12px;background:#f3f2ed;font-family:Arial,Helvetica,sans-serif;color:#171923;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">A message from Givar</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e7e5dc;border-radius:18px;overflow:hidden">
      <tr><td style="padding:22px 28px;background:#141725;color:#fff"><div style="font-size:23px;font-weight:800;letter-spacing:-.6px"><span style="color:#d9f45b">◆</span> Givar</div><div style="margin-top:4px;color:#c6c8d1;font-size:12px;letter-spacing:1.2px;text-transform:uppercase">Give. Claim. Win.</div></td></tr>
      <tr><td style="padding:30px 28px;font-size:15px;line-height:1.7;color:#252838">${content}</td></tr>
      <tr><td style="padding:18px 28px;background:#f8f8f5;border-top:1px solid #e7e5dc;color:#777b87;font-size:12px;line-height:1.6">This is an account message from Givar. Keep your password, verification codes and security links private.<br>© ${new Date().getFullYear()} Givar.app</td></tr>
    </table><style>@media(max-width:480px){body{padding:12px 8px!important}td{padding-left:18px!important;padding-right:18px!important}}</style>
  </body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const safeSubject = subject.replace(/[\r\n]/g, " ").slice(0, 180);
  const content = brandedEmail(html);
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
    console.log(`[email:dev] to=${to} subject=${safeSubject}\n${content}`);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Givar <no-reply@givar.app>", to, subject: safeSubject, html: content }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Email failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
}
