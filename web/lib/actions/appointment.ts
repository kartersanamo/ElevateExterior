"use server";

import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
} from "@/lib/booking-mail";
import { db } from "@/lib/db";
import { getContactRecipients, sendMail } from "@/lib/mailgun";
import { bookingToEmailPayload, getSlotsForDate } from "@/lib/scheduling/slots";
import { sendSms } from "@/lib/sms";
import { appointmentUrl } from "@/lib/urls";
import { revalidatePath } from "next/cache";

async function notifyAdmins(subject: string, text: string, html: string) {
  const admins = getContactRecipients();
  if (admins.length === 0) return;

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
      `Appointment rescheduled — ${updated.customerName}`,
      `${updated.customerName} rescheduled to ${data.scheduledDate} ${data.startTime}.`,
      `<p><strong>${updated.customerName}</strong> rescheduled to ${data.scheduledDate} at ${data.startTime}.</p>`
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
      `Appointment cancelled — ${updated.customerName}`,
      `${updated.customerName} cancelled their appointment for ${payload.scheduledDate}.`,
      `<p><strong>${updated.customerName}</strong> cancelled their appointment for ${payload.scheduledDate}.</p>`
    );
  } catch (error) {
    console.error("Cancel notification error:", error);
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/appointments/${token}`);
  return { ok: true };
}
