"use client";

import { markReviewDiscountRedeemed } from "@/lib/actions/review-reward";
import { REVIEW_DISCOUNT_PERCENT } from "@/lib/review-reward";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function formatClaimedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReviewDiscountAdminPanel({
  bookingId,
  reviewDiscountCode,
  reviewDiscountClaimedAt,
  reviewDiscountRedeemedAt,
}: {
  bookingId: string;
  reviewDiscountCode: string | null;
  reviewDiscountClaimedAt: Date | null;
  reviewDiscountRedeemedAt: Date | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [redeemed, setRedeemed] = useState(Boolean(reviewDiscountRedeemedAt));

  if (!reviewDiscountCode || !reviewDiscountClaimedAt) {
    return (
      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">Review discount</h2>
        <p className="mt-4 text-sm text-slate/60">
          No review discount claimed yet. Customer can claim {REVIEW_DISCOUNT_PERCENT}% off after
          leaving a Google review on their paid job page.
        </p>
      </section>
    );
  }

  const handleRedeem = () => {
    setError("");
    startTransition(async () => {
      try {
        await markReviewDiscountRedeemed({ bookingId });
        setRedeemed(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not mark as redeemed.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-slate/10 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-forest">Review discount</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-slate/50">Code</dt>
          <dd className="font-display text-xl font-bold text-forest">{reviewDiscountCode}</dd>
        </div>
        <div>
          <dt className="text-slate/50">Discount</dt>
          <dd>{REVIEW_DISCOUNT_PERCENT}% off next booking</dd>
        </div>
        <div>
          <dt className="text-slate/50">Claimed</dt>
          <dd>{formatClaimedDate(reviewDiscountClaimedAt)}</dd>
        </div>
        <div>
          <dt className="text-slate/50">Status</dt>
          <dd className="font-semibold text-forest">
            {redeemed ? "Redeemed" : "Available — verify Google review before honoring"}
          </dd>
        </div>
      </dl>

      {!redeemed ? (
        <button
          type="button"
          onClick={handleRedeem}
          disabled={pending}
          className="touch-target mt-6 rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Mark discount redeemed"}
        </button>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
