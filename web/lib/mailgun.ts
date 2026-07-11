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

function readEnv(key: string): string | undefined {
  const raw = process.env[key];
  return raw ? stripEnvQuotes(raw) : undefined;
}

export function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = readEnv("MAILGUN_DOMAIN");

  if (!apiKey || !domain) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return mailgun.client({ username: "api", key: apiKey });
}

export function getMailFromAddress(): string | null {
  const domain = readEnv("MAILGUN_DOMAIN");
  const raw = readEnv("MAILGUN_FROM");

  if (raw) return raw;

  if (domain) {
    return `Elevate Exterior <noreply@${domain}>`;
  }

  return null;
}

/** Branded reply address; Mailgun forwards inbound mail to CONTACT_TO_EMAIL. */
export function getReplyToAddress(): string | null {
  const explicit = readEnv("MAILGUN_REPLY_TO");
  if (explicit) return explicit;

  const domain = readEnv("MAILGUN_DOMAIN");
  if (domain) return `replies@${domain}`;

  const contact = process.env.CONTACT_TO_EMAIL?.split(",")[0]?.trim();
  return contact ?? null;
}

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  /** Omit for default company reply address; null to skip Reply-To. */
  replyTo?: string | null;
}) {
  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = readEnv("MAILGUN_DOMAIN");

  if (!mailgun || !from || !domain) {
    throw new Error("MAILGUN_NOT_CONFIGURED");
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];
  const replyTo =
    options.replyTo === undefined
      ? getReplyToAddress()
      : options.replyTo ?? undefined;

  await mailgun.messages.create(domain, {
    from,
    to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    ...(replyTo ? { "h:Reply-To": replyTo } : {}),
  });
}
