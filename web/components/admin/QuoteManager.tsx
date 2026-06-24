"use client";

import { sendQuote } from "@/lib/actions/quotes";
import { services } from "@/lib/site-config";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  QUOTED: "bg-teal/10 text-teal",
  ACCEPTED: "bg-forest/10 text-forest",
  DECLINED: "bg-slate/10 text-slate/60",
};

export function QuoteManager({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(
    quotes.find((q) => q.status === "PENDING")?.id ?? null
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const active = quotes.find((q) => q.id === activeId);

  const [form, setForm] = useState({
    amount: "",
    services: [] as string[],
    quoteNotes: "",
    proposedDate: "",
    proposedStartTime: "",
    proposedEndTime: "",
  });

  const selectQuote = (quote: QuoteRow) => {
    setActiveId(quote.id);
    setError("");
    setMessage("");
    let serviceIds: string[] = [];
    try {
      serviceIds = JSON.parse(quote.services) as string[];
    } catch {
      serviceIds = [];
    }
    setForm({
      amount: quote.quotedAmountCents
        ? (quote.quotedAmountCents / 100).toFixed(2)
        : "",
      services: serviceIds,
      quoteNotes: quote.quoteNotes ?? "",
      proposedDate: quote.proposedDate?.slice(0, 10) ?? "",
      proposedStartTime: quote.proposedStartTime ?? "",
      proposedEndTime: quote.proposedEndTime ?? "",
    });
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
              <p className="mt-2 line-clamp-2 text-sm text-slate/70">{quote.message}</p>
            </button>
          ))
        )}
      </section>

      {active ? (
        <section className="rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">Send quote</h2>
          <p className="mt-1 text-sm text-slate/60">{active.customerName}</p>
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate/5 p-4 text-sm">
            {active.message}
          </p>

          {message ? (
            <p className="mt-4 rounded-lg bg-mint px-4 py-2 text-sm text-forest">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          {active.status === "PENDING" || active.status === "QUOTED" ? (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-forest">Services</p>
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
                <span className="text-slate/60">Quote amount ($)</span>
                <input
                  type="text"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
                  placeholder="250.00"
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate/60">Notes for customer (optional)</span>
                <textarea
                  rows={3}
                  value={form.quoteNotes}
                  onChange={(e) => setForm({ ...form, quoteNotes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm sm:col-span-3">
                  <span className="text-slate/60">Proposed date (optional)</span>
                  <input
                    type="date"
                    value={form.proposedDate}
                    onChange={(e) => setForm({ ...form, proposedDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate/60">Start</span>
                  <input
                    type="time"
                    value={form.proposedStartTime}
                    onChange={(e) => setForm({ ...form, proposedStartTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate/60">End</span>
                  <input
                    type="time"
                    value={form.proposedEndTime}
                    onChange={(e) => setForm({ ...form, proposedEndTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
                  />
                </label>
              </div>
              <p className="text-xs text-slate/50">
                Leave date blank if the customer should pick a time when they accept.
              </p>

              <button
                type="button"
                disabled={pending}
                onClick={submitQuote}
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send quote to customer"}
              </button>
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
