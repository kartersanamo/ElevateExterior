"use client";

import { claimReviewDiscount } from "@/lib/actions/review-reward";
import { REVIEW_DISCOUNT_PERCENT, reviewClaimUrl } from "@/lib/review-reward";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function ReviewRewardSection({
  token,
  googleReviewUrl,
  reviewDiscountCode,
  paid,
}: {
  token: string;
  googleReviewUrl: string | null;
  reviewDiscountCode: string | null;
  paid: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(reviewDiscountCode);
  const [error, setError] = useState("");

  useEffect(() => {
    setCode(reviewDiscountCode);
  }, [reviewDiscountCode]);

  useEffect(() => {
    if (window.location.hash === "#review-reward") {
      document.getElementById("review-reward")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  if (!paid || !googleReviewUrl) return null;

  const percent = REVIEW_DISCOUNT_PERCENT;
  const claimed = Boolean(code);

  const handleClaim = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await claimReviewDiscount({ token });
        setCode(result.code);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not claim discount.");
      }
    });
  };

  return (
    <section
      id="review-reward"
      className="rounded-2xl bg-forest p-8 text-center text-white shadow-lg"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-light">
        Thank you bonus
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
        Get {percent}% off your next cleaning
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/85">
        Leave a Google review and get <strong className="text-white">{percent}% off</strong> your
        next order. After you post, tap below to claim your discount code.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="touch-target inline-flex w-full max-w-xs items-center justify-center rounded-lg bg-teal px-8 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-teal-light sm:w-auto"
        >
          Leave a Google review
        </a>
        {!claimed ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={pending}
            className="touch-target inline-flex w-full max-w-xs items-center justify-center rounded-lg bg-white px-8 py-4 text-sm font-bold uppercase tracking-wide text-forest hover:bg-cream disabled:opacity-50 sm:w-auto"
          >
            {pending ? "Claiming…" : "I left my review — get my 10% off"}
          </button>
        ) : null}
      </div>

      {claimed && code ? (
        <div className="mx-auto mt-8 max-w-sm rounded-xl bg-white/10 px-6 py-5">
          <p className="text-sm font-semibold text-teal-light">Your discount code</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-wide">{code}</p>
          <p className="mt-3 text-sm text-white/70">
            We also emailed this code to you. Mention it when you book your next cleaning.
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}

      <p className="mt-6 text-xs text-white/50">
        Offer valid for one use on your next booking.{" "}
        <span className="sr-only">Claim link: {reviewClaimUrl(token)}</span>
      </p>
    </section>
  );
}
