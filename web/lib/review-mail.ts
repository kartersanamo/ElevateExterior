import {
  buttonGroup,
  emailEyebrow,
  emailGreeting,
  emailHeading,
  emailParagraph,
  emailSignature,
  linkFallback,
  statusPanel,
  textButton,
  textFooter,
  textSignature,
  wrapBrandedContent,
} from "@/lib/email/design";
import { getGoogleReviewUrl } from "@/lib/google-review";
import { reviewPageUrl } from "@/lib/review-reward";
import { sendMail } from "@/lib/mailgun";
import { sendSms } from "@/lib/sms";
import { site } from "@/lib/site-config";
import type { Booking } from "@prisma/client";

export async function sendReviewRequest(booking: Booking): Promise<void> {
  const reviewUrl = await getGoogleReviewUrl();
  if (!reviewUrl) return;

  const reviewPage = reviewPageUrl();

  const html = wrapBrandedContent(
    [
      emailEyebrow("Thank you"),
      emailHeading("How did we do?"),
      emailGreeting(booking.customerName),
      statusPanel(
        "success",
        "Service complete",
        "We hope your home looks amazing. Your feedback means the world to our small business."
      ),
      emailParagraph(
        "If you have a moment, we'd love a quick Google review. It helps neighbors find us and keeps our team motivated."
      ),
      buttonGroup([{ label: "Leave a Google review", href: reviewPage }]),
      linkFallback("Or copy this link:", reviewPage),
      emailSignature(),
    ].join(""),
    {
      previewText: `We'd love your feedback on your recent service with ${site.shortName}`,
      title: `How did we do? — ${site.shortName}`,
    }
  );

  const text = `Hi ${booking.customerName},

Thank you for choosing ${site.name}! If you have a moment, we'd love a Google review:

${textButton("Leave a review", reviewPage)}

Your feedback helps our small business grow.${textSignature()}${textFooter()}`;

  await sendMail({
    to: [booking.customerEmail],
    subject: `How did we do? — ${site.shortName}`,
    text,
    html,
  });

  await sendSms({
    to: booking.customerPhone,
    body: `Thanks for choosing ${site.shortName}! We'd love a quick Google review: ${reviewPage}`,
  });
}
