"use client";

import { deleteCustomer, updateCustomerNotes } from "@/lib/actions/customers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface CustomerRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  source: string;
  notes: string | null;
  createdAt: string;
  bookingCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  lastBookingDate: string | null;
  lastStatus: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  booking: "Booking",
  contact: "Contact form",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-teal/10 text-teal",
  CANCELLED: "bg-slate/10 text-slate/60",
  COMPLETED: "bg-forest/10 text-forest",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomersManager({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "booking" | "contact">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    if (filter !== "all" && c.source !== filter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone?.toLowerCase().includes(q) ?? false)
    );
  });

  const run = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-slate/20 px-3 py-2 text-sm"
        />
        {(["all", "booking", "contact"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              filter === f
                ? "bg-teal text-white"
                : "border border-slate/10 bg-white text-slate/70"
            }`}
          >
            {f === "all" ? "All" : SOURCE_LABELS[f]}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate/60">
        {filtered.length} customer{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="text-slate/60">No customers yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-slate/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-forest">
                    {c.name}
                  </h2>
                  <p className="text-sm text-slate/70">
                    <a href={`mailto:${c.email}`} className="text-teal hover:underline">
                      {c.email}
                    </a>
                    {c.phone ? (
                      <>
                        {" · "}
                        <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="text-teal hover:underline">
                          {c.phone}
                        </a>
                      </>
                    ) : null}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate/10 px-2.5 py-0.5 text-xs font-semibold text-slate/70">
                      {SOURCE_LABELS[c.source] ?? c.source}
                    </span>
                    {c.lastStatus ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[c.lastStatus] ?? ""}`}
                      >
                        Last: {c.lastStatus.toLowerCase()}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-forest">{c.bookingCount} booking{c.bookingCount === 1 ? "" : "s"}</p>
                  {c.bookingCount > 0 ? (
                    <p className="text-slate/60">
                      {c.pendingCount} pending · {c.confirmedCount} confirmed · {c.completedCount} done
                    </p>
                  ) : null}
                  <p className="text-slate/50">Last visit: {formatDate(c.lastBookingDate)}</p>
                </div>
              </div>

              {c.address ? (
                <p className="mt-2 text-sm text-slate/70">{c.address}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="text-sm font-semibold text-teal hover:underline"
                >
                  {expandedId === c.id ? "Hide notes" : "Notes"}
                </button>
                <Link
                  href={`/admin/bookings?status=ALL`}
                  className="text-sm font-semibold text-teal hover:underline"
                >
                  View bookings
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Remove ${c.name} from the customer list?`)) {
                      run(() => deleteCustomer(c.id));
                    }
                  }}
                  className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              {expandedId === c.id ? (
                <div className="mt-3">
                  <textarea
                    defaultValue={c.notes ?? ""}
                    rows={3}
                    placeholder="Internal notes about this customer…"
                    className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
                    onBlur={(e) => {
                      if (e.target.value !== (c.notes ?? "")) {
                        run(() => updateCustomerNotes(c.id, e.target.value));
                      }
                    }}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
