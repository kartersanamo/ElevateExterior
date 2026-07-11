import {
  buttonGroup,
  detailCard,
  emailEyebrow,
  emailGreeting,
  emailHeading,
  emailParagraph,
  emailSignature,
  linkFallback,
  messageBlock,
  statusPanel,
  textButton,
  textDetailBlock,
  textDivider,
  textFooter,
  textSignature,
  wrapBrandedContent,
} from "@/lib/email/design";
import { getAdminNotificationRecipients } from "@/lib/admin-notifications";
import { sendMail } from "@/lib/mailgun";
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

function quoteDetailRows(quote: QuoteRequest) {
  return [
    { label: "Customer", value: quote.customerName },
    { label: "Email", value: quote.customerEmail },
    { label: "Phone", value: quote.customerPhone ?? "Not provided" },
    { label: "Address", value: quote.address ?? "Not provided" },
    { label: "Services", value: serviceLabels(quote.services) },
    { label: "Preferred time", value: preferredScheduleLine(quote) },
  ];
}

export async function sendQuoteRequestNotification(
  quote: QuoteRequest
): Promise<void> {
  const recipients = await getAdminNotificationRecipients("QUOTE_REQUEST_SUBMITTED");
  if (recipients.length === 0) return;

  const adminUrl = `${getSiteUrl()}/admin/quotes`;
  const rows = quoteDetailRows(quote);

  const html = wrapBrandedContent(
    [
      emailEyebrow("New quote request"),
      emailHeading("Quote request received"),
      emailParagraph("A new quote request just came in from your website."),
      detailCard("Request details", rows),
      quote.message ? messageBlock(quote.message) : "",
      buttonGroup([{ label: "Review in admin", href: adminUrl }]),
      linkFallback("Or open this link:", adminUrl),
    ].join(""),
    {
      previewText: `New quote request from ${quote.customerName}`,
      title: `New quote request — ${quote.customerName}`,
    }
  );

  const text = `New quote request from ${quote.customerName} (${quote.customerEmail})

${textDivider()}
${textDetailBlock("Request details", rows)}
${quote.message ? `\nMessage:\n${quote.message}` : ""}
${textDivider()}

${textButton("Review in admin", adminUrl)}${textFooter()}`;

  await sendMail({
    to: recipients,
    subject: `New quote request — ${quote.customerName}`,
    text,
    html,
    replyTo: quote.customerEmail,
  });
}

export async function sendQuoteRequestConfirmation(
  quote: QuoteRequest
): Promise<void> {
  const serviceLine = serviceLabels(quote.services);
  const scheduleLine = preferredScheduleLine(quote);

  const html = wrapBrandedContent(
    [
      emailEyebrow("Quote request"),
      emailHeading("We received your request"),
      emailGreeting(quote.customerName),
      statusPanel(
        "success",
        "You're on our list",
        `We'll review your request and send a personalized quote within 24 hours.`
      ),
      detailCard("Your request", [
        { label: "Services", value: serviceLine },
        { label: "Preferred time", value: scheduleLine },
      ]),
      emailParagraph(
        `Questions in the meantime? Call us at <a href="${site.phoneHref}" style="color:#0098e3;font-weight:600;text-decoration:none;">${site.phone}</a>.`
      ),
      emailSignature(),
    ].join(""),
    {
      previewText: `Thanks for your quote request with ${site.shortName}`,
      title: `Quote request received — ${site.shortName}`,
    }
  );

  const text = `Hi ${quote.customerName},

Thanks for your quote request with ${site.name}.

${textDivider()}
${textDetailBlock("Your request", [
  { label: "Services", value: serviceLine },
  { label: "Preferred time", value: scheduleLine },
])}
${textDivider()}

We'll review your request and send a personalized quote within 24 hours.

Questions? Call ${site.phone}${textSignature()}${textFooter()}`;

  await sendMail({
    to: [quote.customerEmail],
    subject: `Quote request received — ${site.shortName}`,
    text,
    html,
  });
}

export async function sendQuoteToCustomer(quote: QuoteRequest): Promise<void> {
  if (quote.quotedAmountCents == null) {
    throw new Error("Quote amount is required.");
  }

  const url = quoteUrl(quote.publicToken);

  const html = wrapBrandedContent(
    [
      emailEyebrow("Your quote"),
      emailHeading("Your quote is ready"),
      emailGreeting(quote.customerName),
      emailParagraph(
        `Your personalized quote from <strong style="color:#013c83;">${site.name}</strong> is ready. Review the full details and accept it online in just a few clicks.`
      ),
      buttonGroup([{ label: "Review & accept quote", href: url }]),
      linkFallback("Or copy this link:", url),
      emailSignature(),
    ].join(""),
    {
      previewText: `Your quote from ${site.shortName} is ready to review`,
      title: `Your quote from ${site.shortName}`,
    }
  );

  const text = `Hi ${quote.customerName},

Your quote from ${site.name} is ready. Open the link below to review the full details and accept it on our website.

${textButton("Review and accept", url)}${textSignature()}${textFooter()}`;

  await sendMail({
    to: [quote.customerEmail],
    subject: `Your quote from ${site.shortName}`,
    text,
    html,
  });

  await sendSms({
    to: quote.customerPhone,
    body: `Your quote from ${site.shortName} is ready. Review: ${url}`,
  });
}

export async function sendQuoteAcceptedEmails(
  quote: QuoteRequest
): Promise<void> {
  const recipients = await getAdminNotificationRecipients("QUOTE_ACCEPTED");
  if (recipients.length === 0) return;

  const adminUrl = `${getSiteUrl()}/admin/quotes`;
  const rows = quoteDetailRows(quote);

  const html = wrapBrandedContent(
    [
      emailEyebrow("Quote accepted"),
      emailHeading("Quote accepted — booking confirmed"),
      statusPanel("success", `${quote.customerName} accepted their quote`),
      emailParagraph("The job is now booked. Review the details below."),
      detailCard("Booking details", rows),
      buttonGroup([{ label: "View in admin", href: adminUrl }]),
      linkFallback("Or open this link:", adminUrl),
    ].join(""),
    {
      previewText: `${quote.customerName} accepted their quote`,
      title: `Quote accepted — ${quote.customerName}`,
    }
  );

  const text = `${quote.customerName} accepted their quote. The job is now booked.

${textDivider()}
${textDetailBlock("Booking details", rows)}
${textDivider()}

${textButton("View in admin", adminUrl)}${textFooter()}`;

  await sendMail({
    to: recipients,
    subject: `Quote accepted — ${quote.customerName}`,
    text,
    html,
    replyTo: null,
  });
}
