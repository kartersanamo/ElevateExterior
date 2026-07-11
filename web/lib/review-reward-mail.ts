import {
  detailCard,
  emailEyebrow,
  emailGreeting,
  emailHeading,
  emailParagraph,
  emailSignature,
  statusPanel,
  textDetailBlock,
  textFooter,
  textSignature,
  wrapBrandedContent,
} from "@/lib/email/design";
import { getAdminNotificationRecipients } from "@/lib/admin-notifications";
import { sendMail } from "@/lib/mailgun";
import { REVIEW_DISCOUNT_PERCENT } from "@/lib/review-reward";
import { site } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/stripe";
import type { Booking } from "@prisma/client";

export async function sendReviewDiscountConfirmationEmail(
  booking: Booking,
  code: string
): Promise<void> {
  const percent = REVIEW_DISCOUNT_PERCENT;

  const html = wrapBrandedContent(
    [
      emailEyebrow("Your reward"),
      emailHeading(`Your ${percent}% off code is ready`),
      emailGreeting(booking.customerName),
      statusPanel(
        "success",
        code,
        `Save this code and mention it when you book your next cleaning. One use per customer.`
      ),
      emailParagraph(
        `Thank you for leaving a Google review! We truly appreciate you helping neighbors find ${site.shortName}.`
      ),
      emailSignature(),
    ].join(""),
    {
      previewText: `Your ${percent}% off code: ${code}`,
      title: `Your ${percent}% off code — ${site.shortName}`,
    }
  );

  const text = `Hi ${booking.customerName},

Thank you for leaving a Google review! Your ${percent}% off code:

${code}

Mention this code when you book your next cleaning. One use per customer.${textSignature()}${textFooter()}`;

  await sendMail({
    to: [booking.customerEmail],
    subject: `Your ${percent}% off code — ${site.shortName}`,
    text,
    html,
  });
}

export async function sendReviewDiscountClaimedAdminEmail(
  booking: Booking,
  code: string
): Promise<void> {
  const admins = await getAdminNotificationRecipients("REVIEW_DISCOUNT_CLAIMED");
  if (admins.length === 0) return;

  const adminJobUrl = `${getSiteUrl()}/admin/jobs/${booking.id}`;
  const percent = REVIEW_DISCOUNT_PERCENT;

  const html = wrapBrandedContent(
    [
      emailEyebrow("Review reward"),
      emailHeading("Customer claimed review discount"),
      statusPanel(
        "info",
        `${booking.customerName} claimed ${percent}% off`,
        "Verify their Google review when they rebook, then mark the discount as redeemed in admin."
      ),
      detailCard("Claim details", [
        { label: "Customer", value: booking.customerName },
        { label: "Email", value: booking.customerEmail },
        { label: "Invoice", value: booking.invoiceNumber ?? "—" },
        { label: "Discount code", value: code },
        { label: "Booking ID", value: booking.id },
      ]),
      emailParagraph(
        `<a href="${adminJobUrl}" style="color:#0098e3;font-weight:600;">View job in admin →</a>`,
        { marginBottom: "0" }
      ),
    ].join(""),
    {
      previewText: `${booking.customerName} claimed review discount ${code}`,
      title: `Review discount claimed — ${booking.customerName}`,
    }
  );

  const text = `${booking.customerName} claimed a ${percent}% review discount.

${textDetailBlock("Claim details", [
  { label: "Customer", value: booking.customerName },
  { label: "Email", value: booking.customerEmail },
  { label: "Discount code", value: code },
  { label: "Admin link", value: adminJobUrl },
])}${textFooter()}`;

  await sendMail({
    to: admins,
    subject: `Review discount claimed — ${booking.customerName} (${code})`,
    text,
    html,
    replyTo: null,
  });
}
