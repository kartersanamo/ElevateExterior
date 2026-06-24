import FormData from "form-data";
import Mailgun from "mailgun.js";

export function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return mailgun.client({ username: "api", key: apiKey });
}

export function getMailFromAddress(): string | null {
  return process.env.MAILGUN_FROM ?? null;
}

export function getContactRecipients(): string[] {
  const to = process.env.CONTACT_TO_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!to) return [];
  return to.split(",").map((e) => e.trim()).filter(Boolean);
}
