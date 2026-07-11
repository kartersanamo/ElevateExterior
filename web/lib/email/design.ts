import { getSiteUrl } from "@/lib/stripe";
import { site } from "@/lib/site-config";

export const emailColors = {
  forest: "#013c83",
  forestLight: "#0259a8",
  teal: "#0098e3",
  tealLight: "#4db8ef",
  mint: "#e6f4fc",
  cream: "#f5f9fd",
  slate: "#1e293b",
  slateMuted: "#5a718a",
  white: "#ffffff",
  border: "#d9e8f5",
  borderSubtle: "rgba(30,41,59,0.1)",
} as const;

const fontDisplay =
  "'Outfit', Arial, Helvetica, sans-serif";
const fontBody = "'DM Sans', Arial, Helvetica, sans-serif";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeHtmlWithBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

export function getBrandLogoUrl(): string {
  return `${getSiteUrl()}/logo.png`;
}

export interface DetailRow {
  label: string;
  value: string;
}

export interface EmailButton {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

export interface EmailDocumentOptions {
  previewText?: string;
  title?: string;
  content: string;
}

export function buildEmailDocument(options: EmailDocumentOptions): string {
  const preview = options.previewText
    ? escapeHtml(options.previewText)
    : "";
  const title = escapeHtml(options.title ?? site.shortName);
  const logoUrl = escapeHtml(getBrandLogoUrl());
  const siteUrl = escapeHtml(getSiteUrl());
  const phoneHref = escapeHtml(site.phoneHref);
  const phone = escapeHtml(site.phone);
  const email = escapeHtml(site.email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap');
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { color: ${emailColors.teal}; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${emailColors.cream};font-family:${fontBody};color:${emailColors.slate};">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preview}${"&nbsp;".repeat(80)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${emailColors.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${emailColors.forest};border-radius:16px 16px 0 0;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="${logoUrl}" alt="${escapeHtml(site.name)}" width="220" height="143" style="display:block;width:220px;max-width:100%;height:auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:4px;font-family:${fontBody};font-size:11px;font-weight:600;color:${emailColors.tealLight};text-transform:uppercase;letter-spacing:0.25em;">
                    Your home, elevated.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:${emailColors.white};padding:36px 32px;border-left:1px solid ${emailColors.border};border-right:1px solid ${emailColors.border};">
              ${options.content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:${emailColors.forest};border-radius:0 0 16px 16px;padding:28px 32px;">
              <p style="margin:0 0 8px;font-family:${fontDisplay};font-size:16px;font-weight:700;color:${emailColors.white};">
                ${escapeHtml(site.name)}
              </p>
              <p style="margin:0 0 16px;font-family:${fontBody};font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);">
                ${escapeHtml(site.serviceArea)}
              </p>
              <p style="margin:0;font-family:${fontBody};font-size:14px;line-height:1.8;">
                <a href="${phoneHref}" style="color:${emailColors.tealLight};text-decoration:none;font-weight:600;">${phone}</a>
                <span style="color:rgba(255,255,255,0.4);">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
                <a href="mailto:${email}" style="color:${emailColors.tealLight};text-decoration:none;font-weight:600;">${email}</a>
              </p>
              <p style="margin:16px 0 0;font-family:${fontBody};font-size:12px;color:rgba(255,255,255,0.5);">
                <a href="${siteUrl}" style="color:rgba(255,255,255,0.6);text-decoration:underline;">${siteUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailEyebrow(text: string): string {
  return `<p style="margin:0 0 12px;font-family:${fontBody};font-size:11px;font-weight:600;color:${emailColors.teal};text-transform:uppercase;letter-spacing:0.25em;">${escapeHtml(text)}</p>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${fontDisplay};font-size:26px;font-weight:700;line-height:1.25;color:${emailColors.forest};letter-spacing:-0.02em;">${escapeHtml(text)}</h1>`;
}

export function emailParagraph(
  text: string,
  options?: { muted?: boolean; marginBottom?: string }
): string {
  const color = options?.muted ? emailColors.slateMuted : emailColors.slate;
  const margin = options?.marginBottom ?? "16px";
  return `<p style="margin:0 0 ${margin};font-family:${fontBody};font-size:16px;line-height:1.65;color:${color};">${text}</p>`;
}

export function emailGreeting(name: string): string {
  return emailParagraph(`Hi ${escapeHtml(name)},`);
}

export function emailSignature(): string {
  return `<p style="margin:24px 0 0;font-family:${fontBody};font-size:15px;line-height:1.5;color:${emailColors.slateMuted};">— ${escapeHtml(site.name)}</p>`;
}

export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid ${emailColors.border};margin:28px 0;" />`;
}

export function statusPanel(
  variant: "success" | "info" | "warning",
  title: string,
  body?: string
): string {
  const styles = {
    success: {
      bg: emailColors.mint,
      border: emailColors.teal,
      title: emailColors.forest,
    },
    info: {
      bg: emailColors.cream,
      border: emailColors.border,
      title: emailColors.forest,
    },
    warning: {
      bg: "#fef3c7",
      border: "#f59e0b",
      title: "#92400e",
    },
  }[variant];

  const bodyHtml = body
    ? `<p style="margin:8px 0 0;font-family:${fontBody};font-size:15px;line-height:1.6;color:${emailColors.slateMuted};">${body}</p>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td style="background-color:${styles.bg};border:1px solid ${styles.border};border-radius:12px;padding:20px 24px;">
        <p style="margin:0;font-family:${fontDisplay};font-size:17px;font-weight:700;color:${styles.title};">${escapeHtml(title)}</p>
        ${bodyHtml}
      </td>
    </tr>
  </table>`;
}

export function detailCard(title: string, rows: DetailRow[]): string {
  const rowHtml = rows
    .map(
      (row) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${emailColors.border};font-family:${fontBody};font-size:13px;font-weight:600;color:${emailColors.slateMuted};vertical-align:top;width:120px;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${emailColors.border};font-family:${fontBody};font-size:15px;color:${emailColors.slate};vertical-align:top;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td style="background-color:${emailColors.cream};border:1px solid ${emailColors.border};border-radius:12px;padding:4px 20px 8px;">
        <p style="margin:16px 0 8px;font-family:${fontDisplay};font-size:14px;font-weight:700;color:${emailColors.forest};text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(title)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rowHtml}
        </table>
      </td>
    </tr>
  </table>`;
}

export function messageBlock(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td style="background-color:${emailColors.white};border:1px solid ${emailColors.border};border-left:4px solid ${emailColors.teal};border-radius:0 12px 12px 0;padding:20px 24px;">
        <p style="margin:0 0 8px;font-family:${fontBody};font-size:12px;font-weight:600;color:${emailColors.slateMuted};text-transform:uppercase;letter-spacing:0.08em;">Message</p>
        <p style="margin:0;font-family:${fontBody};font-size:15px;line-height:1.65;color:${emailColors.slate};white-space:pre-wrap;">${escapeHtmlWithBreaks(content)}</p>
      </td>
    </tr>
  </table>`;
}

function buttonStyles(variant: "primary" | "secondary"): string {
  if (variant === "secondary") {
    return `background-color:${emailColors.forest};color:${emailColors.white};`;
  }
  return `background-color:${emailColors.teal};color:${emailColors.white};`;
}

export function emailButton(label: string, href: string, variant: "primary" | "secondary" = "primary"): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeHref}" style="display:inline-block;${buttonStyles(variant)}font-family:${fontBody};font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;text-transform:uppercase;letter-spacing:0.04em;">${safeLabel}</a>`;
}

export function buttonGroup(buttons: EmailButton[]): string {
  const cells = buttons
    .map(
      (btn, i) =>
        `<td style="padding:${i > 0 ? "0 0 0 12px" : "0"};">${emailButton(btn.label, btn.href, btn.variant ?? "primary")}</td>`
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>${cells}</tr>
  </table>`;
}

export function linkFallback(label: string, href: string): string {
  return `<p style="margin:0 0 16px;font-family:${fontBody};font-size:13px;line-height:1.6;color:${emailColors.slateMuted};">${escapeHtml(label)}<br /><a href="${escapeHtml(href)}" style="color:${emailColors.teal};word-break:break-all;">${escapeHtml(href)}</a></p>`;
}

export function wrapBrandedContent(
  content: string,
  options?: Omit<EmailDocumentOptions, "content">
): string {
  return buildEmailDocument({ ...options, content });
}

export function wrapTemplateContent(
  innerHtml: string,
  options?: Omit<EmailDocumentOptions, "content">
): string {
  return buildEmailDocument({
    ...options,
    content: `<div style="font-family:${fontBody};font-size:16px;line-height:1.65;color:${emailColors.slate};">${innerHtml}</div>`,
  });
}

export function textSignature(): string {
  return `\n— ${site.name}`;
}

export function textFooter(): string {
  return `\n${site.name}\n${site.serviceArea}\n${site.phone} · ${site.email}\n${getSiteUrl()}`;
}

export function textDivider(): string {
  return "\n──────────────────────────────";
}

export function textDetailBlock(title: string, rows: DetailRow[]): string {
  const lines = rows.map((row) => `${row.label}: ${row.value}`).join("\n");
  return `${title}\n${lines}`;
}

export function textButton(label: string, href: string): string {
  return `${label}: ${href}`;
}
