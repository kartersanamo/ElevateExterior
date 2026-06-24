import { db } from "@/lib/db";
import { addMonths, frequencyToMonths } from "@/lib/recurring";
import { getContactRecipients, getMailFromAddress, getMailgunClient } from "@/lib/mailgun";
import { site } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);

  const dueSoon = await db.recurringService.findMany({
    where: {
      active: true,
      nextServiceDate: { lte: horizon },
    },
    orderBy: { nextServiceDate: "asc" },
  });

  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;
  const admins = getContactRecipients();
  let notified = 0;

  if (mailgun && from && domain && admins.length > 0 && dueSoon.length > 0) {
    const lines = dueSoon.map((r) => {
      const date = r.nextServiceDate?.toLocaleDateString("en-US") ?? "TBD";
      return `• ${r.customerName} (${r.customerEmail}) — due ${date}`;
    });

    await mailgun.messages.create(domain, {
      from,
      to: admins,
      subject: `Recurring services due soon (${dueSoon.length})`,
      text: `These recurring customers are due for service within 14 days:\n\n${lines.join("\n")}\n\nManage: ${getSiteUrl()}/admin/recurring`,
      html: `<p>These recurring customers are due for service within 14 days:</p><ul>${lines.map((l) => `<li>${l.replace("• ", "")}</li>`).join("")}</ul><p><a href="${getSiteUrl()}/admin/recurring">Manage recurring services</a></p>`,
    });
    notified = dueSoon.length;
  }

  const overdue = dueSoon.filter(
    (r) => r.nextServiceDate && r.nextServiceDate < today
  );

  for (const recurring of overdue) {
    const months = frequencyToMonths(recurring.frequency);
    await db.recurringService.update({
      where: { id: recurring.id },
      data: {
        nextServiceDate: addMonths(recurring.nextServiceDate ?? today, months),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    dueSoon: dueSoon.length,
    notified,
    advanced: overdue.length,
  });
}
