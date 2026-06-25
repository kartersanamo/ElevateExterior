"use client";

import { useState } from "react";
import { CalendarScheduler } from "@/components/calendar/CalendarScheduler";
import { Button } from "@/components/ui/Button";
import { formatDateLong, formatTime12 } from "@/lib/scheduling/dates";
import { services, site } from "@/lib/site-config";
import type { QuoteRequestFormData } from "@/lib/validators/contact";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";

type Step = "services" | "schedule" | "details" | "done";

export function BookingWizard() {
  const [step, setStep] = useState<Step>("services");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    notes: "",
  });

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const submitQuoteRequest = async () => {
    if (!selectedSlot || !selectedDate) return;

    setLoading(true);
    setError("");

    const payload: QuoteRequestFormData = {
      ...form,
      services: selectedServices,
      scheduledDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      website: "",
    };

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Quote request failed. Please try again.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again or call us.");
    } finally {
      setLoading(false);
    }
  };

  const steps: Step[] = ["services", "schedule", "details"];
  const stepIndex = steps.indexOf(step as (typeof steps)[number]);

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-teal/30 bg-mint p-8 text-center">
        <CheckCircle className="mx-auto text-teal" size={48} aria-hidden />
        <h2 className="mt-4 font-display text-2xl font-bold text-forest">
          Quote request received!
        </h2>
        <p className="mt-3 text-slate/70">
          We&apos;ll review your request and send a personalized quote within
          24 hours. A confirmation email is on its way to {form.customerEmail}.
        </p>
        <p className="mt-4 text-sm text-slate/60">
          Questions? Call{" "}
          <a href={site.phoneHref} className="font-semibold text-teal">
            {site.phone}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              i <= stepIndex ? "bg-teal" : "bg-slate/10"
            }`}
            aria-hidden
          />
        ))}
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0" aria-hidden />
          {error}
        </div>
      ) : null}

      {step === "services" ? (
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            What services do you need?
          </h2>
          <p className="mt-2 text-slate/70">Select all that apply.</p>
          <ul className="mt-6 space-y-3">
            {services.map((service) => {
              const selected = selectedServices.includes(service.id);
              return (
                <li key={service.id}>
                  <button
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-teal bg-mint"
                        : "border-slate/10 bg-white hover:border-teal/40"
                    }`}
                  >
                    <span className="font-semibold text-forest">
                      {service.title}
                    </span>
                    <p className="mt-1 text-sm text-slate/70">
                      {service.shortDescription}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setStep("schedule")}
              disabled={selectedServices.length === 0}
            >
              Pick a preferred date & time
            </Button>
          </div>
        </div>
      ) : null}

      {step === "schedule" ? (
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Pick a preferred date & time
          </h2>
          <p className="mt-2 text-slate/70">
            Green days have openings. This is your preferred time — we&apos;ll
            confirm availability when we send your quote.
          </p>

          <div className="mt-6">
            <CalendarScheduler
              mode="book"
              onSlotSelect={(date, slot) => {
                setSelectedDate(date);
                setSelectedSlot(slot);
              }}
            />
          </div>

          {selectedDate && selectedSlot ? (
            <p className="mt-4 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-forest">
              Preferred: {formatDateLong(selectedDate)} at{" "}
              {formatTime12(selectedSlot.startTime)} –{" "}
              {formatTime12(selectedSlot.endTime)}
            </p>
          ) : null}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep("services")}>
              <ChevronLeft className="mr-1" size={18} aria-hidden />
              Back
            </Button>
            <Button
              onClick={() => setStep("details")}
              disabled={!selectedDate || !selectedSlot}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "details" ? (
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold text-forest">
            Your details
          </h2>
          {selectedDate && selectedSlot ? (
            <p className="mt-2 text-slate/70">
              {formatDateLong(selectedDate)} ·{" "}
              {formatTime12(selectedSlot.startTime)} –{" "}
              {formatTime12(selectedSlot.endTime)}
            </p>
          ) : null}
          <div className="mt-6 space-y-4">
            {(
              [
                ["customerName", "Full name", "text"],
                ["customerEmail", "Email", "email"],
                ["customerPhone", "Phone", "tel"],
                ["address", "Service address", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-semibold">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate/20 bg-white px-4 py-3 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                  required
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Notes <span className="font-normal text-slate/50">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full rounded-lg border border-slate/20 bg-white px-4 py-3 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder="Project details, gate code, access instructions…"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep("schedule")}>
              <ChevronLeft className="mr-1" size={18} aria-hidden />
              Back
            </Button>
            <Button
              onClick={submitQuoteRequest}
              disabled={
                loading ||
                !form.customerName ||
                !form.customerEmail ||
                !form.customerPhone ||
                !form.address
              }
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} aria-hidden />
              ) : (
                "Request quote"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
