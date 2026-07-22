import { formatReminderOffsetLabel } from "@/lib/booking-reminder-format";
import { db } from "@/lib/db";
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
import { sendMail } from "@/lib/mailgun";
import { formatDateLong, formatTime12, toDateOnly } from "@/lib/scheduling/dates";
import { services as serviceCatalog } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/stripe";
import type { AdminBookingReminderOffset, Booking } from "@prisma/client";

/** Lookback window so a 5-minute cron does not miss sends. */
export const REMINDER_MATCH_WINDOW_MS = 6 * 60 * 1000;

export { formatReminderOffsetLabel } from "@/lib/booking-reminder-format";
export {
  minutesFromAmount,
  normalizeDayOfAtTime,
} from "@/lib/booking-reminder-format";

/** Wall-clock appointment start using the server local timezone. */
export function bookingAppointmentStart(
  scheduledDate: Date,
  startTime: string
): Date {
  const dateStr = toDateOnly(scheduledDate);
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function reminderTargetTime(
  booking: Pick<Booking, "scheduledDate" | "startTime">,
  offset: Pick<
    AdminBookingReminderOffset,
    "dayOf" | "minutesBefore" | "dayOfAtTime"
  >
): Date {
  if (offset.dayOf) {
    const dateStr = toDateOnly(booking.scheduledDate);
    const [y, m, d] = dateStr.split("-").map(Number);
    const [h, min] = offset.dayOfAtTime.split(":").map(Number);
    return new Date(y, m - 1, d, h, min, 0, 0);
  }

  const start = bookingAppointmentStart(booking.scheduledDate, booking.startTime);
  return new Date(start.getTime() - (offset.minutesBefore ?? 0) * 60_000);
}

function isWithinSendWindow(target: Date, now: Date): boolean {
  const delta = now.getTime() - target.getTime();
  return delta >= 0 && delta < REMINDER_MATCH_WINDOW_MS;
}

function parseServices(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [raw];
    return parsed.map((id) => {
      if (typeof id !== "string") return String(id);
      return serviceCatalog.find((s) => s.id === id)?.title ?? id;
    });
  } catch {
    return [raw];
  }
}

async function sendReminderEmail(options: {
  to: string;
  booking: Booking;
  offsetLabel: string;
}) {
  const { to, booking, offsetLabel } = options;
  const dateStr = toDateOnly(booking.scheduledDate);
  const serviceLabels = parseServices(booking.services);
  const adminUrl = `${getSiteUrl()}/admin/bookings?id=${booking.id}`;

  const rows = [
    { label: "Customer", value: booking.customerName },
    { label: "Email", value: booking.customerEmail },
    { label: "Phone", value: booking.customerPhone },
    { label: "Address", value: booking.address },
    { label: "Services", value: serviceLabels.join(", ") },
    { label: "Date", value: formatDateLong(dateStr) },
    {
      label: "Time",
      value: `${formatTime12(booking.startTime)} – ${formatTime12(booking.endTime)}`,
    },
    { label: "Reminder", value: offsetLabel },
  ];

  const subject = `Booking reminder — ${booking.customerName} (${offsetLabel})`;
  const preview = `${offsetLabel}: ${booking.customerName} on ${formatDateLong(dateStr)}`;

  const html = wrapBrandedContent(
    [
      emailEyebrow("Booking reminder"),
      emailHeading("Upcoming appointment"),
      statusPanel("info", offsetLabel, `${booking.customerName} is coming up.`),
      detailCard("Appointment details", rows),
      buttonGroup([{ label: "View in admin", href: adminUrl }]),
    ].join(""),
    { previewText: preview, title: subject }
  );

  const text = `${preview}

${textDivider()}
${textDetailBlock("Appointment details", rows)}
${textDivider()}

View in admin: ${adminUrl}${textFooter()}`;

  await sendMail({
    to: [to],
    subject,
    text,
    html,
    replyTo: booking.customerEmail,
  });
}

/**
 * Finds due admin booking reminders and sends emails.
 * Safe to call repeatedly — uses send-log uniqueness for idempotency.
 */
export async function processBookingReminders(
  now: Date = new Date()
): Promise<{ sent: number; alreadySent: number }> {
  const enabledPrefs = await db.adminNotificationPreference.findMany({
    where: { event: "BOOKING_REMINDER", enabled: true },
    select: { adminUserId: true },
  });

  if (enabledPrefs.length === 0) {
    return { sent: 0, alreadySent: 0 };
  }

  const adminIds = enabledPrefs.map((p) => p.adminUserId);
  const offsets = await db.adminBookingReminderOffset.findMany({
    where: { adminUserId: { in: adminIds } },
    include: { adminUser: { select: { email: true } } },
  });

  if (offsets.length === 0) {
    return { sent: 0, alreadySent: 0 };
  }

  const horizonMs = Math.max(
    ...offsets.map((offset) =>
      offset.dayOf ? 24 * 60 * 60_000 : (offset.minutesBefore ?? 0) * 60_000
    ),
    0
  );

  const rangeStart = new Date(now.getTime() - REMINDER_MATCH_WINDOW_MS);
  const rangeEnd = new Date(now.getTime() + horizonMs + REMINDER_MATCH_WINDOW_MS);

  const dayStart = new Date(rangeStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(rangeEnd);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      scheduledDate: {
        gte: new Date(
          Date.UTC(
            dayStart.getFullYear(),
            dayStart.getMonth(),
            dayStart.getDate()
          )
        ),
        lte: new Date(
          Date.UTC(dayEnd.getFullYear(), dayEnd.getMonth(), dayEnd.getDate())
        ),
      },
    },
  });

  let sent = 0;
  let alreadySent = 0;

  for (const offset of offsets) {
    const offsetLabel = formatReminderOffsetLabel(offset);

    for (const booking of bookings) {
      const target = reminderTargetTime(booking, offset);
      if (!isWithinSendWindow(target, now)) {
        continue;
      }

      const existing = await db.adminBookingReminderSendLog.findUnique({
        where: {
          bookingId_offsetId: {
            bookingId: booking.id,
            offsetId: offset.id,
          },
        },
      });

      if (existing) {
        alreadySent += 1;
        continue;
      }

      try {
        await sendReminderEmail({
          to: offset.adminUser.email,
          booking,
          offsetLabel,
        });

        await db.adminBookingReminderSendLog.create({
          data: {
            bookingId: booking.id,
            offsetId: offset.id,
            adminUserId: offset.adminUserId,
          },
        });
        sent += 1;
      } catch (error) {
        console.error("Booking reminder send failed:", {
          bookingId: booking.id,
          offsetId: offset.id,
          error,
        });
      }
    }
  }

  return { sent, alreadySent };
}
