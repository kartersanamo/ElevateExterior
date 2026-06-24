import {
  getContactRecipients,
  getMailFromAddress,
  getMailgunClient,
} from "@/lib/mailgun";
import { formatCents } from "@/lib/recurring";
import { getSiteUrl } from "@/lib/stripe";
import { site, services } from "@/lib/site-config";
import type { QuoteRequest } from "@prisma/client";

async function sendMail(options: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
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
    ...(options.replyTo ? { "h:Reply-To": options.replyTo } : {}),
  });
}

function quoteUrl(token: string): string {
  return `${getSiteUrl()}/quote/${token}`;
}

function serviceLabels(idsJson: string): string {
  try {
    const ids = JSON.parse(idsJson) as string[];
    if (ids.length === 0) return "To be confirmed";
    return ids.map((id) => services.find((s) => s.id === id)?.title ?? id).join(", ");
  } catch {
    return "To be confirmed";
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

export async function sendQuoteRequestNotification(
  quote: QuoteRequest
): Promise<void> {
  const recipients = getContactRecipients();
  if (recipients.length === 0) return;

  await sendMail({
    to: recipients,
    subject: `New quote request — ${quote.customerName}`,
    text: `New quote request from ${quote.customerName} (${quote.customerEmail})

${quote.message}

Review in admin: ${getSiteUrl()}/admin/quotes`,
    html: `<p>New quote request from <strong>${quote.customerName}</strong> (${quote.customerEmail})</p>
<p>${quote.message.replace(/\n/g, "<br />")}</p>
<p><a href="${getSiteUrl()}/admin/quotes">Review in admin</a></p>`,
    replyTo: quote.customerEmail,
  });
}

export async function sendQuoteToCustomer(quote: QuoteRequest): Promise<void> {
  if (quote.quotedAmountCents == null) {
    throw new Error("Quote amount is required.");
  }

  const url = quoteUrl(quote.publicToken);
  const amount = formatCents(quote.quotedAmountCents);
  const serviceLine = serviceLabels(quote.services);
  const scheduleLine =
    quote.proposedDate && quote.proposedStartTime
      ? `Proposed: ${formatDate(quote.proposedDate)} at ${formatTime(quote.proposedStartTime)}`
      : "You will pick a time when you accept.";

  await sendMail({
    to: [quote.customerEmail],
    subject: `Your quote from ${site.shortName} — ${amount}`,
    text: `Hi ${quote.customerName},

Here is your quote from ${site.name}:

Services: ${serviceLine}
Amount: ${amount}
${scheduleLine}
${quote.quoteNotes ? `\nNotes: ${quote.quoteNotes}` : ""}

Review and accept: ${url}

— ${site.name}`,
    html: `
<p>Hi ${quote.customerName},</p>
<p>Here is your quote from <strong>${site.name}</strong>:</p>
<ul>
  <li><strong>Services:</strong> ${serviceLine}</li>
  <li><strong>Amount:</strong> ${amount}</li>
  <li><strong>Schedule:</strong> ${scheduleLine}</li>
</ul>
${quote.quoteNotes ? `<p>${quote.quoteNotes.replace(/\n/g, "<br />")}</p>` : ""}
<p style="margin:24px 0;">
  <a href="${url}" style="display:inline-block;background:#0d7a6f;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Review &amp; accept quote</a>
</p>
<p>— ${site.name}</p>`,
  });
}

export async function sendQuoteAcceptedEmails(
  quote: QuoteRequest
): Promise<void> {
  const recipients = getContactRecipients();
  if (recipients.length > 0) {
    await sendMail({
      to: recipients,
      subject: `Quote accepted — ${quote.customerName}`,
      text: `${quote.customerName} accepted their quote. Booking is confirmed.`,
      html: `<p><strong>${quote.customerName}</strong> accepted their quote. The job is now booked.</p>`,
    });
  }
}
