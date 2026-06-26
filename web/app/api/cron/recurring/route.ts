import { db } from "@/lib/db";
import {
  addMonths,
  frequencyToMonths,
} from "@/lib/recurring";
import { bookingToEmailPayload } from "@/lib/scheduling/slots";
import { sendBookingConfirmedEmail } from "@/lib/booking-mail";
import {
  getContactRecipients,
  getMailFromAddress,
  getMailgunClient,
} from "@/lib/mailgun";
import { getSlotsForDate } from "@/lib/scheduling/slots";
import { sendSms } from "@/lib/sms";
import { generatePublicToken } from "@/lib/tokens";
import { appointmentUrl } from "@/lib/urls";
import { getSiteUrl } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 7);

  const dueSoon = await db.recurringService.findMany({
    where: {
      active: true,
      nextServiceDate: { lte: horizon },
    },
    include: { sourceBooking: true },
    orderBy: { nextServiceDate: "asc" },
  });

  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;
  const admins = getContactRecipients();

  let created = 0;
  let skipped = 0;
  const manualSchedule: string[] = [];

  for (const recurring of dueSoon) {
    const serviceDate = recurring.nextServiceDate ?? today;
    const dateStr = serviceDate.toISOString().slice(0, 10);

    const existingBooking = await db.booking.findFirst({
      where: {
        customerEmail: recurring.customerEmail,
        scheduledDate: serviceDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existingBooking) {
      skipped++;
      continue;
    }

    const startTime = recurring.preferredStartTime ?? "09:00";
    const endTime =
      recurring.preferredEndTime ??
      recurring.preferredStartTime ??
      "12:00";

    const slots = await getSlotsForDate(dateStr);
    const slotOk = slots.some(
      (s) => s.startTime === startTime && s.endTime === endTime
    );

    if (!slotOk) {
      const fallback = slots[0];
      if (!fallback) {
        manualSchedule.push(
          `${recurring.customerName} (${recurring.customerEmail}) — no slots on ${dateStr}`
        );
        skipped++;
        continue;
      }
    }

    const useStart = slotOk ? startTime : slots[0]!.startTime;
    const useEnd = slotOk ? endTime : slots[0]!.endTime;
    const publicToken = generatePublicToken();

    const booking = await db.booking.create({
      data: {
        customerName: recurring.customerName,
        customerEmail: recurring.customerEmail,
        customerPhone: recurring.customerPhone ?? "",
        address: recurring.address,
        services: recurring.services,
        notes: recurring.notes
          ? `Recurring service. ${recurring.notes}`
          : "Recurring service.",
        scheduledDate: serviceDate,
        startTime: useStart,
        endTime: useEnd,
        status: "CONFIRMED",
        publicToken,
      },
    });

    const months = frequencyToMonths(recurring.frequency);
    await db.recurringService.update({
      where: { id: recurring.id },
      data: {
        lastServiceDate: serviceDate,
        nextServiceDate: addMonths(serviceDate, months),
      },
    });

    try {
      await sendBookingConfirmedEmail(bookingToEmailPayload(booking));
      await sendSms({
        to: booking.customerPhone,
        body: `Your recurring Elevate Exterior service is booked for ${dateStr}. View: ${appointmentUrl(publicToken)}`,
      });
    } catch (error) {
      console.error("Recurring booking notification error:", error);
    }

    created++;
  }

  if (mailgun && from && domain && admins.length > 0) {
    const lines: string[] = [];
    if (created > 0) {
      lines.push(`${created} recurring booking(s) were auto-created.`);
    }
    if (manualSchedule.length > 0) {
      lines.push("Manual scheduling needed:");
      lines.push(...manualSchedule.map((l) => `• ${l}`));
    }
    if (dueSoon.length > 0 && lines.length > 0) {
      await mailgun.messages.create(domain, {
        from,
        to: admins,
        subject: `Recurring services — ${created} booked, ${skipped} skipped`,
        text: `${lines.join("\n")}\n\nManage: ${getSiteUrl()}/admin/recurring`,
        html: `<p>${lines.join("</p><p>")}</p><p><a href="${getSiteUrl()}/admin/recurring">Manage recurring</a></p>`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    dueSoon: dueSoon.length,
    created,
    skipped,
    manualSchedule: manualSchedule.length,
  });
}
