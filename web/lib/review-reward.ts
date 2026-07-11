import { randomBytes } from "crypto";
import {
  buttonGroup,
  emailColors,
  escapeHtml,
  textButton,
} from "@/lib/email/design";
import { appointmentUrl } from "@/lib/urls";
import { getSiteUrl } from "@/lib/stripe";

export const REVIEW_DISCOUNT_PERCENT = 10;

export function generateReviewDiscountCode(): string {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `REVIEW-${suffix}`;
}

export function reviewClaimUrl(publicToken: string): string {
  return `${appointmentUrl(publicToken)}#review-reward`;
}

export function reviewPageUrl(): string {
  return `${getSiteUrl()}/review`;
}

export function buildReviewRewardEmailSection(
  reviewUrl: string,
  claimUrl: string
): string {
  const percent = REVIEW_DISCOUNT_PERCENT;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 24px;">
    <tr>
      <td style="background-color:${emailColors.forest};border-radius:16px;padding:32px 28px;text-align:center;">
        <p style="margin:0 0 8px;font-family:'Outfit', Arial, Helvetica, sans-serif;font-size:12px;font-weight:700;color:${emailColors.tealLight};text-transform:uppercase;letter-spacing:0.2em;">Thank you bonus</p>
        <p style="margin:0 0 12px;font-family:'Outfit', Arial, Helvetica, sans-serif;font-size:24px;font-weight:700;line-height:1.3;color:${emailColors.white};">Get ${percent}% off your next cleaning</p>
        <p style="margin:0 0 24px;font-family:'DM Sans', Arial, Helvetica, sans-serif;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.85);">Leave a Google review and get <strong style="color:${emailColors.white};">${percent}% off</strong> your next order. After you post, tap below to claim your discount code.</p>
        ${buttonGroup([
          { label: "Leave a Google review", href: reviewUrl },
          {
            label: "I left my review — get my 10% off",
            href: claimUrl,
            variant: "secondary",
          },
        ])}
        <p style="margin:0;font-family:'DM Sans', Arial, Helvetica, sans-serif;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.6);">Offer valid for one use on your next booking with ${escapeHtml("Elevate Exterior")}.</p>
      </td>
    </tr>
  </table>`;
}

export function buildReviewRewardPlainText(
  reviewUrl: string,
  claimUrl: string
): string {
  const percent = REVIEW_DISCOUNT_PERCENT;
  return `
Get ${percent}% off your next cleaning!

Leave a Google review and claim your discount code after posting.

${textButton("Leave a Google review", reviewUrl)}
${textButton("I left my review — get my 10% off", claimUrl)}
`;
}
