import { formatCents } from "@/lib/recurring";
import {
  calculateDiscountCents,
  calculateSubtotalCents,
  parseBillDiscountJson,
  parseBillLineItemsJson,
  type BillLineItem,
} from "@/lib/invoice-bill";
import { services, site } from "@/lib/site-config";
import { emailColors, escapeHtml } from "@/lib/email/design";
import type { Booking } from "@prisma/client";

const fontDisplay = "'Outfit', Arial, Helvetica, sans-serif";
const fontBody = "'DM Sans', Arial, Helvetica, sans-serif";

function serviceLabels(servicesJson: string): string {
  try {
    const ids = JSON.parse(servicesJson) as string[];
    return ids
      .map((id) => services.find((s) => s.id === id)?.title ?? id)
      .join(", ");
  } catch {
    return servicesJson;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

function resolveInvoiceLineItems(booking: Booking): BillLineItem[] {
  if (booking.invoiceLineItems) {
    try {
      const parsed = parseBillLineItemsJson(JSON.parse(booking.invoiceLineItems));
      if (parsed.length > 0) return parsed;
    } catch {
      // Fall back to legacy single-line invoice.
    }
  }

  return [
    {
      description: serviceLabels(booking.services),
      amountCents: booking.amountChargedCents ?? 0,
    },
  ];
}

function resolveInvoiceDiscount(booking: Booking) {
  if (!booking.invoiceDiscount) return null;
  try {
    return parseBillDiscountJson(JSON.parse(booking.invoiceDiscount));
  } catch {
    return null;
  }
}

function buildLineItemRows(lineItems: BillLineItem[]): string {
  return lineItems
    .map(
      (item) => `<tr>
            <td style="padding:12px 0;border-top:1px solid ${emailColors.border};font-family:${fontBody};font-size:15px;color:${emailColors.slate};">${escapeHtml(item.description)}</td>
            <td align="right" style="padding:12px 0;border-top:1px solid ${emailColors.border};font-family:${fontBody};font-size:15px;color:${emailColors.slate};">${formatCents(item.amountCents)}</td>
          </tr>`
    )
    .join("");
}

export function generateInvoiceNumber(bookingId: string): string {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  return `INV-${stamp}-${bookingId.slice(-6).toUpperCase()}`;
}

export function buildInvoiceSection(
  booking: Booking,
  invoiceNumber: string,
  paidAt: Date
): string {
  const lineItems = resolveInvoiceLineItems(booking);
  const discount = resolveInvoiceDiscount(booking);
  const subtotalCents = calculateSubtotalCents(lineItems);
  const discountCents = calculateDiscountCents(subtotalCents, discount);
  const totalCents = booking.amountChargedCents ?? Math.max(0, subtotalCents - discountCents);
  const paidDate = paidAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr>
      <td style="background-color:${emailColors.cream};border:1px solid ${emailColors.border};border-radius:12px;padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:16px;">
              <p style="margin:0;font-family:${fontDisplay};font-size:12px;font-weight:700;color:${emailColors.teal};text-transform:uppercase;letter-spacing:0.12em;">Invoice</p>
              <p style="margin:4px 0 0;font-family:${fontDisplay};font-size:22px;font-weight:700;color:${emailColors.forest};">${escapeHtml(invoiceNumber)}</p>
              <p style="margin:8px 0 0;font-family:${fontBody};font-size:14px;font-weight:600;color:${emailColors.teal};">Paid ${paidDate}</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
          <tr>
            <td style="padding:8px 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${emailColors.slateMuted};width:100px;vertical-align:top;">Bill to</td>
            <td style="padding:8px 0;font-family:${fontBody};font-size:15px;color:${emailColors.slate};vertical-align:top;">
              ${escapeHtml(booking.customerName)}<br />
              ${escapeHtml(booking.customerEmail)}<br />
              ${escapeHtml(booking.address)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${emailColors.slateMuted};vertical-align:top;">Service date</td>
            <td style="padding:8px 0;font-family:${fontBody};font-size:15px;color:${emailColors.slate};vertical-align:top;">${formatDate(booking.scheduledDate)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${emailColors.slateMuted};vertical-align:top;">Time</td>
            <td style="padding:8px 0;font-family:${fontBody};font-size:15px;color:${emailColors.slate};vertical-align:top;">${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}</td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;border-top:1px solid ${emailColors.border};">
          <tr>
            <td style="padding:14px 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${emailColors.slateMuted};text-transform:uppercase;letter-spacing:0.06em;">Description</td>
            <td align="right" style="padding:14px 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${emailColors.slateMuted};text-transform:uppercase;letter-spacing:0.06em;">Amount</td>
          </tr>
          ${buildLineItemRows(lineItems)}
          ${
            discountCents > 0
              ? `<tr>
            <td style="padding:12px 0;border-top:1px solid ${emailColors.border};font-family:${fontBody};font-size:15px;color:${emailColors.teal};">Discount</td>
            <td align="right" style="padding:12px 0;border-top:1px solid ${emailColors.border};font-family:${fontBody};font-size:15px;color:${emailColors.teal};">-${formatCents(discountCents)}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:16px 0 0;border-top:2px solid ${emailColors.forest};font-family:${fontDisplay};font-size:18px;font-weight:700;color:${emailColors.forest};">Total</td>
            <td align="right" style="padding:16px 0 0;border-top:2px solid ${emailColors.forest};font-family:${fontDisplay};font-size:18px;font-weight:700;color:${emailColors.forest};">${formatCents(totalCents)}</td>
          </tr>
        </table>

        <p style="margin:20px 0 0;font-family:${fontBody};font-size:13px;line-height:1.6;color:${emailColors.slateMuted};">
          Thank you for choosing ${site.name}. Questions? ${site.phone} · ${site.email}
        </p>
      </td>
    </tr>
  </table>`;
}

/** @deprecated Use buildInvoiceSection for email embedding. */
export function buildInvoiceHtml(
  booking: Booking,
  invoiceNumber: string,
  paidAt: Date
): string {
  return buildInvoiceSection(booking, invoiceNumber, paidAt);
}
