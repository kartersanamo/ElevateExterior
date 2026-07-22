"use client";

import { acceptQuote, declineQuote } from "@/lib/actions/quotes";
import { CalendarScheduler } from "@/components/calendar/CalendarScheduler";
import { formatCents } from "@/lib/recurring";
import { services } from "@/lib/site-config";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function QuoteAcceptPanel({
  token,
  amountCents,
  servicesJson,
  quoteNotes,
  hasProposedSlot,
  proposedDate,
  proposedStartTime,
  proposedEndTime,
}: {
  token: string;
  amountCents: number;
  servicesJson: string;
  quoteNotes: string | null;
  hasProposedSlot: boolean;
  proposedDate: string | null;
  proposedStartTime: string | null;
  proposedEndTime: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsNewSlot, setNeedsNewSlot] = useState(false);
  const [slot, setSlot] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(
    hasProposedSlot && proposedDate && proposedStartTime && proposedEndTime
      ? {
          date: proposedDate.slice(0, 10),
          startTime: proposedStartTime.slice(0, 5),
          endTime: proposedEndTime.slice(0, 5),
        }
      : null
  );

  const serviceIds = JSON.parse(servicesJson) as string[];
  const serviceLine = serviceIds
    .map((id) => services.find((s) => s.id === id)?.title ?? id)
    .join(", ");

  const accept = () => {
    setError("");
    if ((!hasProposedSlot || needsNewSlot) && !slot) {
      setError("Please select a date and time.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await acceptQuote({
          token,
          scheduledDate: slot?.date,
          startTime: slot?.startTime,
          endTime: slot?.endTime,
        });
        if (!result.ok) {
          setError(result.error);
          if (result.needsNewSlot) {
            setNeedsNewSlot(true);
            setSlot(null);
          }
          return;
        }
        setSuccess(true);
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "That time slot is no longer available. Please pick another."
        );
        setNeedsNewSlot(true);
        setSlot(null);
      }
    });
  };

  const decline = () => {
    startTransition(async () => {
      await declineQuote(token);
      router.refresh();
    });
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-mint px-6 py-8 text-center">
        <p className="font-display text-xl font-bold text-forest">You&apos;re booked!</p>
        <p className="mt-2 text-sm text-slate/70">
          We sent a confirmation email with your appointment details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-forest">Your quote</h2>
        <p className="mt-2 text-3xl font-bold text-teal">{formatCents(amountCents)}</p>
        <p className="mt-4 text-sm">
          <strong>Services:</strong> {serviceLine}
        </p>
        {quoteNotes ? (
          <p className="mt-2 text-sm text-slate/70">{quoteNotes}</p>
        ) : null}
      </section>

      {hasProposedSlot && !needsNewSlot ? (
        <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-forest">Proposed schedule</h2>
          <p className="mt-2 text-sm">
            {proposedDate?.slice(0, 10)} at {proposedStartTime?.slice(0, 5)} –{" "}
            {proposedEndTime?.slice(0, 5)}
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-forest">
            {needsNewSlot ? "Pick a new time" : "Pick a time"}
          </h2>
          {needsNewSlot ? (
            <p className="mt-2 text-sm text-slate/70">
              The proposed time is no longer available. Choose another slot below.
            </p>
          ) : null}
          <CalendarScheduler
            mode="book"
            onSlotSelect={(date, s) => setSlot({ date, ...s })}
          />
          {slot ? (
            <p className="mt-4 text-sm font-semibold text-forest">
              Selected: {slot.date} at {slot.startTime}
            </p>
          ) : null}
        </section>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={accept}
          className="rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Booking…" : "Accept quote & book"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={decline}
          className="rounded-lg border border-slate/20 px-6 py-3 text-sm font-semibold text-slate/70"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
