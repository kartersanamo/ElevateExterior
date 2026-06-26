"use client";

import { sendQuote, releaseQuoteHold } from "@/lib/actions/quotes";
import { services } from "@/lib/site-config";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface QuoteRow {
  id: string;
  publicToken: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  address: string | null;
  message: string;
  services: string;
  quotedAmountCents: number | null;
  quoteNotes: string | null;
  proposedDate: string | null;
  proposedStartTime: string | null;
  proposedEndTime: string | null;
  holdExpiresAt: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  QUOTED: "bg-teal/10 text-teal",
  ACCEPTED: "bg-forest/10 text-forest",
  DECLINED: "bg-slate/10 text-slate/60",
  EXPIRED: "bg-slate/10 text-slate/50",
};

function parseServiceIds(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

function serviceSummary(json: string): string {
  const ids = parseServiceIds(json);
  if (ids.length === 0) return "Services not specified";
  return ids
    .map((id) => services.find((s) => s.id === id)?.title ?? id)
    .join(", ");
}

function toTimeInputValue(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

function formatPreferredTime(quote: QuoteRow): string | null {
  if (!quote.proposedDate || !quote.proposedStartTime) return null;
  const date = new Date(quote.proposedDate);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const [h, min] = quote.proposedStartTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const timeStr = `${hour}:${String(min).padStart(2, "0")} ${period}`;
  const end =
    quote.proposedEndTime && quote.proposedEndTime !== quote.proposedStartTime
      ? (() => {
          const [eh, emin] = quote.proposedEndTime!.split(":").map(Number);
          const ePeriod = eh >= 12 ? "PM" : "AM";
          const eHour = eh % 12 || 12;
          return ` – ${eHour}:${String(emin).padStart(2, "0")} ${ePeriod}`;
        })()
      : "";
  return `${dateStr} at ${timeStr}${end}`;
}

function buildFormFromQuote(quote: QuoteRow) {
  const serviceIds = parseServiceIds(quote.services);
  return {
    amount: quote.quotedAmountCents
      ? (quote.quotedAmountCents / 100).toFixed(2)
      : "",
    services: serviceIds,
    quoteNotes: quote.quoteNotes ?? "",
    proposedDate: quote.proposedDate?.slice(0, 10) ?? "",
    proposedStartTime: toTimeInputValue(quote.proposedStartTime),
    proposedEndTime: toTimeInputValue(quote.proposedEndTime),
  };
}

export function QuoteManager({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialActiveId = useMemo(
    () => quotes.find((q) => q.status === "PENDING")?.id ?? quotes[0]?.id ?? null,
    [quotes]
  );
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    amount: "",
    services: [] as string[],
    quoteNotes: "",
    proposedDate: "",
    proposedStartTime: "",
    proposedEndTime: "",
  });

  const active = quotes.find((q) => q.id === activeId);

  useEffect(() => {
    const quote = quotes.find((q) => q.id === activeId);
    if (quote) {
      setForm(buildFormFromQuote(quote));
      setError("");
      setMessage("");
    }
  }, [activeId, quotes]);

  const selectQuote = (quote: QuoteRow) => {
    setActiveId(quote.id);
  };

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id)
        ? f.services.filter((s) => s !== id)
        : [...f.services, id],
    }));
  };

  const submitQuote = () => {
    if (!active) return;

    if (form.services.length === 0) {
      setError("Select at least one service.");
      return;
    }
    if (!form.amount.trim()) {
      setError("Enter a quote amount before sending.");
      return;
    }

    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await sendQuote({
          quoteId: active.id,
          amount: form.amount,
          services: form.services,
          quoteNotes: form.quoteNotes,
          proposedDate: form.proposedDate || undefined,
          proposedStartTime: form.proposedStartTime || undefined,
          proposedEndTime: form.proposedEndTime || undefined,
        });
        setMessage(`Quote sent. Customer link: /quote/${result.token}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send quote.");
      }
    });
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        {quotes.length === 0 ? (
          <p className="text-slate/60">No quote requests yet.</p>
        ) : (
          quotes.map((quote) => (
            <button
              key={quote.id}
              type="button"
              onClick={() => selectQuote(quote)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                activeId === quote.id
                  ? "border-teal bg-teal/5"
                  : "border-slate/10 bg-white hover:border-teal/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-forest">{quote.customerName}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[quote.status] ?? ""}`}
                >
                  {quote.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate/60">{quote.customerEmail}</p>
              <p className="mt-1 text-sm text-slate/70">{serviceSummary(quote.services)}</p>
              {quote.address ? (
                <p className="mt-1 text-sm text-slate/60">{quote.address}</p>
              ) : null}
              {formatPreferredTime(quote) ? (
                <p className="mt-1 text-sm text-slate/60">
                  Preferred: {formatPreferredTime(quote)}
                </p>
              ) : null}
              {quote.holdExpiresAt &&
              (quote.status === "PENDING" || quote.status === "QUOTED") ? (
                <p className="mt-1 text-xs text-amber-700">
                  Hold expires{" "}
                  {new Date(quote.holdExpiresAt).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              ) : null}
            </button>
          ))
        )}
      </section>

      {active ? (
        <section className="rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">
            Review &amp; send quote
          </h2>
          <p className="mt-1 text-sm text-slate/60">
            Customer details are prefilled below. Adjust anything, add your price, then
            send.
          </p>

          {message ? (
            <p className="mt-4 rounded-lg bg-mint px-4 py-2 text-sm text-forest">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          <div className="mt-6 rounded-xl border border-slate/10 bg-cream/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate/50">
              Customer request
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-slate/50">Name</dt>
                <dd className="font-medium text-forest">{active.customerName}</dd>
              </div>
              <div>
                <dt className="text-slate/50">Email</dt>
                <dd>{active.customerEmail}</dd>
              </div>
              {active.customerPhone ? (
                <div>
                  <dt className="text-slate/50">Phone</dt>
                  <dd>{active.customerPhone}</dd>
                </div>
              ) : null}
              {active.address ? (
                <div>
                  <dt className="text-slate/50">Address</dt>
                  <dd>{active.address}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate/50">Services requested</dt>
                <dd>{serviceSummary(active.services)}</dd>
              </div>
              {formatPreferredTime(active) ? (
                <div>
                  <dt className="text-slate/50">Preferred time</dt>
                  <dd>{formatPreferredTime(active)}</dd>
                </div>
              ) : null}
              {active.message ? (
                <div>
                  <dt className="text-slate/50">Notes</dt>
                  <dd className="whitespace-pre-wrap text-slate/70">{active.message}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {active.status === "PENDING" || active.status === "QUOTED" ? (
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate/50">
                Your quote
              </h3>

              <div>
                <p className="text-sm font-semibold text-forest">Services</p>
                <p className="mt-1 text-xs text-slate/50">
                  Prefilled from the customer request — tap to change.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        form.services.includes(s.id)
                          ? "bg-teal text-white"
                          : "bg-mint text-forest"
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm">
                <span className="font-semibold text-forest">
                  Quote amount ($) <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="form-input mt-1"
                  placeholder="250.00"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate/60">Notes for customer (optional)</span>
                <textarea
                  rows={3}
                  value={form.quoteNotes}
                  onChange={(e) => setForm({ ...form, quoteNotes: e.target.value })}
                  className="form-input mt-1"
                  placeholder="Any details about scope, access, or timing…"
                />
              </label>

              <div>
                <p className="text-sm font-semibold text-forest">Proposed schedule</p>
                <p className="mt-1 text-xs text-slate/50">
                  Prefilled from the customer&apos;s preferred time. Change if needed, or
                  clear the date to let them pick when accepting.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block text-sm sm:col-span-3">
                    <span className="text-slate/60">Date</span>
                    <input
                      type="date"
                      value={form.proposedDate}
                      onChange={(e) => setForm({ ...form, proposedDate: e.target.value })}
                      className="form-input mt-1"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate/60">Start</span>
                    <input
                      type="time"
                      value={form.proposedStartTime}
                      onChange={(e) =>
                        setForm({ ...form, proposedStartTime: e.target.value })
                      }
                      className="form-input mt-1"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate/60">End</span>
                    <input
                      type="time"
                      value={form.proposedEndTime}
                      onChange={(e) =>
                        setForm({ ...form, proposedEndTime: e.target.value })
                      }
                      className="form-input mt-1"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={submitQuote}
                  className="touch-target rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "Sending…" : "Send quote to customer"}
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await releaseQuoteHold(active.id);
                        setMessage("Slot hold released.");
                        router.refresh();
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Could not release hold."
                        );
                      }
                    })
                  }
                  className="touch-target rounded-lg border border-amber-200 px-5 py-2.5 text-sm font-semibold text-amber-800"
                >
                  Release hold
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate/60">
              This quote has been {active.status.toLowerCase()}.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
