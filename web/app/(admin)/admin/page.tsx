import { db } from "@/lib/db";
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

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pendingCount, todayBookings, recentPending, pendingQuotes] = await Promise.all([
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.findMany({
      where: {
        status: "CONFIRMED",
        scheduledDate: { gte: today, lt: tomorrow },
      },
      orderBy: { startTime: "asc" },
    }),
    db.booking.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.quoteRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate/10 bg-white p-6">
          <p className="text-sm text-slate/60">Pending requests</p>
          <p className="mt-1 font-display text-4xl font-bold text-teal">
            {pendingCount}
          </p>
          <Link
            href="/admin/bookings?status=PENDING"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Review pending →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate/10 bg-white p-6">
          <p className="text-sm text-slate/60">Quote requests</p>
          <p className="mt-1 font-display text-4xl font-bold text-amber-600">
            {pendingQuotes}
          </p>
          <Link
            href="/admin/quotes"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Send quotes →
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

      {recentPending.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-forest">
            Needs confirmation
          </h2>
          <ul className="mt-4 space-y-3">
            {recentPending.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <p className="font-semibold text-forest">
                  {b.customerName} — {formatDate(b.scheduledDate)} at{" "}
                  {formatTime(b.startTime)}
                </p>
                <p className="text-sm text-slate/70">{b.address}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
