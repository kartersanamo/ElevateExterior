"use client";

import { completeBooking } from "@/lib/actions/complete-booking";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CompleteBookingForm({
  bookingId,
  customerName,
}: {
  bookingId: string;
  customerName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    previews.forEach((url) => URL.revokeObjectURL(url));
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const submit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await completeBooking(bookingId, formData);
        router.push(`/admin/jobs/${bookingId}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not complete job.");
      }
    });
  };

  return (
    <form action={submit} className="mt-8 space-y-8">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          Photos of completed work
        </h2>
        <p className="mt-1 text-sm text-slate/60">
          Upload or take photos for {customerName}. These are shared with the customer.
        </p>
        <input
          type="file"
          name="photos"
          accept="image/*"
          capture="environment"
          multiple
          required
          onChange={(e) => onFiles(e.target.files)}
          className="mt-4 block w-full text-sm"
        />
        {previews.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={src} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">Amount charged</h2>
        <p className="mt-1 text-sm text-slate/60">
          The customer will be able to pay this amount online via Stripe.
        </p>
        <div className="relative mt-4 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/50">$</span>
          <input
            type="text"
            name="amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate/20 py-2 pl-8 pr-3"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Completing…" : "Complete job & email customer"}
        </button>
        <Link
          href="/admin/bookings"
          className="rounded-lg border border-slate/20 px-6 py-3 text-sm font-semibold text-slate/70"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
