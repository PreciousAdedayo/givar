/** Sends SMS through Twilio's Messages API. Without keys it logs (dev only; production refuses). */
export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_SID, tok = process.env.TWILIO_TOKEN, from = process.env.TWILIO_FROM;
  if (!sid || !tok || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("SMS is not configured");
    console.log(`[sms:dev] to=${to} ${body}`); return;
  }
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST", headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!r.ok) throw new Error(`SMS failed (${r.status})`);
}
