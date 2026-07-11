import { getContactRecipients, sendMail } from "@/lib/mailgun";
import { site } from "@/lib/site-config";
import { sendSms } from "@/lib/sms";
import { appointmentUrl } from "@/lib/urls";
import type { BookingStatus } from "@prisma/client";

export interface BookingEmailPayload {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  services: string[];
  notes?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  publicToken?: string | null;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
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

function bookingDetailsText(payload: BookingEmailPayload): string {
  const services = payload.services.join(", ");
  return `Booking ID: ${payload.id}
Customer: ${payload.customerName}
Email: ${payload.customerEmail}
Phone: ${payload.customerPhone}
Address: ${payload.address}
Services: ${services}
Date: ${formatDate(payload.scheduledDate)}
Time: ${formatTime(payload.startTime)} – ${formatTime(payload.endTime)}
Status: ${payload.status}${payload.notes ? `\nNotes: ${payload.notes}` : ""}`;
}

export async function sendBookingSubmittedEmails(
  payload: BookingEmailPayload
): Promise<void> {
  const recipients = getContactRecipients();
  if (recipients.length === 0) {
    throw new Error("NO_CONTACT_RECIPIENTS");
  }

  const details = bookingDetailsText(payload);

  await sendMail({
    to: recipients,
    subject: `New booking request — ${payload.customerName}`,
    text: `New booking request (pending confirmation):\n\n${details}`,
    html: `<p>New booking request <strong>(pending confirmation)</strong>:</p><pre style="white-space:pre-wrap;font-family:sans-serif;">${details}</pre>`,
    replyTo: payload.customerEmail,
  });

  await sendMail({
    to: [payload.customerEmail],
    subject: `We received your booking request — ${site.shortName}`,
    text: `Hi ${payload.customerName},

Thanks for booking with ${site.name}! We received your request and will confirm within 24 hours.

${details}

If you need to make changes, call us at ${site.phone} or reply to this email.

— ${site.name}`,
    html: `
<p>Hi ${payload.customerName},</p>
<p>Thanks for booking with <strong>${site.name}</strong>! We received your request and will confirm within 24 hours.</p>
<pre style="white-space:pre-wrap;font-family:sans-serif;background:#f4f4f4;padding:12px;border-radius:8px;">${details}</pre>
<p>If you need to make changes, call us at <a href="${site.phoneHref}">${site.phone}</a>.</p>
<p>— ${site.name}</p>`,
  });
}

export async function sendBookingConfirmedEmail(
  payload: BookingEmailPayload
): Promise<void> {
  const details = bookingDetailsText(payload);
  const link = payload.publicToken ? appointmentUrl(payload.publicToken) : null;
  const linkText = link ? `\n\nManage your appointment: ${link}` : "";
  const linkHtml = link
    ? `<p><a href="${link}" style="display:inline-block;background:#0098e3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View your appointment</a></p>`
    : "";

  await sendMail({
    to: [payload.customerEmail],
    subject: `Booking confirmed — ${formatDate(payload.scheduledDate)}`,
    text: `Hi ${payload.customerName},

Your cleaning is confirmed!

${details}${linkText}

See you then! Questions? Call ${site.phone}.

— ${site.name}`,
    html: `
<p>Hi ${payload.customerName},</p>
<p><strong>Your cleaning is confirmed!</strong></p>
<pre style="white-space:pre-wrap;font-family:sans-serif;background:#f4f4f4;padding:12px;border-radius:8px;">${details}</pre>
${linkHtml}
<p>See you then! Questions? Call <a href="${site.phoneHref}">${site.phone}</a>.</p>
<p>— ${site.name}</p>`,
  });

  if (link) {
    await sendSms({
      to: payload.customerPhone,
      body: `Your Elevate Exterior cleaning is confirmed! ${link}`,
    });
  }
}

export async function sendBookingCancelledEmail(
  payload: BookingEmailPayload
): Promise<void> {
  await sendMail({
    to: [payload.customerEmail],
    subject: `Booking cancelled — ${site.shortName}`,
    text: `Hi ${payload.customerName},

Your booking for ${formatDate(payload.scheduledDate)} at ${formatTime(payload.startTime)} has been cancelled.

To reschedule, visit our website or call ${site.phone}.

— ${site.name}`,
    html: `
<p>Hi ${payload.customerName},</p>
<p>Your booking for <strong>${formatDate(payload.scheduledDate)}</strong> at <strong>${formatTime(payload.startTime)}</strong> has been cancelled.</p>
<p>To reschedule, <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/book">book online</a> or call <a href="${site.phoneHref}">${site.phone}</a>.</p>
<p>— ${site.name}</p>`,
  });
}
