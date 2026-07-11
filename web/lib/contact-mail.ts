import {
  buttonGroup,
  detailCard,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  linkFallback,
  messageBlock,
  textDetailBlock,
  textDivider,
  textFooter,
  wrapBrandedContent,
} from "@/lib/email/design";
import { getAdminNotificationRecipients } from "@/lib/admin-notifications";
import { sendMail } from "@/lib/mailgun";
import { getSiteUrl } from "@/lib/stripe";
import type { ContactFormData } from "@/lib/validators/contact";

export type ContactFormPayload = ContactFormData;

export async function sendContactFormEmail(
  payload: ContactFormPayload
): Promise<void> {
  const recipients = await getAdminNotificationRecipients("CONTACT_FORM_SUBMITTED");

  if (recipients.length === 0) {
    throw new Error("NO_CONTACT_RECIPIENTS");
  }

  const fullName = `${payload.firstName} ${payload.lastName}`;
  const adminUrl = `${getSiteUrl()}/admin`;

  const rows = [
    { label: "Name", value: fullName },
    { label: "Email", value: payload.email },
    ...(payload.phone ? [{ label: "Phone", value: payload.phone }] : []),
  ];

  const html = wrapBrandedContent(
    [
      emailEyebrow("Website inquiry"),
      emailHeading("New contact form submission"),
      emailParagraph("Someone reached out through the contact form on your website."),
      detailCard("Contact details", rows),
      messageBlock(payload.message),
      buttonGroup([{ label: "Open admin", href: adminUrl }]),
      linkFallback("Reply directly to this email to respond to the customer.", `mailto:${payload.email}`),
    ].join(""),
    {
      previewText: `New inquiry from ${fullName}`,
      title: `New inquiry from ${fullName}`,
    }
  );

  const text = `New contact form submission.

${textDivider()}
${textDetailBlock("Contact details", rows)}
${textDivider()}

Message:
${payload.message}
${textDivider()}

Reply directly to this email to respond to the customer.${textFooter()}`;

  await sendMail({
    to: recipients,
    subject: `New inquiry from ${fullName} — Elevate Exterior`,
    text,
    html,
    replyTo: payload.email,
  });
}
