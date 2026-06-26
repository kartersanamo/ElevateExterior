import { CancelAppointment } from "@/components/appointments/CancelAppointment";
import { AppointmentUpcoming } from "@/components/appointments/AppointmentUpcoming";
import { ReschedulePanel } from "@/components/appointments/ReschedulePanel";
import { JobActions } from "@/components/jobs/JobActions";
import { db } from "@/lib/db";
import { confirmBookingPaymentFromReturn } from "@/lib/payments";
import { formatCents } from "@/lib/recurring";
import { site, services } from "@/lib/site-config";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

async function loadBooking(token: string) {
  return db.booking.findUnique({
    where: { publicToken: token },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      recurringService: true,
    },
  });
}

export default async function AppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; session_id?: string }>;
}) {
  const { token } = await params;
  const { paid, session_id: sessionId } = await searchParams;

  if (paid === "1") {
    await confirmBookingPaymentFromReturn(token, sessionId);
    redirect(`/appointments/${token}`);
  }

  const booking = await loadBooking(token);
  if (!booking) notFound();

  if (booking.status === "CANCELLED") {
    return (
      <div className="min-h-screen-safe bg-mint/30 page-top pb-16 safe-bottom">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Link href="/" className="text-sm font-semibold text-teal hover:underline">
            ← {site.shortName}
          </Link>
          <h1 className="mt-8 font-display text-3xl font-bold text-forest">
            Appointment cancelled
          </h1>
          <p className="mt-4 text-slate/70">
            This appointment has been cancelled. We&apos;d love to serve you again.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-block rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white"
          >
            Book again
          </Link>
        </div>
      </div>
    );
  }

  if (booking.status === "CONFIRMED" || booking.status === "PENDING") {
    return (
      <div className="min-h-screen-safe bg-mint/30 page-top pb-16 safe-bottom">
        <div className="mx-auto max-w-3xl space-y-6 px-6">
          <Link href="/" className="text-sm font-semibold text-teal hover:underline">
            ← {site.shortName}
          </Link>
          <AppointmentUpcoming booking={booking} />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <ReschedulePanel token={token} />
            <CancelAppointment token={token} />
          </div>
        </div>
      </div>
    );
  }

  if (booking.status !== "COMPLETED") notFound();

  if (!booking.paidAt && booking.stripeCheckoutSessionId) {
    await confirmBookingPaymentFromReturn(token);
  }

  const completedBooking = (await loadBooking(token)) ?? booking;

  return (
    <div className="min-h-screen-safe bg-mint/30 page-top pb-16 safe-bottom">
      <div className="mx-auto max-w-3xl px-6">
        <Link href="/" className="text-sm font-semibold text-teal hover:underline">
          ← {site.shortName}
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">
            Your service summary
          </p>
          <h1 className="font-display text-3xl font-bold text-forest">
            {completedBooking.customerName}
          </h1>
          <p className="mt-2 text-slate/70">
            {formatDate(completedBooking.scheduledDate)} · {formatTime(completedBooking.startTime)} –{" "}
            {formatTime(completedBooking.endTime)}
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-forest">Job details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-slate/50">Services</dt>
              <dd>{serviceLabels(completedBooking.services)}</dd>
            </div>
            <div>
              <dt className="text-slate/50">Address</dt>
              <dd>{completedBooking.address}</dd>
            </div>
            {completedBooking.amountChargedCents != null ? (
              <div>
                <dt className="text-slate/50">Amount</dt>
                <dd className="font-semibold">
                  {formatCents(completedBooking.amountChargedCents)}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        {completedBooking.photos.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold text-forest">Photos</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {completedBooking.photos.map((photo) => (
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
              amountCents={completedBooking.amountChargedCents ?? 0}
              paid={Boolean(completedBooking.paidAt)}
              hasRecurring={Boolean(completedBooking.recurringService)}
            />
          </Suspense>
        </div>

        {completedBooking.invoiceHtml ? (
          <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-forest">
              Invoice {completedBooking.invoiceNumber}
            </h2>
            <iframe
              srcDoc={completedBooking.invoiceHtml}
              title={`Invoice ${completedBooking.invoiceNumber ?? ""}`}
              className="mt-4 w-full min-h-[28rem] rounded-lg border border-slate/10 bg-white"
              sandbox=""
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
