function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export async function sendSms(options: {
  to: string | null | undefined;
  body: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const to = options.to ? normalizePhone(options.to) : null;
  if (!to) {
    return { ok: false, skipped: true };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.info("[sms] skipped (Twilio not configured)", { to });
    return { ok: false, skipped: true };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: options.body.slice(0, 1600),
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("[sms] Twilio error:", response.status, text);
    return { ok: false };
  }

  return { ok: true };
}
