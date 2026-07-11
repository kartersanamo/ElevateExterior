import {
  buttonGroup,
  detailCard,
  emailEyebrow,
  emailGreeting,
  emailHeading,
  emailParagraph,
  emailSignature,
  emailReviewHint,
  linkFallback,
  messageBlock,
  statusPanel,
  textButton,
  textDetailBlock,
  textDivider,
  textFooter,
  textReviewHint,
  textSignature,
  wrapBrandedContent,
} from "@/lib/email/design";
import { getAdminNotificationRecipients } from "@/lib/admin-notifications";
import { sendMail } from "@/lib/mailgun";
import { reviewPageUrl } from "@/lib/review-reward";
import { site } from "@/lib/site-config";
import { sendSms } from "@/lib/sms";
import { getSiteUrl } from "@/lib/stripe";
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

function bookingDetailRows(payload: BookingEmailPayload) {
  return [
    { label: "Date", value: formatDate(payload.scheduledDate) },
    {
      label: "Time",
      value: `${formatTime(payload.startTime)} – ${formatTime(payload.endTime)}`,
    },
    { label: "Services", value: payload.services.join(", ") },
    { label: "Address", value: payload.address },
    { label: "Phone", value: payload.customerPhone },
    { label: "Booking ID", value: payload.id },
  ];
}

function adminBookingDetailRows(payload: BookingEmailPayload) {
  return [
    { label: "Customer", value: payload.customerName },
    { label: "Email", value: payload.customerEmail },
    { label: "Phone", value: payload.customerPhone },
    { label: "Address", value: payload.address },
    { label: "Services", value: payload.services.join(", ") },
    { label: "Date", value: formatDate(payload.scheduledDate) },
    {
      label: "Time",
      value: `${formatTime(payload.startTime)} – ${formatTime(payload.endTime)}`,
    },
    { label: "Status", value: payload.status },
    { label: "Booking ID", value: payload.id },
  ];
}

function bookingDetailsText(payload: BookingEmailPayload): string {
  return textDetailBlock("Appointment details", bookingDetailRows(payload));
}

export async function sendBookingSubmittedEmails(
  payload: BookingEmailPayload
): Promise<void> {
  const recipients = await getAdminNotificationRecipients("BOOKING_REQUEST_SUBMITTED");
  if (recipients.length === 0) {
    throw new Error("NO_CONTACT_RECIPIENTS");
  }

  const adminUrl = `${getSiteUrl()}/admin/bookings`;
  const adminRows = adminBookingDetailRows(payload);

  const adminHtml = wrapBrandedContent(
    [
      emailEyebrow("New booking request"),
      emailHeading("Booking request received"),
      statusPanel("info", "Pending confirmation", "Review and confirm this booking in admin."),
      detailCard("Request details", adminRows),
      payload.notes ? messageBlock(payload.notes) : "",
      buttonGroup([{ label: "Review in admin", href: adminUrl }]),
      linkFallback("Or open this link:", adminUrl),
    ].join(""),
    {
      previewText: `New booking request from ${payload.customerName}`,
      title: `New booking request — ${payload.customerName}`,
    }
  );

  const adminText = `New booking request (pending confirmation):

${textDivider()}
${textDetailBlock("Request details", adminRows)}
${payload.notes ? `\nNotes:\n${payload.notes}` : ""}
${textDivider()}

${textButton("Review in admin", adminUrl)}${textFooter()}`;

  await sendMail({
    to: recipients,
    subject: `New booking request — ${payload.customerName}`,
    text: adminText,
    html: adminHtml,
    replyTo: payload.customerEmail,
  });

  const customerHtml = wrapBrandedContent(
    [
      emailEyebrow("Booking request"),
      emailHeading("We received your request"),
      emailGreeting(payload.customerName),
      statusPanel(
        "info",
        "Pending confirmation",
        "We received your booking request and will confirm within 24 hours."
      ),
      detailCard("Your request", bookingDetailRows(payload)),
      emailParagraph(
        `Need to make changes? Call us at <a href="${site.phoneHref}" style="color:#0098e3;font-weight:600;text-decoration:none;">${site.phone}</a> or reply to this email.`
      ),
      emailSignature(),
    ].join(""),
    {
      previewText: `We received your booking request with ${site.shortName}`,
      title: `Booking request received — ${site.shortName}`,
    }
  );

  const customerText = `Hi ${payload.customerName},

Thanks for booking with ${site.name}! We received your request and will confirm within 24 hours.

${textDivider()}
${bookingDetailsText(payload)}
${textDivider()}

If you need to make changes, call us at ${site.phone} or reply to this email.${textSignature()}${textFooter()}`;

  await sendMail({
    to: [payload.customerEmail],
    subject: `We received your booking request — ${site.shortName}`,
    text: customerText,
    html: customerHtml,
  });
}

export async function sendBookingConfirmedEmail(
  payload: BookingEmailPayload
): Promise<void> {
  const link = payload.publicToken ? appointmentUrl(payload.publicToken) : null;

  const html = wrapBrandedContent(
    [
      emailEyebrow("Appointment confirmed"),
      emailHeading("Your cleaning is confirmed"),
      emailGreeting(payload.customerName),
      statusPanel(
        "success",
        formatDate(payload.scheduledDate),
        `${formatTime(payload.startTime)} – ${formatTime(payload.endTime)}`
      ),
      detailCard("Appointment details", bookingDetailRows(payload)),
      link
        ? buttonGroup([{ label: "View appointment", href: link }])
        : "",
      link ? linkFallback("Or copy this link:", link) : "",
      emailParagraph(
        `See you then! Questions? Call <a href="${site.phoneHref}" style="color:#0098e3;font-weight:600;text-decoration:none;">${site.phone}</a>.`
      ),
      emailReviewHint(reviewPageUrl()),
      emailSignature(),
    ].join(""),
    {
      previewText: `Your cleaning is confirmed for ${formatDate(payload.scheduledDate)}`,
      title: `Booking confirmed — ${formatDate(payload.scheduledDate)}`,
    }
  );

  const text = `Hi ${payload.customerName},

Your cleaning is confirmed!

${textDivider()}
${bookingDetailsText(payload)}
${textDivider()}
${link ? `\n${textButton("Manage your appointment", link)}` : ""}

See you then! Questions? Call ${site.phone}.${textReviewHint(reviewPageUrl())}${textSignature()}${textFooter()}`;

  await sendMail({
    to: [payload.customerEmail],
    subject: `Booking confirmed — ${formatDate(payload.scheduledDate)}`,
    text,
    html,
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
  const bookUrl = `${getSiteUrl()}/book`;

  const html = wrapBrandedContent(
    [
      emailEyebrow("Appointment cancelled"),
      emailHeading("Your booking was cancelled"),
      emailGreeting(payload.customerName),
      statusPanel(
        "warning",
        "Booking cancelled",
        `${formatDate(payload.scheduledDate)} at ${formatTime(payload.startTime)}`
      ),
      emailParagraph("We're sorry to see this appointment go. When you're ready, we'd love to help you reschedule."),
      buttonGroup([
        { label: "Book again", href: bookUrl },
        { label: "Call us", href: site.phoneHref, variant: "secondary" },
      ]),
      linkFallback("Or book online:", bookUrl),
      emailSignature(),
    ].join(""),
    {
      previewText: `Your booking for ${formatDate(payload.scheduledDate)} was cancelled`,
      title: `Booking cancelled — ${site.shortName}`,
    }
  );

  const text = `Hi ${payload.customerName},

Your booking for ${formatDate(payload.scheduledDate)} at ${formatTime(payload.startTime)} has been cancelled.

To reschedule, visit our website or call ${site.phone}.

${textButton("Book online", bookUrl)}${textSignature()}${textFooter()}`;

  await sendMail({
    to: [payload.customerEmail],
    subject: `Booking cancelled — ${site.shortName}`,
    text,
    html,
  });
}
