import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { BookingActions } from "@/components/admin/BookingActions";
import { db } from "@/lib/db";
import { services } from "@/lib/site-config";
import type { BookingStatus } from "@prisma/client";

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

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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

function serviceLabels(ids: string[]): string {
  return ids
    .map((id) => services.find((s) => s.id === id)?.title ?? id)
    .join(", ");
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-teal/10 text-teal",
  CANCELLED: "bg-slate/10 text-slate/60",
  COMPLETED: "bg-forest/10 text-forest",
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;

  const where =
    statusFilter && statusFilter !== "ALL"
      ? { status: statusFilter as BookingStatus }
      : {};

  const [bookings, rules, blocked, settings] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: [{ scheduledDate: "desc" }, { startTime: "desc" }],
      take: 100,
    }),
    db.availabilityRule.findMany({ orderBy: { dayOfWeek: "asc" } }),
    db.blockedDate.findMany({ orderBy: { date: "asc" } }),
    db.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  const rulesWithNames = rules.map((r) => ({
    ...r,
    dayName: DAY_NAMES[r.dayOfWeek] ?? `Day ${r.dayOfWeek}`,
  }));

  const blockedFormatted = blocked.map((b) => ({
    id: b.id,
    date: b.date.toISOString().slice(0, 10),
    reason: b.reason,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Bookings</h1>
      <p className="mt-2 text-slate/70">
        Calendar, scheduling settings, and booking details in one place.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
          (s) => (
            <a
              key={s}
              href={s === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                (statusFilter ?? "ALL") === s
                  ? "bg-teal text-white"
                  : "bg-white text-slate/70 border border-slate/10"
              }`}
            >
              {s}
            </a>
          )
        )}
      </div>

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <p className="text-slate/60">No bookings found.</p>
        ) : (
          bookings.map((b) => {
            const serviceIds = JSON.parse(b.services) as string[];
            return (
              <article
                key={b.id}
                className="rounded-2xl border border-slate/10 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[b.status]}`}
                    >
                      {b.status}
                    </span>
                    <h2 className="mt-2 font-display text-xl font-bold text-forest">
                      {b.customerName}
                    </h2>
                    <p className="text-sm text-slate/70">
                      {formatDate(b.scheduledDate)} ·{" "}
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </p>
                  </div>
                  <BookingActions bookingId={b.id} status={b.status} />
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate/50">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${b.customerEmail}`}
                        className="text-teal hover:underline"
                      >
                        {b.customerEmail}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate/50">Phone</dt>
                    <dd>
                      <a
                        href={`tel:${b.customerPhone.replace(/\D/g, "")}`}
                        className="text-teal hover:underline"
                      >
                        {b.customerPhone}
                      </a>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate/50">Address</dt>
                    <dd>{b.address}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate/50">Services</dt>
                    <dd>{serviceLabels(serviceIds)}</dd>
                  </div>
                  {b.notes ? (
                    <div className="sm:col-span-2">
                      <dt className="text-slate/50">Notes</dt>
                      <dd className="whitespace-pre-wrap">{b.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-10">
        <AdminCalendar />
      </div>

      <AvailabilityManager
        rules={rulesWithNames}
        blocked={blockedFormatted}
        slotDurationMinutes={settings?.slotDurationMinutes ?? 180}
      />
    </div>
  );
}
