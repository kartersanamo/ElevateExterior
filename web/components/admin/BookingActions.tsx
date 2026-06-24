"use client";

import Link from "next/link";
import type { BookingStatus } from "@prisma/client";
import { useTransition } from "react";
import { updateBookingStatus } from "@/lib/actions/admin";

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const [pending, startTransition] = useTransition();

  const act = (newStatus: BookingStatus) => {
    startTransition(async () => {
      await updateBookingStatus(bookingId, newStatus);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("CONFIRMED")}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("CANCELLED")}
            className="rounded-lg border border-slate/20 px-4 py-2 text-sm font-semibold text-slate/70 hover:bg-slate/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      ) : null}
      {status === "CONFIRMED" ? (
        <>
          <Link
            href={`/admin/bookings/${bookingId}/complete`}
            className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-light"
          >
            Complete job…
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("CANCELLED")}
            className="rounded-lg border border-slate/20 px-4 py-2 text-sm font-semibold text-slate/70 hover:bg-slate/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      ) : null}
      {status === "COMPLETED" ? (
        <Link
          href={`/admin/jobs/${bookingId}`}
          className="rounded-lg border border-slate/20 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/5"
        >
          View job
        </Link>
      ) : null}
    </div>
  );
}
