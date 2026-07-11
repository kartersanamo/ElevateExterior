import { ManualBookingForm } from "@/components/admin/ManualBookingForm";
import { db } from "@/lib/db";
import { services } from "@/lib/site-config";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isUpcomingJob(
  scheduledDate: Date,
  endTime: string,
  now: Date
): boolean {
  const jobDay = new Date(scheduledDate);
  jobDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (jobDay < today) return false;
  if (jobDay > today) return true;

  const [h, min] = endTime.split(":").map(Number);
  const jobEnd = new Date(now);
  jobEnd.setHours(h, min, 0, 0);
  return jobEnd > now;
}

function formatJobDate(date: Date, now: Date): string {
  if (isSameDay(date, now)) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return formatDate(date);
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, upcomingBookings, pendingQuotes, recentQuotes] =
    await Promise.all([
      db.booking.findMany({
        where: {
          status: "CONFIRMED",
          scheduledDate: { gte: today, lt: tomorrow },
        },
        orderBy: { startTime: "asc" },
      }),
      db.booking.findMany({
        where: {
          status: "CONFIRMED",
          scheduledDate: { gte: today },
        },
        orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
        take: 20,
      }),
      db.quoteRequest.count({ where: { status: "PENDING" } }),
      db.quoteRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const nextJobs = upcomingBookings
    .filter((b) => isUpcomingJob(b.scheduledDate, b.endTime, now))
    .slice(0, 5);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Dashboard</h1>

      <div className="mt-6">
        <ManualBookingForm />
      </div>

      <section className="mt-8 rounded-2xl border border-teal/20 bg-teal/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-forest">
            Next 5 jobs
          </h2>
          <Link
            href="/admin/bookings?status=CONFIRMED"
            className="text-sm font-semibold text-teal hover:underline"
          >
            All bookings →
          </Link>
        </div>
        {nextJobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate/60">
            No upcoming confirmed jobs scheduled.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-teal/10">
            {nextJobs.map((b) => {
              const serviceIds = JSON.parse(b.services) as string[];
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-forest">
                      {formatJobDate(b.scheduledDate, now)} ·{" "}
                      {formatTime(b.startTime)} – {formatTime(b.endTime)} ·{" "}
                      {b.customerName}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate/70">
                      {b.address}
                    </p>
                    <p className="mt-0.5 text-sm text-slate/60">
                      {serviceLabels(serviceIds)}
                    </p>
                  </div>
                  <a
                    href={`tel:${b.customerPhone}`}
                    className="shrink-0 text-sm font-semibold text-teal hover:underline"
                  >
                    {b.customerPhone}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-slate/60">Quote requests</p>
          <p className="mt-1 font-display text-4xl font-bold text-amber-600">
            {pendingQuotes}
          </p>
          <Link
            href="/admin/quotes"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Review quotes →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate/10 bg-white p-6">
          <p className="text-sm text-slate/60">Confirmed today</p>
          <p className="mt-1 font-display text-4xl font-bold text-forest">
            {todayBookings.length}
          </p>
          <Link
            href="/admin/bookings"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            All bookings →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate/10 bg-white p-6">
          <p className="text-sm text-slate/60">Book online</p>
          <p className="mt-1 text-sm text-slate/70">
            New customers request quotes via the Book Now flow.
          </p>
          <Link
            href="/book"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            View public form →
          </Link>
        </div>
      </div>

      <p className="mt-6">
        <Link
          href="/admin/bookings"
          className="text-sm font-semibold text-teal hover:underline"
        >
          View bookings calendar →
        </Link>
      </p>

      {todayBookings.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-forest">
            Today&apos;s jobs
          </h2>
          <ul className="mt-4 space-y-3">
            {todayBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-slate/10 bg-white p-4"
              >
                <p className="font-semibold text-forest">
                  {formatTime(b.startTime)} – {b.customerName}
                </p>
                <p className="text-sm text-slate/70">{b.address}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recentQuotes.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-forest">
            Pending quote requests
          </h2>
          <ul className="mt-4 space-y-3">
            {recentQuotes.map((q) => (
              <li
                key={q.id}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <p className="font-semibold text-forest">{q.customerName}</p>
                <p className="text-sm text-slate/70">
                  {q.address ?? "No address"} · {q.customerEmail}
                </p>
                {q.proposedDate && q.proposedStartTime ? (
                  <p className="mt-1 text-sm text-slate/60">
                    Preferred: {formatDate(q.proposedDate)} at{" "}
                    {formatTime(q.proposedStartTime)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <Link
            href="/admin/quotes"
            className="mt-4 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Manage all quotes →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
