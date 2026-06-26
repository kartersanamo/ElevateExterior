"use client";

import { services, site } from "@/lib/site-config";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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

function serviceLabels(idsJson: string): string {
  const ids = JSON.parse(idsJson) as string[];
  return ids.map((id) => services.find((s) => s.id === id)?.title ?? id).join(", ");
}

export function AppointmentUpcoming({
  booking,
}: {
  booking: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    services: string;
    scheduledDate: Date;
    startTime: string;
    endTime: string;
    status: string;
  };
}) {
  return (
    <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">
        Upcoming appointment
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-forest">
        {booking.customerName}
      </h1>
      <p className="mt-2 text-slate/70">
        {formatDate(booking.scheduledDate)} · {formatTime(booking.startTime)} –{" "}
        {formatTime(booking.endTime)}
      </p>
      <span className="mt-3 inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase text-teal">
        {booking.status}
      </span>

      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-slate/50">Services</dt>
          <dd>{serviceLabels(booking.services)}</dd>
        </div>
        <div>
          <dt className="text-slate/50">Address</dt>
          <dd>{booking.address}</dd>
        </div>
        <div>
          <dt className="text-slate/50">Contact</dt>
          <dd>
            {booking.customerEmail}
            {booking.customerPhone ? ` · ${booking.customerPhone}` : ""}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-slate/60">
        Questions? Call{" "}
        <a href={site.phoneHref} className="font-semibold text-teal hover:underline">
          {site.phone}
        </a>
      </p>
    </section>
  );
}
