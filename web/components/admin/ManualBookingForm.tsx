"use client";

import { createManualBooking } from "@/lib/actions/admin";
import { site, services } from "@/lib/site-config";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate/15 bg-white px-3 py-2 text-sm text-forest focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20";

function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function ManualBookingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ name: string; email: string } | null>(
    null
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    notes: "",
    scheduledDate: "",
    startTime: "09:00",
    endTime: addHoursToTime("09:00", site.slotDurationMinutes / 60),
  });

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const updateStartTime = (startTime: string) => {
    setForm((f) => ({
      ...f,
      startTime,
      endTime: addHoursToTime(startTime, site.slotDurationMinutes / 60),
    }));
  };

  const resetForm = () => {
    setForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      notes: "",
      scheduledDate: "",
      startTime: "09:00",
      endTime: addHoursToTime("09:00", site.slotDurationMinutes / 60),
    });
    setSelectedServices([]);
    setSuccess(null);
    setError("");
  };

  const submit = () => {
    setError("");
    setSuccess(null);

    if (selectedServices.length === 0) {
      setError("Select at least one service.");
      return;
    }

    startTransition(async () => {
      try {
        await createManualBooking({
          ...form,
          services: selectedServices,
        });
        setSuccess({
          name: form.customerName,
          email: form.customerEmail,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create booking.");
      }
    });
  };

  if (success) {
    return (
      <section className="rounded-2xl border border-teal/30 bg-mint p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="shrink-0 text-teal" size={28} aria-hidden />
          <div>
            <h2 className="font-display text-lg font-bold text-forest">
              Booking confirmed &amp; email sent
            </h2>
            <p className="mt-1 text-sm text-slate/70">
              <span className="font-semibold text-forest">{success.name}</span>{" "}
              will receive a confirmation at{" "}
              <span className="font-medium">{success.email}</span>.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
            >
              Add another booking
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate/10 bg-white p-6">
      <h2 className="font-display text-xl font-bold text-forest">
        Add booking manually
      </h2>
      <p className="mt-1 text-sm text-slate/60">
        Enter customer details and schedule a job. The customer gets a
        confirmation email automatically.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-forest">Customer name</span>
          <input
            type="text"
            value={form.customerName}
            onChange={(e) =>
              setForm({ ...form, customerName: e.target.value })
            }
            className={inputClass}
            placeholder="Jane Doe"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-forest">Email</span>
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) =>
              setForm({ ...form, customerEmail: e.target.value })
            }
            className={inputClass}
            placeholder="customer@email.com"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-forest">Phone</span>
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(e) =>
              setForm({ ...form, customerPhone: e.target.value })
            }
            className={inputClass}
            placeholder="(832) 555-1234"
            required
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-forest">Service address</span>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass}
            placeholder="123 Main St, Houston, TX"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-forest">Date</span>
          <input
            type="date"
            value={form.scheduledDate}
            onChange={(e) =>
              setForm({ ...form, scheduledDate: e.target.value })
            }
            className={inputClass}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-medium text-forest">Start</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => updateStartTime(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-forest">End</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className={inputClass}
              required
            />
          </label>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-forest">Services</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {services.map((service) => {
            const selected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  selected
                    ? "bg-teal text-white"
                    : "border border-slate/15 bg-cream text-slate/70 hover:border-teal/40"
                }`}
              >
                {service.title}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-6 block text-sm">
        <span className="font-medium text-forest">Notes (optional)</span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className={inputClass}
          placeholder="Gate code, special requests…"
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" size={18} aria-hidden />
            Booking…
          </>
        ) : (
          "Book & send confirmation"
        )}
      </button>
    </section>
  );
}
