import FormData from "form-data";
import Mailgun from "mailgun.js";

function stripEnvQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN
    ? stripEnvQuotes(process.env.MAILGUN_DOMAIN)
    : undefined;

  if (!apiKey || !domain) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return mailgun.client({ username: "api", key: apiKey });
}

export function getMailFromAddress(): string | null {
  const domain = process.env.MAILGUN_DOMAIN
    ? stripEnvQuotes(process.env.MAILGUN_DOMAIN)
    : undefined;

  const raw = process.env.MAILGUN_FROM
    ? stripEnvQuotes(process.env.MAILGUN_FROM)
    : null;

  if (raw) return raw;

  if (domain) {
    return `Elevate Exterior <noreply@${domain}>`;
  }

  return null;
}

export function getContactRecipients(): string[] {
  const to = process.env.CONTACT_TO_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!to) return [];
  return to.split(",").map((e) => e.trim()).filter(Boolean);
}
