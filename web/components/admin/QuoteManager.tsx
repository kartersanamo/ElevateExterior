"use client";

import { sendQuote, releaseQuoteHold } from "@/lib/actions/quotes";
import { services } from "@/lib/site-config";
import {
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

interface SentSuccess {
  customerName: string;
  customerEmail: string;
  amount: string;
  token: string;
}

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

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending review",
  QUOTED: "Sent to customer",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
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

function formatAmount(amount: string): string {
  const parsed = Number.parseFloat(amount.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed)) return amount;
  return parsed.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function QuoteManager({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const successRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState<SentSuccess | null>(null);
  const [slotConflict, setSlotConflict] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    services: [] as string[],
    quoteNotes: "",
    proposedDate: "",
    proposedStartTime: "",
    proposedEndTime: "",
  });

  const active = quotes.find((q) => q.id === expandedId);

  useEffect(() => {
    const quote = quotes.find((q) => q.id === expandedId);
    if (quote) {
      setForm(buildFormFromQuote(quote));
    }
  }, [expandedId, quotes]);

  useEffect(() => {
    setError("");
    setMessage("");
    setSentSuccess(null);
    setSlotConflict(null);
    setCopied(false);
  }, [expandedId]);

  const toggleQuote = (quoteId: string) => {
    setExpandedId((current) => (current === quoteId ? null : quoteId));
  };

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id)
        ? f.services.filter((s) => s !== id)
        : [...f.services, id],
    }));
  };

  const sendQuoteRequest = (confirmUnavailableSlot = false) => {
    if (!active) return;

    setError("");
    setMessage("");
    setSentSuccess(null);
    setCopied(false);
    if (!confirmUnavailableSlot) {
      setSlotConflict(null);
    }

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
          confirmUnavailableSlot,
        });

        if (!result.ok) {
          setSlotConflict(result.message);
          return;
        }

        setSlotConflict(null);
        setSentSuccess({
          customerName: active.customerName,
          customerEmail: active.customerEmail,
          amount: form.amount,
          token: result.token,
        });
        router.refresh();
        requestAnimationFrame(() => {
          successRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      } catch (e) {
        setSlotConflict(null);
        setError(e instanceof Error ? e.message : "Could not send quote.");
      }
    });
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

    sendQuoteRequest();
  };

  const copyQuoteLink = async (token: string) => {
    const url = `${window.location.origin}/quote/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link. Open the quote page and copy the URL from the browser.");
    }
  };

  const pendingCount = quotes.filter((q) => q.status === "PENDING").length;
  const quotedCount = quotes.filter((q) => q.status === "QUOTED").length;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-forest shadow-sm ring-1 ring-slate/10">
          {quotes.length} open quote{quotes.length === 1 ? "" : "s"}
        </span>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
            {pendingCount} pending review
          </span>
        ) : null}
        {quotedCount > 0 ? (
          <span className="rounded-full bg-teal/10 px-3 py-1 font-semibold text-teal">
            {quotedCount} awaiting response
          </span>
        ) : null}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate/20 bg-white px-6 py-12 text-center">
          <p className="font-display text-lg font-bold text-forest">No open quote requests</p>
          <p className="mt-2 text-sm text-slate/60">
            New requests from the Book Now flow will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const isExpanded = expandedId === quote.id;
            const preferredTime = formatPreferredTime(quote);
            const showHold =
              quote.holdExpiresAt &&
              (quote.status === "PENDING" || quote.status === "QUOTED");

            return (
              <article
                key={quote.id}
                className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${
                  isExpanded
                    ? "border-teal/40 shadow-md ring-1 ring-teal/10"
                    : "border-slate/10 hover:border-teal/25 hover:shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleQuote(quote.id)}
                  aria-expanded={isExpanded}
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isExpanded ? "bg-teal text-white" : "bg-slate/5 text-slate/50"
                      }`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-display text-lg font-bold text-forest">
                            {quote.customerName}
                          </h2>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate/60">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {quote.customerEmail}
                            </span>
                            <span className="text-slate/40">·</span>
                            <span>Requested {formatCreatedAt(quote.createdAt)}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {quote.quotedAmountCents ? (
                            <span className="rounded-lg bg-forest/5 px-2.5 py-1 text-sm font-bold text-forest">
                              {(quote.quotedAmountCents / 100).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[quote.status] ?? "bg-slate/10 text-slate/60"}`}
                          >
                            {STATUS_LABELS[quote.status] ?? quote.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate/70">
                        <span>{serviceSummary(quote.services)}</span>
                        {quote.address ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/40" aria-hidden />
                            {quote.address}
                          </span>
                        ) : null}
                        {preferredTime ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate/40" aria-hidden />
                            {preferredTime}
                          </span>
                        ) : null}
                      </div>

                      {showHold ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Slot hold expires{" "}
                          {new Date(quote.holdExpiresAt!).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>

                {isExpanded && active?.id === quote.id ? (
                  <div className="border-t border-slate/10 bg-cream/30 px-5 py-6">
                    <div className="mb-6">
                      <h3 className="font-display text-lg font-bold text-forest">
                        Review &amp; send quote
                      </h3>
                      <p className="mt-1 text-sm text-slate/60">
                        Customer details are prefilled below. Adjust anything, add your
                        price, then send.
                      </p>
                    </div>

                    {sentSuccess ? (
                      <div
                        ref={successRef}
                        className="mb-6 rounded-2xl border-2 border-teal/40 bg-mint p-5 shadow-sm"
                        role="status"
                        aria-live="polite"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle
                            className="mt-0.5 shrink-0 text-teal"
                            size={28}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-lg font-bold text-forest">
                              Quote sent to customer
                            </p>
                            <p className="mt-1 text-sm text-slate/70">
                              <span className="font-semibold text-forest">
                                {sentSuccess.customerName}
                              </span>{" "}
                              received an email at{" "}
                              <span className="font-medium">{sentSuccess.customerEmail}</span>{" "}
                              with a {formatAmount(sentSuccess.amount)} quote and link to
                              review and accept.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a
                                href={`/quote/${sentSuccess.token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
                              >
                                <ExternalLink size={16} aria-hidden />
                                View customer quote page
                              </a>
                              <button
                                type="button"
                                onClick={() => copyQuoteLink(sentSuccess.token)}
                                className="inline-flex items-center gap-2 rounded-lg border border-teal/30 bg-white px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/5"
                              >
                                <Copy size={16} aria-hidden />
                                {copied ? "Copied!" : "Copy quote link"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {message ? (
                      <p className="mb-4 rounded-lg bg-mint px-4 py-2 text-sm text-forest">
                        {message}
                      </p>
                    ) : null}
                    {error ? (
                      <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
                        {error}
                      </p>
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate/10 bg-white p-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate/50">
                          Customer request
                        </h4>
                        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-slate/50">Name</dt>
                            <dd className="mt-0.5 font-medium text-forest">
                              {active.customerName}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate/50">Email</dt>
                            <dd className="mt-0.5">
                              <a
                                href={`mailto:${active.customerEmail}`}
                                className="text-teal hover:underline"
                              >
                                {active.customerEmail}
                              </a>
                            </dd>
                          </div>
                          {active.customerPhone ? (
                            <div>
                              <dt className="text-xs text-slate/50">Phone</dt>
                              <dd className="mt-0.5">
                                <a
                                  href={`tel:${active.customerPhone.replace(/\D/g, "")}`}
                                  className="text-teal hover:underline"
                                >
                                  {active.customerPhone}
                                </a>
                              </dd>
                            </div>
                          ) : null}
                          {active.address ? (
                            <div className={active.customerPhone ? "" : "sm:col-span-2"}>
                              <dt className="text-xs text-slate/50">Address</dt>
                              <dd className="mt-0.5">{active.address}</dd>
                            </div>
                          ) : null}
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-slate/50">Services requested</dt>
                            <dd className="mt-0.5">{serviceSummary(active.services)}</dd>
                          </div>
                          {formatPreferredTime(active) ? (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-slate/50">Preferred time</dt>
                              <dd className="mt-0.5">{formatPreferredTime(active)}</dd>
                            </div>
                          ) : null}
                          {active.message ? (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-slate/50">Notes</dt>
                              <dd className="mt-0.5 whitespace-pre-wrap rounded-lg bg-cream/60 p-3 text-sm text-slate/70">
                                {active.message}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>

                      {active.status === "PENDING" || active.status === "QUOTED" ? (
                        <div className="rounded-xl border border-slate/10 bg-white p-5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate/50">
                            Your quote
                          </h4>

                          <div className="mt-4 space-y-4">
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
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                      form.services.includes(s.id)
                                        ? "bg-teal text-white"
                                        : "bg-mint text-forest hover:bg-teal/10"
                                    }`}
                                  >
                                    {s.title}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <label className="block text-sm">
                              <span className="font-semibold text-forest">
                                Quote amount ($){" "}
                                <span className="text-red-600">*</span>
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={form.amount}
                                onChange={(e) =>
                                  setForm({ ...form, amount: e.target.value })
                                }
                                className="form-input mt-1"
                                placeholder="250.00"
                                required
                              />
                            </label>

                            <label className="block text-sm">
                              <span className="text-slate/60">
                                Notes for customer (optional)
                              </span>
                              <textarea
                                rows={3}
                                value={form.quoteNotes}
                                onChange={(e) =>
                                  setForm({ ...form, quoteNotes: e.target.value })
                                }
                                className="form-input mt-1"
                                placeholder="Any details about scope, access, or timing…"
                              />
                            </label>

                            <div>
                              <p className="text-sm font-semibold text-forest">
                                Proposed schedule
                              </p>
                              <p className="mt-1 text-xs text-slate/50">
                                Prefilled from the customer&apos;s preferred time. Change if
                                needed, or clear the date to let them pick when accepting.
                              </p>
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <label className="block text-sm sm:col-span-3">
                                  <span className="text-slate/60">Date</span>
                                  <input
                                    type="date"
                                    value={form.proposedDate}
                                    onChange={(e) =>
                                      setForm({ ...form, proposedDate: e.target.value })
                                    }
                                    className="form-input mt-1"
                                  />
                                </label>
                                <label className="block text-sm">
                                  <span className="text-slate/60">Start</span>
                                  <input
                                    type="time"
                                    value={form.proposedStartTime}
                                    onChange={(e) =>
                                      setForm({
                                        ...form,
                                        proposedStartTime: e.target.value,
                                      })
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
                                      setForm({
                                        ...form,
                                        proposedEndTime: e.target.value,
                                      })
                                    }
                                    className="form-input mt-1"
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-slate/10 pt-4">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={submitQuote}
                                className="touch-target rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                              >
                                {pending
                                  ? "Sending…"
                                  : active.status === "QUOTED"
                                    ? "Resend quote to customer"
                                    : "Send quote to customer"}
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
                                        e instanceof Error
                                          ? e.message
                                          : "Could not release hold."
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
                        </div>
                      ) : (
                        <div className="flex items-center rounded-xl border border-slate/10 bg-white p-5">
                          <p className="text-sm text-slate/60">
                            This quote has been {active.status.toLowerCase()}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {slotConflict ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) {
              setSlotConflict(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-conflict-title"
            className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl"
          >
            <h3
              id="slot-conflict-title"
              className="font-display text-lg font-bold text-forest"
            >
              Time slot conflict
            </h3>
            <p className="mt-3 text-sm text-slate/70">{slotConflict}</p>
            <p className="mt-2 text-sm text-slate/70">
              The customer will still receive the quote with this proposed time. Send
              anyway?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => setSlotConflict(null)}
                className="rounded-lg border border-slate/15 px-4 py-2 text-sm font-semibold text-slate/70 hover:bg-slate/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => sendQuoteRequest(true)}
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send quote anyway"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
