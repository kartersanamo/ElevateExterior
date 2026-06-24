import { db } from "@/lib/db";
import { site } from "@/lib/site-config";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function getSlotDurationMinutes(): Promise<number> {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.slotDurationMinutes ?? site.slotDurationMinutes;
}

export async function getAvailableDates(
  fromDate: string,
  toDate: string
): Promise<string[]> {
  const start = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + site.bookingLeadDays);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + site.bookingHorizonDays);

  const rules = await db.availabilityRule.findMany({ where: { enabled: true } });
  const blocked = await db.blockedDate.findMany();
  const blockedSet = new Set(blocked.map((b) => toDateOnly(b.date)));

  const available: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateStr = toDateOnly(cursor);
    const local = new Date(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate()
    );

    if (local < minDate || local > maxDate) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      continue;
    }

    if (blockedSet.has(dateStr)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      continue;
    }

    const dayOfWeek = local.getDay();
    const rule = rules.find((r) => r.dayOfWeek === dayOfWeek);

    if (rule) {
      const slots = await getSlotsForDate(dateStr);
      if (slots.length > 0) {
        available.push(dateStr);
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return available;
}

export async function getSlotsForDate(dateStr: string): Promise<TimeSlot[]> {
  const date = parseDateOnly(dateStr);
  const local = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  const dayOfWeek = local.getDay();

  const rule = await db.availabilityRule.findFirst({
    where: { dayOfWeek, enabled: true },
  });

  if (!rule) return [];

  const blocked = await db.blockedDate.findUnique({
    where: { date: parseDateOnly(dateStr) },
  });
  if (blocked) return [];

  const duration = await getSlotDurationMinutes();
  const windowStart = parseTimeToMinutes(rule.startTime);
  const windowEnd = parseTimeToMinutes(rule.endTime);

  const dayStart = parseDateOnly(dateStr);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const bookings = await db.booking.findMany({
    where: {
      scheduledDate: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const bookedRanges = bookings.map((b) => ({
    start: parseTimeToMinutes(b.startTime),
    end: parseTimeToMinutes(b.endTime),
  }));

  const slots: TimeSlot[] = [];

  for (
    let start = windowStart;
    start + duration <= windowEnd;
    start += duration
  ) {
    const end = start + duration;
    const overlaps = bookedRanges.some(
      (b) => start < b.end && end > b.start
    );
    if (!overlaps) {
      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      });
    }
  }

  return slots;
}

export function bookingToEmailPayload(booking: {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  services: string;
  notes: string | null;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: import("@prisma/client").BookingStatus;
}) {
  return {
    id: booking.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    address: booking.address,
    services: JSON.parse(booking.services) as string[],
    notes: booking.notes,
    scheduledDate: booking.scheduledDate.toISOString().slice(0, 10),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
  };
}
