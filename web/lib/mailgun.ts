import { promises as fs } from "fs";
import path from "path";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import {
  applyInlineBrandImageCids,
  BRAND_AVATAR_CID,
  BRAND_LOGO_CID,
} from "@/lib/email/design";

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

async function readPublicAsset(
  filename: string
): Promise<{ filename: string; data: Buffer } | null> {
  const candidates = [
    path.join(process.cwd(), "public", filename),
    path.join(process.cwd(), "web", "public", filename),
  ];

  for (const filePath of candidates) {
    try {
      const data = await fs.readFile(filePath);
      return { filename, data };
    } catch {
      // try next path
    }
  }

  return null;
}

async function getBrandInlineImages() {
  const [avatar, logo] = await Promise.all([
    readPublicAsset(BRAND_AVATAR_CID),
    readPublicAsset(BRAND_LOGO_CID),
  ]);

  return [avatar, logo].filter(
    (file): file is { filename: string; data: Buffer } => file != null
  );
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

  const inline = await getBrandInlineImages();
  const html =
    inline.length > 0
      ? applyInlineBrandImageCids(options.html)
      : options.html;

  await mailgun.messages.create(domain, {
    from,
    to,
    subject: options.subject,
    text: options.text,
    html,
    ...(replyTo ? { "h:Reply-To": replyTo } : {}),
    ...(inline.length > 0 ? { inline } : {}),
  });
}
