import { formatCents } from "@/lib/recurring";
import { services, site } from "@/lib/site-config";
import type { Booking } from "@prisma/client";

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

export function generateInvoiceNumber(bookingId: string): string {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  return `INV-${stamp}-${bookingId.slice(-6).toUpperCase()}`;
}

export function buildInvoiceHtml(
  booking: Booking,
  invoiceNumber: string,
  paidAt: Date
): string {
  const services = serviceLabels(booking.services);
  const amount = formatCents(booking.amountChargedCents ?? 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #013c83; max-width: 640px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    .muted { color: #5a718a; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #d9e8f5; }
    .total { font-size: 1.25rem; font-weight: 700; }
    .paid { color: #0098e3; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${site.name}</h1>
  <p class="muted">Invoice ${invoiceNumber}</p>
  <p class="paid">Paid ${paidAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

  <p><strong>Bill to:</strong><br />
  ${booking.customerName}<br />
  ${booking.customerEmail}<br />
  ${booking.address}</p>

  <p><strong>Service date:</strong> ${formatDate(booking.scheduledDate)}<br />
  <strong>Time:</strong> ${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}</p>

  <table>
    <thead>
      <tr><th>Description</th><th>Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${services}</td>
        <td>${amount}</td>
      </tr>
      <tr>
        <td class="total">Total</td>
        <td class="total">${amount}</td>
      </tr>
    </tbody>
  </table>

  <p class="muted">Thank you for choosing ${site.name}. Questions? ${site.phone} · ${site.email}</p>
</body>
</html>`;
}
