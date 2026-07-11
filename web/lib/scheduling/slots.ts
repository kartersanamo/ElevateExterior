import { db } from "@/lib/db";
import { site } from "@/lib/site-config";
import {
  getMonthBounds,
  minutesToTime,
  parseDateOnly,
  parseTimeToMinutes,
  rangesOverlap,
  toDateOnly,
} from "@/lib/scheduling/dates";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export type DayAvailabilityStatus =
  | "unavailable"
  | "blocked"
  | "full"
  | "limited"
  | "open";

export interface DaySummary {
  date: string;
  status: DayAvailabilityStatus;
  slotCount: number;
  bookingCount: number;
}

export async function getSlotDurationMinutes(): Promise<number> {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.slotDurationMinutes ?? site.slotDurationMinutes;
}

async function getBlockedRangesForDate(
  dateStr: string,
  options?: { excludeBookingId?: string; excludeQuoteId?: string }
) {
  const dayStart = parseDateOnly(dateStr);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const now = new Date();

  const [bookings, blockedSlots, quoteHolds] = await Promise.all([
    db.booking.findMany({
      where: {
        scheduledDate: { gte: dayStart, lt: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
        ...(options?.excludeBookingId
          ? { id: { not: options.excludeBookingId } }
          : {}),
      },
    }),
    db.blockedTimeSlot.findMany({
      where: { date: dayStart },
    }),
    db.quoteRequest.findMany({
      where: {
        status: { in: ["PENDING", "QUOTED"] },
        proposedDate: { gte: dayStart, lt: dayEnd },
        proposedStartTime: { not: null },
        proposedEndTime: { not: null },
        OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }],
        ...(options?.excludeQuoteId
          ? { id: { not: options.excludeQuoteId } }
          : {}),
      },
    }),
  ]);

  return [
    ...bookings.map((b) => ({
      start: parseTimeToMinutes(b.startTime),
      end: parseTimeToMinutes(b.endTime),
      kind: "booking" as const,
    })),
    ...blockedSlots.map((b) => ({
      start: parseTimeToMinutes(b.startTime),
      end: parseTimeToMinutes(b.endTime),
      kind: "block" as const,
    })),
    ...quoteHolds
      .filter((q) => q.proposedStartTime && q.proposedEndTime)
      .map((q) => ({
        start: parseTimeToMinutes(q.proposedStartTime!),
        end: parseTimeToMinutes(q.proposedEndTime!),
        kind: "quote_hold" as const,
      })),
  ];
}

export async function describeTimeSlotConflict(
  dateStr: string,
  startTime: string,
  endTime: string,
  options?: { excludeBookingId?: string; excludeQuoteId?: string }
): Promise<string | null> {
  const normalizedStart = startTime.slice(0, 5);
  const normalizedEnd = endTime.slice(0, 5);
  const slots = await getSlotsForDate(dateStr, options);
  if (
    slots.some(
      (s) => s.startTime === normalizedStart && s.endTime === normalizedEnd
    )
  ) {
    return null;
  }

  const start = parseTimeToMinutes(normalizedStart);
  const end = parseTimeToMinutes(normalizedEnd);
  if (end <= start) {
    return "End time must be after start time.";
  }

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
  if (!rule) {
    return "You are not available on this day of the week.";
  }

  const blockedDate = await db.blockedDate.findUnique({
    where: { date: parseDateOnly(dateStr) },
  });
  if (blockedDate) {
    return "This date is blocked on your calendar.";
  }

  const windowStart = parseTimeToMinutes(rule.startTime);
  const windowEnd = parseTimeToMinutes(rule.endTime);
  if (start < windowStart || end > windowEnd) {
    return "This time is outside your regular availability hours.";
  }

  const occupied = await getBlockedRangesForDate(dateStr, options);
  const overlap = occupied.find((r) =>
    rangesOverlap(start, end, r.start, r.end)
  );
  if (overlap) {
    if (overlap.kind === "block") {
      return "This time overlaps with a blocked slot on your availability.";
    }
    if (overlap.kind === "booking") {
      return "This time overlaps with an existing booking.";
    }
    return "This time overlaps with another quote hold.";
  }

  return "This time does not match an available slot.";
}

export async function getSlotsForDate(
  dateStr: string,
  options?: { excludeBookingId?: string; excludeQuoteId?: string }
): Promise<TimeSlot[]> {
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
  const occupied = await getBlockedRangesForDate(dateStr, options);

  const slots: TimeSlot[] = [];

  for (
    let start = windowStart;
    start + duration <= windowEnd;
    start += duration
  ) {
    const end = start + duration;
    const overlaps = occupied.some((r) =>
      rangesOverlap(start, end, r.start, r.end)
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

export async function getDaySummary(dateStr: string): Promise<DaySummary> {
  const date = parseDateOnly(dateStr);
  const local = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + site.bookingLeadDays);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + site.bookingHorizonDays);

  if (local < minDate || local > maxDate) {
    return { date: dateStr, status: "unavailable", slotCount: 0, bookingCount: 0 };
  }

  const blockedDate = await db.blockedDate.findUnique({
    where: { date: parseDateOnly(dateStr) },
  });
  if (blockedDate) {
    return { date: dateStr, status: "blocked", slotCount: 0, bookingCount: 0 };
  }

  const dayStart = parseDateOnly(dateStr);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const bookingCount = await db.booking.count({
    where: {
      scheduledDate: { gte: dayStart, lt: dayEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const slots = await getSlotsForDate(dateStr);
  const slotCount = slots.length;

  let status: DayAvailabilityStatus = "unavailable";
  if (slotCount > 2) status = "open";
  else if (slotCount > 0) status = "limited";
  else if (bookingCount > 0) status = "full";
  else status = "unavailable";

  return { date: dateStr, status, slotCount, bookingCount };
}

export async function getAvailableDates(
  fromDate: string,
  toDate: string
): Promise<string[]> {
  const start = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);
  const available: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateStr = toDateOnly(cursor);
    const summary = await getDaySummary(dateStr);
    if (summary.slotCount > 0) {
      available.push(dateStr);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return available;
}

export async function getMonthSummaries(
  year: number,
  month: number
): Promise<DaySummary[]> {
  const { daysInMonth } = getMonthBounds(year, month);
  const summaries: DaySummary[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    summaries.push(await getDaySummary(dateStr));
  }

  return summaries;
}

export interface DayScheduleSlot {
  startTime: string;
  endTime: string;
  state: "available" | "booked" | "blocked" | "quote_hold" | "past";
  bookingId?: string;
  customerName?: string;
  blockId?: string;
  quoteId?: string;
  reason?: string | null;
}

export async function getDaySchedule(dateStr: string): Promise<DayScheduleSlot[]> {
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

  const blockedDate = await db.blockedDate.findUnique({
    where: { date: parseDateOnly(dateStr) },
  });
  if (blockedDate) return [];

  const duration = await getSlotDurationMinutes();
  const windowStart = parseTimeToMinutes(rule.startTime);
  const windowEnd = parseTimeToMinutes(rule.endTime);

  const dayStart = parseDateOnly(dateStr);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [bookings, blockedSlots, quoteHolds] = await Promise.all([
    db.booking.findMany({
      where: {
        scheduledDate: { gte: dayStart, lt: dayEnd },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      orderBy: { startTime: "asc" },
    }),
    db.blockedTimeSlot.findMany({
      where: { date: dayStart },
      orderBy: { startTime: "asc" },
    }),
    db.quoteRequest.findMany({
      where: {
        status: { in: ["PENDING", "QUOTED"] },
        proposedDate: { gte: dayStart, lt: dayEnd },
        proposedStartTime: { not: null },
        proposedEndTime: { not: null },
        OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const schedule: DayScheduleSlot[] = [];

  for (
    let start = windowStart;
    start + duration <= windowEnd;
    start += duration
  ) {
    const end = start + duration;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    const booking = bookings.find(
      (b) =>
        ["PENDING", "CONFIRMED"].includes(b.status) &&
        rangesOverlap(
          start,
          end,
          parseTimeToMinutes(b.startTime),
          parseTimeToMinutes(b.endTime)
        )
    );

    if (booking) {
      schedule.push({
        startTime,
        endTime,
        state: "booked",
        bookingId: booking.id,
        customerName: booking.customerName,
      });
      continue;
    }

    const block = blockedSlots.find((b) =>
      rangesOverlap(
        start,
        end,
        parseTimeToMinutes(b.startTime),
        parseTimeToMinutes(b.endTime)
      )
    );

    if (block) {
      schedule.push({
        startTime,
        endTime,
        state: "blocked",
        blockId: block.id,
        reason: block.reason,
      });
      continue;
    }

    const quoteHold = quoteHolds.find(
      (q) =>
        q.proposedStartTime &&
        q.proposedEndTime &&
        rangesOverlap(
          start,
          end,
          parseTimeToMinutes(q.proposedStartTime),
          parseTimeToMinutes(q.proposedEndTime)
        )
    );

    if (quoteHold) {
      schedule.push({
        startTime,
        endTime,
        state: "quote_hold",
        quoteId: quoteHold.id,
        customerName: quoteHold.customerName,
        reason: quoteHold.status === "PENDING" ? "Quote request hold" : "Quoted hold",
      });
      continue;
    }

    schedule.push({ startTime, endTime, state: "available" });
  }

  return schedule;
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
  publicToken?: string | null;
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
    publicToken: booking.publicToken,
  };
}
