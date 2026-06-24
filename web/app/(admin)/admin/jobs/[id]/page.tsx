import { db } from "@/lib/db";
import { formatCents, frequencyLabel } from "@/lib/recurring";
import { services } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/stripe";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

export default async function AdminJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      recurringService: true,
    },
  });

  if (!booking) notFound();

  const publicUrl = booking.publicToken
    ? `${getSiteUrl()}/jobs/${booking.publicToken}`
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Job summary</h1>
          <p className="mt-2 text-slate/70">{booking.customerName}</p>
        </div>
        <Link href="/admin/bookings" className="text-sm font-semibold text-teal hover:underline">
          ← Back to bookings
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">Details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-slate/50">Status</dt>
              <dd className="font-semibold">{booking.status}</dd>
            </div>
            <div>
              <dt className="text-slate/50">Date</dt>
              <dd>
                {formatDate(booking.scheduledDate)} · {formatTime(booking.startTime)} –{" "}
                {formatTime(booking.endTime)}
              </dd>
            </div>
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
                {booking.customerEmail} · {booking.customerPhone}
              </dd>
            </div>
            {booking.amountChargedCents != null ? (
              <div>
                <dt className="text-slate/50">Amount charged</dt>
                <dd className="font-semibold text-forest">
                  {formatCents(booking.amountChargedCents)}
                  {booking.paidAt ? " · Paid" : " · Unpaid"}
                </dd>
              </div>
            ) : null}
            {publicUrl ? (
              <div>
                <dt className="text-slate/50">Customer link</dt>
                <dd>
                  <a href={publicUrl} className="text-teal hover:underline" target="_blank" rel="noreferrer">
                    {publicUrl}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">Recurring</h2>
          {booking.recurringService ? (
            <p className="mt-4 text-sm">
              Active — {frequencyLabel(booking.recurringService.frequency)}
              {booking.recurringService.nextServiceDate
                ? ` · Next due ${formatDate(booking.recurringService.nextServiceDate)}`
                : ""}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate/60">No recurring service set up yet.</p>
          )}
          <Link
            href="/admin/recurring"
            className="mt-4 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Manage recurring services →
          </Link>
        </section>
      </div>

      {booking.photos.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {booking.photos.map((photo) => (
              <a
                key={photo.id}
                href={`/api/admin/job-photos/${booking.id}/${photo.id}`}
                target="_blank"
                rel="noreferrer"
                className="relative aspect-square overflow-hidden rounded-xl bg-slate/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/job-photos/${booking.id}/${photo.id}`}
                  alt="Job photo"
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {booking.invoiceHtml ? (
        <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">
            Invoice {booking.invoiceNumber}
          </h2>
          <div
            className="prose prose-sm mt-4 max-w-none"
            dangerouslySetInnerHTML={{ __html: booking.invoiceHtml }}
          />
        </section>
      ) : null}
    </div>
  );
}
