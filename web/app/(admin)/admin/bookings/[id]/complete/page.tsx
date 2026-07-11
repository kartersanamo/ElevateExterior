import { CompleteBookingForm } from "@/components/admin/CompleteBookingForm";
import { serviceLabels } from "@/lib/bookings-admin";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompleteBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: { quoteRequest: true },
  });

  if (!booking) notFound();
  if (booking.status === "COMPLETED") redirect(`/admin/jobs/${id}`);
  if (booking.status !== "CONFIRMED") redirect("/admin/bookings");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Complete job</h1>
      <p className="mt-2 text-slate/70">
        {booking.customerName} — upload photos and confirm the amount charged.
      </p>
      <CompleteBookingForm
        bookingId={booking.id}
        customerName={booking.customerName}
        serviceDescription={serviceLabels(booking.services)}
        quotedAmountCents={
          booking.amountChargedCents ?? booking.quoteRequest?.quotedAmountCents ?? null
        }
      />
    </div>
  );
}
