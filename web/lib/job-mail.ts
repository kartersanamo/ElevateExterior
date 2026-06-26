import {
  getContactRecipients,
  getMailFromAddress,
  getMailgunClient,
} from "@/lib/mailgun";
import { formatCents } from "@/lib/recurring";
import { sendSms } from "@/lib/sms";
import { appointmentUrl } from "@/lib/urls";
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

function jobPageUrl(token: string): string {
  return appointmentUrl(token);
}

export async function sendJobCompletedEmail(booking: Booking): Promise<void> {
  if (!booking.publicToken || booking.amountChargedCents == null) {
    throw new Error("Job is not ready for customer email.");
  }

  const url = jobPageUrl(booking.publicToken);
  const amount = formatCents(booking.amountChargedCents);
  const payUrl = `${url}#pay`;
  const recurringUrl = `${url}#recurring`;

  await sendMail({
    to: [booking.customerEmail],
    subject: `Your service is complete — ${site.shortName}`,
    text: `Hi ${booking.customerName},

Your exterior cleaning is complete! View photos, pay your invoice (${amount}), or set up recurring service:

${url}

Pay now: ${payUrl}
Set up recurring service: ${recurringUrl}

— ${site.name}`,
    html: `
<p>Hi ${booking.customerName},</p>
<p>Your exterior cleaning is <strong>complete</strong>! View your job summary, before/after photos, and invoice at the link below.</p>
<p style="margin:24px 0;">
  <a href="${payUrl}" style="display:inline-block;background:#0098e3;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-right:12px;">Pay ${amount}</a>
  <a href="${recurringUrl}" style="display:inline-block;background:#013c83;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Schedule recurring</a>
</p>
<p><a href="${url}">View your job summary &amp; photos</a></p>
<p>— ${site.name}</p>`,
  });

  await sendSms({
    to: booking.customerPhone,
    body: `Your Elevate Exterior service is complete! View photos & pay: ${url}`,
  });
}

export async function sendInvoiceEmail(
  booking: Booking,
  invoiceHtml: string
): Promise<void> {
  await sendMail({
    to: [booking.customerEmail],
    subject: `Invoice ${booking.invoiceNumber} — ${site.shortName}`,
    text: `Hi ${booking.customerName},

Thank you for your payment! Your invoice ${booking.invoiceNumber} is attached below.

${booking.publicToken ? jobPageUrl(booking.publicToken) : ""}

— ${site.name}`,
    html: `
<p>Hi ${booking.customerName},</p>
<p>Thank you for your payment! Here is your invoice <strong>${booking.invoiceNumber}</strong>.</p>
${booking.publicToken ? `<p><a href="${jobPageUrl(booking.publicToken)}">View job summary</a></p>` : ""}
<hr />
${invoiceHtml}`,
  });

  const admins = getContactRecipients();
  if (admins.length > 0) {
    await sendMail({
      to: admins,
      subject: `Payment received — ${booking.customerName} (${formatCents(booking.amountChargedCents ?? 0)})`,
      text: `Payment received for booking ${booking.id}. Invoice ${booking.invoiceNumber}.`,
      html: `<p>Payment received for <strong>${booking.customerName}</strong>.</p><p>Invoice ${booking.invoiceNumber}</p>`,
    });
  }
}
