"use client";

import { rescheduleAppointment } from "@/lib/actions/appointment";
import { CalendarScheduler } from "@/components/calendar/CalendarScheduler";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ReschedulePanel({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [slot, setSlot] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const submit = () => {
    setError("");
    if (!slot) {
      setError("Please select a new date and time.");
      return;
    }
    startTransition(async () => {
      try {
        await rescheduleAppointment({
          token,
          scheduledDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not reschedule.");
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="touch-target rounded-lg border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal hover:bg-mint"
      >
        Reschedule appointment
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-forest">Pick a new time</h2>
      <CalendarScheduler
        mode="book"
        onSlotSelect={(date, s) => setSlot({ date, ...s })}
      />
      {slot ? (
        <p className="mt-4 text-sm font-semibold text-forest">
          Selected: {slot.date} at {slot.startTime}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="touch-target rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Confirm new time"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="touch-target rounded-lg border border-slate/20 px-5 py-2.5 text-sm font-semibold text-slate/70"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
