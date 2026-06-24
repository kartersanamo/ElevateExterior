import { JobActions } from "@/components/jobs/JobActions";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/recurring";
import { site, services } from "@/lib/site-config";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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

export default async function PublicJobPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await db.booking.findUnique({
    where: { publicToken: token },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      recurringService: true,
    },
  });

  if (!booking || booking.status !== "COMPLETED") notFound();

  return (
    <div className="min-h-screen bg-mint/30 pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <Link href="/" className="text-sm font-semibold text-teal hover:underline">
          ← {site.shortName}
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">
            Your service summary
          </p>
          <h1 className="font-display text-3xl font-bold text-forest">
            {booking.customerName}
          </h1>
          <p className="mt-2 text-slate/70">
            {formatDate(booking.scheduledDate)} · {formatTime(booking.startTime)} –{" "}
            {formatTime(booking.endTime)}
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-forest">Job details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-slate/50">Services</dt>
              <dd>{serviceLabels(booking.services)}</dd>
            </div>
            <div>
              <dt className="text-slate/50">Address</dt>
              <dd>{booking.address}</dd>
            </div>
            {booking.amountChargedCents != null ? (
              <div>
                <dt className="text-slate/50">Amount</dt>
                <dd className="font-semibold">{formatCents(booking.amountChargedCents)}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {booking.photos.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold text-forest">Photos</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {booking.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate/5"
                >
                  <Image
                    src={`/api/jobs/${token}/photos/${photo.id}`}
                    alt="Completed work"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8">
          <Suspense fallback={null}>
            <JobActions
              token={token}
              amountCents={booking.amountChargedCents ?? 0}
              paid={Boolean(booking.paidAt)}
              hasRecurring={Boolean(booking.recurringService)}
            />
          </Suspense>
        </div>

        {booking.invoiceHtml ? (
          <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-forest">
              Invoice {booking.invoiceNumber}
            </h2>
            <div
              className="mt-4 text-sm"
              dangerouslySetInnerHTML={{ __html: booking.invoiceHtml }}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
