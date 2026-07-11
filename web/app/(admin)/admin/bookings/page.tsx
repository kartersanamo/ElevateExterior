import { BookingsManager } from "@/components/admin/BookingsManager";
import type { BookingDetailData } from "@/components/admin/BookingDetailContent";
import {
  buildBookingOrderBy,
  buildBookingWhere,
  parseBookingListParams,
  type BookingListParams,
} from "@/lib/bookings-admin";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

import type { Booking, JobPhoto, RecurringService } from "@prisma/client";

type BookingWithDetails = Booking & {
  photos: JobPhoto[];
  recurringService: RecurringService | null;
};

function serializeBookingDetail(booking: BookingWithDetails): BookingDetailData {
  return {
    id: booking.id,
    status: booking.status,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    address: booking.address,
    services: booking.services,
    notes: booking.notes,
    scheduledDate: booking.scheduledDate.toISOString(),
    startTime: booking.startTime,
    endTime: booking.endTime,
    publicUrl: booking.publicToken
      ? `${getSiteUrl()}/appointments/${booking.publicToken}`
      : null,
    amountChargedCents: booking.amountChargedCents,
    paidAt: booking.paidAt?.toISOString() ?? null,
    completedAt: booking.completedAt?.toISOString() ?? null,
    invoiceNumber: booking.invoiceNumber,
    invoiceHtml: booking.invoiceHtml,
    createdAt: booking.createdAt.toISOString(),
    photos: booking.photos.map((p) => ({ id: p.id })),
    recurringService: booking.recurringService
      ? {
          frequency: booking.recurringService.frequency,
          nextServiceDate:
            booking.recurringService.nextServiceDate?.toISOString() ?? null,
        }
      : null,
    reviewDiscountCode: booking.reviewDiscountCode,
    reviewDiscountClaimedAt: booking.reviewDiscountClaimedAt?.toISOString() ?? null,
    reviewDiscountRedeemedAt: booking.reviewDiscountRedeemedAt?.toISOString() ?? null,
  };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<BookingListParams>;
}) {
  const raw = await searchParams;
  const listParams = parseBookingListParams(raw);
  const where = buildBookingWhere(listParams.status, listParams.q);
  const orderBy = buildBookingOrderBy(listParams.sort, listParams.order);
  const skip = (listParams.page - 1) * listParams.pageSize;

  const [bookings, totalCount, selectedBooking, scheduleData] = await Promise.all([
    listParams.tab === "list"
      ? db.booking.findMany({
          where,
          orderBy,
          skip,
          take: listParams.pageSize,
          select: {
            id: true,
            status: true,
            customerName: true,
            customerEmail: true,
            scheduledDate: true,
            startTime: true,
            endTime: true,
            services: true,
            address: true,
          },
        })
      : Promise.resolve([]),
    listParams.tab === "list"
      ? db.booking.count({ where })
      : Promise.resolve(0),
    listParams.selectedId
      ? db.booking.findUnique({
          where: { id: listParams.selectedId },
          include: {
            photos: { orderBy: { sortOrder: "asc" } },
            recurringService: true,
          },
        })
      : Promise.resolve(null),
    listParams.tab === "schedule"
      ? Promise.all([
          db.availabilityRule.findMany({ orderBy: { dayOfWeek: "asc" } }),
          db.blockedDate.findMany({ orderBy: { date: "asc" } }),
          db.siteSettings.findUnique({ where: { id: "default" } }),
        ])
      : Promise.resolve(null),
  ]);

  const schedule =
    scheduleData != null
      ? {
          rules: scheduleData[0].map((r) => ({
            ...r,
            dayName: DAY_NAMES[r.dayOfWeek] ?? `Day ${r.dayOfWeek}`,
          })),
          blocked: scheduleData[1].map((b) => ({
            id: b.id,
            date: b.date.toISOString().slice(0, 10),
            reason: b.reason,
          })),
          slotDurationMinutes: scheduleData[2]?.slotDurationMinutes ?? 180,
        }
      : undefined;

  return (
    <BookingsManager
      listParams={listParams}
      bookings={bookings.map((b) => ({
        ...b,
        scheduledDate: b.scheduledDate.toISOString(),
      }))}
      totalCount={totalCount}
      selectedBooking={
        selectedBooking ? serializeBookingDetail(selectedBooking) : null
      }
      schedule={schedule}
    />
  );
}
