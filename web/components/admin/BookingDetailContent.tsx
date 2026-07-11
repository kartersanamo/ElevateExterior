"use client";

import { BookingActions } from "@/components/admin/BookingActions";
import { ReviewDiscountAdminPanel } from "@/components/admin/ReviewDiscountAdminPanel";
import {
  formatBookingDateLong,
  formatBookingTime,
  serviceLabels,
  STATUS_STYLES,
} from "@/lib/bookings-admin";
import { formatCents, frequencyLabel } from "@/lib/recurring";
import type { BookingStatus, RecurringFrequency } from "@prisma/client";
import Link from "next/link";

export interface BookingDetailData {
  id: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  services: string;
  notes: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  publicUrl: string | null;
  amountChargedCents: number | null;
  paidAt: string | null;
  completedAt: string | null;
  invoiceNumber: string | null;
  invoiceHtml: string | null;
  createdAt: string;
  photos: { id: string }[];
  recurringService: {
    frequency: RecurringFrequency;
    nextServiceDate: string | null;
  } | null;
  reviewDiscountCode: string | null;
  reviewDiscountClaimedAt: string | null;
  reviewDiscountRedeemedAt: string | null;
}

export function BookingDetailContent({ booking }: { booking: BookingDetailData }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[booking.status]}`}
          >
            {booking.status}
          </span>
          <h2 className="mt-2 font-display text-xl font-bold text-forest">
            {booking.customerName}
          </h2>
          <p className="text-sm text-slate/70">
            {formatBookingDateLong(booking.scheduledDate)} ·{" "}
            {formatBookingTime(booking.startTime)} –{" "}
            {formatBookingTime(booking.endTime)}
          </p>
        </div>
        <BookingActions bookingId={booking.id} status={booking.status} />
      </div>

      <section className="rounded-xl border border-slate/10 bg-slate/5 p-4">
        <h3 className="text-sm font-semibold text-forest">Contact</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-slate/50">Email</dt>
            <dd>
              <a
                href={`mailto:${booking.customerEmail}`}
                className="text-teal hover:underline"
              >
                {booking.customerEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-slate/50">Phone</dt>
            <dd>
              <a
                href={`tel:${booking.customerPhone.replace(/\D/g, "")}`}
                className="text-teal hover:underline"
              >
                {booking.customerPhone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-slate/50">Address</dt>
            <dd>{booking.address}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate/10 bg-slate/5 p-4">
        <h3 className="text-sm font-semibold text-forest">Job details</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-slate/50">Services</dt>
            <dd>{serviceLabels(booking.services)}</dd>
          </div>
          {booking.notes ? (
            <div>
              <dt className="text-slate/50">Notes</dt>
              <dd className="whitespace-pre-wrap">{booking.notes}</dd>
            </div>
          ) : null}
          {booking.amountChargedCents != null ? (
            <div>
              <dt className="text-slate/50">Amount charged</dt>
              <dd className="font-semibold text-forest">
                {formatCents(booking.amountChargedCents)}
                {booking.paidAt ? " · Paid" : " · Unpaid"}
              </dd>
            </div>
          ) : null}
          {booking.publicUrl ? (
            <div>
              <dt className="text-slate/50">Customer link</dt>
              <dd>
                <a
                  href={booking.publicUrl}
                  className="break-all text-teal hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {booking.publicUrl}
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-slate/50">Created</dt>
            <dd>{formatBookingDateLong(booking.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate/10 bg-slate/5 p-4">
        <h3 className="text-sm font-semibold text-forest">Recurring</h3>
        {booking.recurringService ? (
          <p className="mt-3 text-sm">
            Active — {frequencyLabel(booking.recurringService.frequency)}
            {booking.recurringService.nextServiceDate
              ? ` · Next due ${formatBookingDateLong(booking.recurringService.nextServiceDate)}`
              : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate/60">
            No recurring service set up yet.
          </p>
        )}
        <Link
          href="/admin/recurring"
          className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
        >
          Manage recurring services →
        </Link>
      </section>

      <ReviewDiscountAdminPanel
        bookingId={booking.id}
        reviewDiscountCode={booking.reviewDiscountCode}
        reviewDiscountClaimedAt={
          booking.reviewDiscountClaimedAt
            ? new Date(booking.reviewDiscountClaimedAt)
            : null
        }
        reviewDiscountRedeemedAt={
          booking.reviewDiscountRedeemedAt
            ? new Date(booking.reviewDiscountRedeemedAt)
            : null
        }
      />

      {booking.photos.length > 0 ? (
        <section className="rounded-xl border border-slate/10 bg-slate/5 p-4">
          <h3 className="text-sm font-semibold text-forest">Photos</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {booking.photos.map((photo) => (
              <a
                key={photo.id}
                href={`/api/admin/job-photos/${booking.id}/${photo.id}`}
                target="_blank"
                rel="noreferrer"
                className="relative aspect-square overflow-hidden rounded-lg bg-white"
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
        <section className="rounded-xl border border-slate/10 bg-slate/5 p-4">
          <h3 className="text-sm font-semibold text-forest">
            Invoice {booking.invoiceNumber}
          </h3>
          <iframe
            srcDoc={booking.invoiceHtml}
            title={`Invoice ${booking.invoiceNumber ?? ""}`}
            className="mt-3 w-full min-h-[20rem] rounded-lg border border-slate/10 bg-white"
            sandbox=""
          />
        </section>
      ) : null}

      {booking.status === "COMPLETED" ? (
        <Link
          href={`/admin/jobs/${booking.id}`}
          className="inline-block text-sm font-semibold text-teal hover:underline"
        >
          View full job page →
        </Link>
      ) : null}
    </div>
  );
}
