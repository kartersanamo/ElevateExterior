"use client";

import {
  createRecurringService,
  deleteRecurringService,
  updateRecurringService,
} from "@/lib/actions/recurring";
import {
  RECURRING_FREQUENCY_OPTIONS,
  frequencyLabel,
} from "@/lib/recurring";
import { services } from "@/lib/site-config";
import type { RecurringFrequency } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface RecurringRow {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  address: string;
  services: string;
  frequency: RecurringFrequency;
  active: boolean;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  notes: string | null;
}

export function RecurringManager({ rows }: { rows: RecurringRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    services: [] as string[],
    frequency: "MONTHLY" as RecurringFrequency,
    notes: "",
  });

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id)
        ? f.services.filter((s) => s !== id)
        : [...f.services, id],
    }));
  };

  const create = () => {
    startTransition(async () => {
      await createRecurringService(form);
      setShowForm(false);
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        address: "",
        services: [],
        frequency: "MONTHLY",
        notes: "",
      });
      router.refresh();
    });
  };

  const serviceLabels = (json: string) => {
    try {
      const ids = JSON.parse(json) as string[];
      return ids.map((id) => services.find((s) => s.id === id)?.title ?? id).join(", ");
    } catch {
      return json;
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white"
      >
        {showForm ? "Cancel" : "Add recurring customer"}
      </button>

      {showForm ? (
        <section className="rounded-2xl border border-slate/10 bg-white p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Customer name"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
            />
            <select
              value={form.frequency}
              onChange={(e) =>
                setForm({ ...form, frequency: e.target.value as RecurringFrequency })
              }
              className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
            >
              {RECURRING_FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              placeholder="Service address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="rounded-lg border border-slate/20 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  form.services.includes(s.id) ? "bg-teal text-white" : "bg-mint text-forest"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={create}
            className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save recurring service
          </button>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-slate/60">No recurring services yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-slate/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-bold text-forest">
                    {row.customerName}
                  </p>
                  <p className="text-sm text-slate/70">{row.customerEmail}</p>
                  <p className="mt-2 text-sm">{serviceLabels(row.services)}</p>
                  <p className="text-sm text-slate/60">{row.address}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-teal">{frequencyLabel(row.frequency)}</p>
                  <p className="text-slate/60">
                    Next:{" "}
                    {row.nextServiceDate
                      ? new Date(row.nextServiceDate).toLocaleDateString()
                      : "—"}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.active ? "bg-forest/10 text-forest" : "bg-slate/10 text-slate/60"
                    }`}
                  >
                    {row.active ? "Active" : "Paused"}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateRecurringService(row.id, { active: !row.active });
                      router.refresh();
                    })
                  }
                  className="text-sm font-semibold text-teal hover:underline disabled:opacity-50"
                >
                  {row.active ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Remove this recurring service?")) {
                      startTransition(async () => {
                        await deleteRecurringService(row.id);
                        router.refresh();
                      });
                    }
                  }}
                  className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
