import { getGoogleReviewUrl } from "@/lib/google-review";
import {
  getMailFromAddress,
  getMailgunClient,
} from "@/lib/mailgun";
import { sendSms } from "@/lib/sms";
import { site } from "@/lib/site-config";
import type { Booking } from "@prisma/client";

async function sendMail(options: {
  to: string[];
  subject: string;
  text: string;
  html: string;
}) {
  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;

  if (!mailgun || !from || !domain) {
    throw new Error("MAILGUN_NOT_CONFIGURED");
  }

  await mailgun.messages.create(domain, {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export async function sendReviewRequest(booking: Booking): Promise<void> {
  const reviewUrl = await getGoogleReviewUrl();
  if (!reviewUrl) return;

  await sendMail({
    to: [booking.customerEmail],
    subject: `How did we do? — ${site.shortName}`,
    text: `Hi ${booking.customerName},

Thank you for choosing ${site.name}! If you have a moment, we'd love a Google review:

${reviewUrl}

Your feedback helps our small business grow.

— ${site.name}`,
    html: `
<p>Hi ${booking.customerName},</p>
<p>Thank you for choosing <strong>${site.name}</strong>! If you have a moment, we&apos;d love a Google review.</p>
<p style="margin:24px 0;">
  <a href="${reviewUrl}" style="display:inline-block;background:#0098e3;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Leave us a Google review</a>
</p>
<p>Your feedback helps our small business grow.</p>
<p>— ${site.name}</p>`,
  });

  await sendSms({
    to: booking.customerPhone,
    body: `Thanks for choosing ${site.shortName}! We'd love a quick Google review: ${reviewUrl}`,
  });
}
