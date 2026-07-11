"use server";

import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
} from "@/lib/booking-mail";
import {
  buttonGroup,
  detailCard,
  emailEyebrow,
  emailHeading,
  statusPanel,
  textDetailBlock,
  textDivider,
  textFooter,
  wrapBrandedContent,
} from "@/lib/email/design";
import { getAdminNotificationRecipients } from "@/lib/admin-notifications";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailgun";
import { bookingToEmailPayload, getSlotsForDate } from "@/lib/scheduling/slots";
import { sendSms } from "@/lib/sms";
import { getSiteUrl } from "@/lib/stripe";
import { appointmentUrl } from "@/lib/urls";
import { revalidatePath } from "next/cache";

async function notifyAdmins(
  event: "CUSTOMER_RESCHEDULED" | "CUSTOMER_CANCELLED",
  eyebrow: string,
  heading: string,
  statusTitle: string,
  statusBody: string,
  rows: Array<{ label: string; value: string }>,
  subject: string,
  textSummary: string
) {
  const admins = await getAdminNotificationRecipients(event);
  if (admins.length === 0) return;

  const adminUrl = `${getSiteUrl()}/admin/bookings`;

  const html = wrapBrandedContent(
    [
      emailEyebrow(eyebrow),
      emailHeading(heading),
      statusPanel("info", statusTitle, statusBody),
      detailCard("Appointment details", rows),
      buttonGroup([{ label: "View in admin", href: adminUrl }]),
    ].join(""),
    {
      previewText: textSummary,
      title: subject,
    }
  );

  const text = `${textSummary}

${textDivider()}
${textDetailBlock("Appointment details", rows)}
${textDivider()}

View in admin: ${adminUrl}${textFooter()}`;

  await sendMail({
    to: admins,
    subject,
    text,
    html,
    replyTo: null,
  });
}

export async function rescheduleAppointment(data: {
  token: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}) {
  const booking = await db.booking.findUnique({
    where: { publicToken: data.token },
  });

  if (!booking) throw new Error("Appointment not found.");
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    throw new Error("This appointment cannot be rescheduled.");
  }

  const slots = await getSlotsForDate(data.scheduledDate, {
    excludeBookingId: booking.id,
  });
  const slotValid = slots.some(
    (s) => s.startTime === data.startTime && s.endTime === data.endTime
  );
  if (!slotValid) {
    throw new Error("That time slot is no longer available. Please pick another.");
  }

  const [y, m, d] = data.scheduledDate.split("-").map(Number);
  const scheduledDate = new Date(Date.UTC(y, m - 1, d));

  const updated = await db.booking.update({
    where: { id: booking.id },
    data: {
      scheduledDate,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  const payload = bookingToEmailPayload(updated);

  try {
    await sendBookingConfirmedEmail(payload);
    await sendSms({
      to: updated.customerPhone,
      body: `Your Elevate Exterior appointment was rescheduled. View details: ${appointmentUrl(data.token)}`,
    });
    await notifyAdmins(
      "CUSTOMER_RESCHEDULED",
      "Appointment rescheduled",
      "Customer rescheduled",
      `${updated.customerName} rescheduled`,
      `New date: ${data.scheduledDate} at ${data.startTime}`,
      [
        { label: "Customer", value: updated.customerName },
        { label: "Email", value: updated.customerEmail },
        { label: "Phone", value: updated.customerPhone },
        { label: "New date", value: data.scheduledDate },
        { label: "New time", value: `${data.startTime} – ${data.endTime}` },
        { label: "Booking ID", value: updated.id },
      ],
      `Appointment rescheduled — ${updated.customerName}`,
      `${updated.customerName} rescheduled to ${data.scheduledDate} ${data.startTime}.`
    );
  } catch (error) {
    console.error("Reschedule notification error:", error);
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/appointments/${data.token}`);
  return { ok: true };
}

export async function cancelAppointment(token: string) {
  const booking = await db.booking.findUnique({
    where: { publicToken: token },
  });

  if (!booking) throw new Error("Appointment not found.");
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    throw new Error("This appointment cannot be cancelled.");
  }

  const updated = await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  const payload = bookingToEmailPayload(updated);

  try {
    await sendBookingCancelledEmail(payload);
    await sendSms({
      to: updated.customerPhone,
      body: `Your Elevate Exterior appointment on ${payload.scheduledDate} was cancelled. Rebook: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/book`,
    });
    await notifyAdmins(
      "CUSTOMER_CANCELLED",
      "Appointment cancelled",
      "Customer cancelled",
      `${updated.customerName} cancelled their appointment`,
      `Original date: ${payload.scheduledDate}`,
      [
        { label: "Customer", value: updated.customerName },
        { label: "Email", value: updated.customerEmail },
        { label: "Phone", value: updated.customerPhone },
        { label: "Date", value: payload.scheduledDate },
        { label: "Time", value: `${payload.startTime} – ${payload.endTime}` },
        { label: "Booking ID", value: updated.id },
      ],
      `Appointment cancelled — ${updated.customerName}`,
      `${updated.customerName} cancelled their appointment for ${payload.scheduledDate}.`
    );
  } catch (error) {
    console.error("Cancel notification error:", error);
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/appointments/${token}`);
  return { ok: true };
}
