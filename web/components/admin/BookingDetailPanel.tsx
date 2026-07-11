"use client";

import { BookingDetailContent, type BookingDetailData } from "@/components/admin/BookingDetailContent";
import { buildBookingsUrl, type ParsedBookingListParams } from "@/lib/bookings-admin";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function BookingDetailPanel({
  booking,
  listParams,
}: {
  booking: BookingDetailData | null;
  listParams: ParsedBookingListParams;
}) {
  const router = useRouter();

  const closeHref = buildBookingsUrl({ id: null }, listParams);

  useEffect(() => {
    if (!booking) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push(closeHref);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [booking, closeHref, router]);

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <Link
        href={closeHref}
        className="absolute inset-0 bg-forest/40"
        aria-label="Close booking details"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate/10 px-5 py-4">
          <h2 id="booking-detail-title" className="font-display text-lg font-bold text-forest">
            Booking details
          </h2>
          <Link
            href={closeHref}
            className="rounded-lg p-2 text-slate/60 hover:bg-slate/5 hover:text-forest"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <BookingDetailContent booking={booking} />
        </div>
      </aside>
    </div>
  );
}
