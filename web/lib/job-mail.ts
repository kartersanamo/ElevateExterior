import {
  buttonGroup,
  detailCard,
  emailDivider,
  emailEyebrow,
  emailGreeting,
  emailHeading,
  emailParagraph,
  emailSignature,
  linkFallback,
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
import { formatCents } from "@/lib/recurring";
import { sendSms } from "@/lib/sms";
import { appointmentUrl } from "@/lib/urls";
import { site } from "@/lib/site-config";
import type { Booking } from "@prisma/client";

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

  const html = wrapBrandedContent(
    [
      emailEyebrow("Service complete"),
      emailHeading("Your cleaning is complete"),
      emailGreeting(booking.customerName),
      statusPanel(
        "success",
        "Job finished",
        "View your job summary, before/after photos, and invoice at the link below."
      ),
      emailParagraph(`Your invoice total is <strong style="color:#013c83;">${amount}</strong>. Pay online or set up recurring service in one click.`),
      buttonGroup([
        { label: `Pay ${amount}`, href: payUrl },
        { label: "Schedule recurring", href: recurringUrl, variant: "secondary" },
      ]),
      linkFallback("View your job summary & photos:", url),
      emailSignature(),
    ].join(""),
    {
      previewText: `Your exterior cleaning is complete — view photos and pay your invoice`,
      title: `Service complete — ${site.shortName}`,
    }
  );

  const text = `Hi ${booking.customerName},

Your exterior cleaning is complete! View photos, pay your invoice (${amount}), or set up recurring service:

${textButton("View job summary", url)}
${textButton("Pay now", payUrl)}
${textButton("Set up recurring service", recurringUrl)}${textSignature()}${textFooter()}`;

  await sendMail({
    to: [booking.customerEmail],
    subject: `Your service is complete — ${site.shortName}`,
    text,
    html,
  });

  await sendSms({
    to: booking.customerPhone,
    body: `Your Elevate Exterior service is complete! View photos & pay: ${url}`,
  });
}

export async function sendInvoiceEmail(
  booking: Booking,
  invoiceSectionHtml: string
): Promise<void> {
  const jobUrl = booking.publicToken ? jobPageUrl(booking.publicToken) : null;

  const html = wrapBrandedContent(
    [
      emailEyebrow("Payment received"),
      emailHeading("Thank you for your payment"),
      emailGreeting(booking.customerName),
      statusPanel("success", "Payment confirmed", `Invoice ${booking.invoiceNumber} has been paid in full.`),
      jobUrl
        ? buttonGroup([{ label: "View job summary", href: jobUrl }])
        : "",
      jobUrl ? linkFallback("Or copy this link:", jobUrl) : "",
      emailDivider(),
      invoiceSectionHtml,
      emailSignature(),
    ].join(""),
    {
      previewText: `Payment received — invoice ${booking.invoiceNumber}`,
      title: `Invoice ${booking.invoiceNumber} — ${site.shortName}`,
    }
  );

  const text = `Hi ${booking.customerName},

Thank you for your payment! Your invoice ${booking.invoiceNumber} is attached below.

${jobUrl ? textButton("View job summary", jobUrl) : ""}${textSignature()}${textFooter()}`;

  await sendMail({
    to: [booking.customerEmail],
    subject: `Invoice ${booking.invoiceNumber} — ${site.shortName}`,
    text,
    html,
  });

  const admins = await getAdminNotificationRecipients("PAYMENT_RECEIVED");
  if (admins.length > 0) {
    const amount = formatCents(booking.amountChargedCents ?? 0);
    const adminHtml = wrapBrandedContent(
      [
        emailEyebrow("Payment received"),
        emailHeading("Payment received"),
        statusPanel("success", `${booking.customerName} paid ${amount}`),
        detailCard("Payment details", [
          { label: "Customer", value: booking.customerName },
          { label: "Email", value: booking.customerEmail },
          { label: "Invoice", value: booking.invoiceNumber ?? "—" },
          { label: "Amount", value: amount },
          { label: "Booking ID", value: booking.id },
        ]),
      ].join(""),
      {
        previewText: `Payment received from ${booking.customerName}`,
        title: `Payment received — ${booking.customerName}`,
      }
    );

    const adminText = `Payment received for booking ${booking.id}.

${textDivider()}
${textDetailBlock("Payment details", [
  { label: "Customer", value: booking.customerName },
  { label: "Invoice", value: booking.invoiceNumber ?? "—" },
  { label: "Amount", value: amount },
])}${textFooter()}`;

    await sendMail({
      to: admins,
      subject: `Payment received — ${booking.customerName} (${amount})`,
      text: adminText,
      html: adminHtml,
      replyTo: null,
    });
  }
}
