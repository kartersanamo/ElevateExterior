import { db } from "@/lib/db";
import { getContactRecipients, getMailFromAddress, getMailgunClient } from "@/lib/mailgun";
import { getSiteUrl } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) return false;
  return true;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await db.quoteRequest.findMany({
    where: {
      status: { in: ["PENDING", "QUOTED"] },
      holdExpiresAt: { lt: now },
    },
  });

  if (expired.length > 0) {
    await db.quoteRequest.updateMany({
      where: { id: { in: expired.map((q) => q.id) } },
      data: { status: "EXPIRED" },
    });
  }

  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;
  const admins = getContactRecipients();

  if (mailgun && from && domain && admins.length > 0 && expired.length > 0) {
    const lines = expired.map(
      (q) => `• ${q.customerName} (${q.customerEmail}) — hold expired`
    );
    await mailgun.messages.create(domain, {
      from,
      to: admins,
      subject: `Quote holds expired (${expired.length})`,
      text: `These quote holds have expired and slots are available again:\n\n${lines.join("\n")}\n\nReview: ${getSiteUrl()}/admin/quotes`,
      html: `<p>These quote holds have expired:</p><ul>${lines.map((l) => `<li>${l.replace("• ", "")}</li>`).join("")}</ul><p><a href="${getSiteUrl()}/admin/quotes">Review quotes</a></p>`,
    });
  }

  return NextResponse.json({ ok: true, expired: expired.length });
}
