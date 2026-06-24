"use client";

import { createRecurringFromJob } from "@/lib/actions/recurring";
import { RECURRING_FREQUENCY_OPTIONS, formatCents } from "@/lib/recurring";
import type { RecurringFrequency } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function JobActions({
  token,
  amountCents,
  paid,
  hasRecurring,
}: {
  token: string;
  amountCents: number;
  paid: boolean;
  hasRecurring: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [payError, setPayError] = useState("");
  const [recurringError, setRecurringError] = useState("");
  const [recurringSuccess, setRecurringSuccess] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY");
  const [paidBanner, setPaidBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("paid") === "1") {
      setPaidBanner(true);
      router.replace(`/jobs/${token}`, { scroll: false });
    }
  }, [searchParams, router, token]);

  const pay = async () => {
    setPayError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error ?? "Could not start checkout.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setPayError("Could not start checkout.");
    }
  };

  const setupRecurring = () => {
    setRecurringError("");
    startTransition(async () => {
      try {
        await createRecurringFromJob({ token, frequency });
        setRecurringSuccess(true);
        router.refresh();
      } catch (e) {
        setRecurringError(e instanceof Error ? e.message : "Could not set up recurring.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {paidBanner || paid ? (
        <p className="rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-forest">
          Payment received — thank you! Your invoice is below.
        </p>
      ) : null}

      <section id="pay" className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-bold text-forest">Pay for your service</h2>
        <p className="mt-2 text-3xl font-bold text-teal">{formatCents(amountCents)}</p>
        {paid ? (
          <p className="mt-2 text-sm text-forest">Paid in full.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={pay}
              className="mt-4 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white hover:bg-teal-light"
            >
              Pay securely with Stripe
            </button>
            {payError ? <p className="mt-2 text-sm text-red-700">{payError}</p> : null}
          </>
        )}
      </section>

      <section id="recurring" className="rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-bold text-forest">Schedule recurring service</h2>
        <p className="mt-2 text-sm text-slate/70">
          Loved the results? Set up the same service on a regular schedule.
        </p>
        {hasRecurring || recurringSuccess ? (
          <p className="mt-4 text-sm font-semibold text-forest">
            Recurring service is active — we&apos;ll be in touch before your next visit.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full max-w-xs rounded-lg border border-slate/20 px-3 py-2 text-sm"
            >
              {RECURRING_FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={setupRecurring}
              className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Set up recurring service"}
            </button>
            {recurringError ? (
              <p className="text-sm text-red-700">{recurringError}</p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
