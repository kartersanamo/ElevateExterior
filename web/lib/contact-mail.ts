import {
  getContactRecipients,
  getMailFromAddress,
  getMailgunClient,
} from "@/lib/mailgun";
import type { ContactFormData } from "@/lib/validators/contact";

export type ContactFormPayload = ContactFormData;

export async function sendContactFormEmail(
  payload: ContactFormPayload
): Promise<void> {
  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;
  const recipients = getContactRecipients();

  if (!mailgun || !from || !domain) {
    throw new Error("MAILGUN_NOT_CONFIGURED");
  }

  if (recipients.length === 0) {
    throw new Error("NO_CONTACT_RECIPIENTS");
  }

  const fullName = `${payload.firstName} ${payload.lastName}`;
  const phoneLine = payload.phone ? `\nPhone: ${payload.phone}` : "";

  await mailgun.messages.create(domain, {
    from,
    to: recipients,
    subject: `New inquiry from ${fullName} — Elevate Exterior`,
    text: `New contact form submission.

Name: ${fullName}
Email: ${payload.email}${phoneLine}

Message:
${payload.message}
`,
    html: `
<p>New contact form submission from the Elevate Exterior website.</p>
<p><strong>Name:</strong> ${fullName}<br>
<strong>Email:</strong> ${payload.email}${payload.phone ? `<br><strong>Phone:</strong> ${payload.phone}` : ""}</p>
<p><strong>Message:</strong></p>
<p style="white-space:pre-wrap;">${payload.message}</p>
`,
    "h:Reply-To": payload.email,
  });
}
