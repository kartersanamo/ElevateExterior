"use client";

import { cancelAppointment } from "@/lib/actions/appointment";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CancelAppointment({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const cancel = () => {
    if (
      !confirm(
        "Cancel this appointment? This will free up your time slot and notify our team."
      )
    ) {
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await cancelAppointment(token);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not cancel.");
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={cancel}
        className="touch-target rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Cancelling…" : "Cancel appointment"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
