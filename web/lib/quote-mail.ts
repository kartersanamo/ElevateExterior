import { getContactRecipients, sendMail } from "@/lib/mailgun";
import { sendSms } from "@/lib/sms";
import { getSiteUrl } from "@/lib/stripe";
import { site, services } from "@/lib/site-config";
import type { QuoteRequest } from "@prisma/client";

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

function preferredScheduleLine(quote: QuoteRequest): string {
  if (quote.proposedDate && quote.proposedStartTime) {
    const end =
      quote.proposedEndTime && quote.proposedEndTime !== quote.proposedStartTime
        ? ` – ${formatTime(quote.proposedEndTime)}`
        : "";
    return `${formatDate(quote.proposedDate)} at ${formatTime(quote.proposedStartTime)}${end}`;
  }
  return "Not specified";
}

export async function sendQuoteRequestNotification(
  quote: QuoteRequest
): Promise<void> {
  const recipients = getContactRecipients();
  if (recipients.length === 0) return;

  const serviceLine = serviceLabels(quote.services);
  const scheduleLine = preferredScheduleLine(quote);
  const addressLine = quote.address ?? "Not provided";
  const phoneLine = quote.customerPhone ?? "Not provided";

  await sendMail({
    to: recipients,
    subject: `New quote request — ${quote.customerName}`,
    text: `New quote request from ${quote.customerName} (${quote.customerEmail})

Phone: ${phoneLine}
Address: ${addressLine}
Services: ${serviceLine}
Preferred time: ${scheduleLine}

${quote.message}

Review in admin: ${getSiteUrl()}/admin/quotes`,
    html: `<p>New quote request from <strong>${quote.customerName}</strong> (${quote.customerEmail})</p>
<ul>
  <li><strong>Phone:</strong> ${phoneLine}</li>
  <li><strong>Address:</strong> ${addressLine}</li>
  <li><strong>Services:</strong> ${serviceLine}</li>
  <li><strong>Preferred time:</strong> ${scheduleLine}</li>
</ul>
<p>${quote.message.replace(/\n/g, "<br />")}</p>
<p><a href="${getSiteUrl()}/admin/quotes">Review in admin</a></p>`,
    replyTo: quote.customerEmail,
  });
}

export async function sendQuoteRequestConfirmation(
  quote: QuoteRequest
): Promise<void> {
  const serviceLine = serviceLabels(quote.services);
  const scheduleLine = preferredScheduleLine(quote);

  await sendMail({
    to: [quote.customerEmail],
    subject: `Quote request received — ${site.shortName}`,
    text: `Hi ${quote.customerName},

Thanks for your quote request with ${site.name}.

Services: ${serviceLine}
Preferred time: ${scheduleLine}

We'll review your request and send a personalized quote within 24 hours.

Questions? Call ${site.phone}

— ${site.name}`,
    html: `<p>Hi ${quote.customerName},</p>
<p>Thanks for your quote request with <strong>${site.name}</strong>.</p>
<ul>
  <li><strong>Services:</strong> ${serviceLine}</li>
  <li><strong>Preferred time:</strong> ${scheduleLine}</li>
</ul>
<p>We&apos;ll review your request and send a personalized quote within 24 hours.</p>
<p>Questions? Call <a href="${site.phoneHref}">${site.phone}</a></p>
<p>— ${site.name}</p>`,
  });
}

export async function sendQuoteToCustomer(quote: QuoteRequest): Promise<void> {
  if (quote.quotedAmountCents == null) {
    throw new Error("Quote amount is required.");
  }

  const url = quoteUrl(quote.publicToken);

  await sendMail({
    to: [quote.customerEmail],
    subject: `Your quote from ${site.shortName}`,
    text: `Hi ${quote.customerName},

Your quote from ${site.name} is ready. Open the link below to review the full details and accept it on our website.

Review and accept: ${url}

— ${site.name}`,
    html: `
<p>Hi ${quote.customerName},</p>
<p>Your quote from <strong>${site.name}</strong> is ready. Click the button below to review the full details and accept it on our website.</p>
<p style="margin:24px 0;">
  <a href="${url}" style="display:inline-block;background:#0098e3;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Review &amp; accept quote</a>
</p>
<p>— ${site.name}</p>`,
  });

  await sendSms({
    to: quote.customerPhone,
    body: `Your quote from ${site.shortName} is ready. Review: ${url}`,
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
      replyTo: null,
    });
  }
}
