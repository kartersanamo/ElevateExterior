"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services, site } from "@/lib/site-config";
import type { BookingFormData } from "@/lib/validators/contact";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

type Step = "services" | "date" | "time" | "details" | "done";

function formatTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function BookingWizard() {
  const [step, setStep] = useState<Step>("services");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    notes: "",
  });

  const loadDates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/availability");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAvailableDates(data.dates ?? []);
    } catch {
      setError("Could not load available dates. Please call us to book.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "date") {
      loadDates();
    }
  }, [step, loadDates]);

  const loadSlots = async (date: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/availability?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlots(data.slots ?? []);
      if ((data.slots ?? []).length === 0) {
        setError("No open slots on this date. Please pick another day.");
      }
    } catch {
      setError("Could not load time slots.");
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const submitBooking = async () => {
    if (!selectedSlot || !selectedDate) return;

    setLoading(true);
    setError("");

    const payload: BookingFormData = {
      ...form,
      services: selectedServices,
      scheduledDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      website: "",
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Booking failed. Please try again.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again or call us.");
    } finally {
      setLoading(false);
    }
  };

  const steps: Step[] = ["services", "date", "time", "details"];
  const stepIndex = steps.indexOf(step as (typeof steps)[number]);

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-teal/30 bg-mint p-8 text-center">
        <CheckCircle className="mx-auto text-teal" size={48} aria-hidden />
        <h2 className="mt-4 font-display text-2xl font-bold text-forest">
          Request received!
        </h2>
        <p className="mt-3 text-slate/70">
          We&apos;ll confirm your appointment within 24 hours. A confirmation
          email is on its way to {form.customerEmail}.
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
    <div className="mx-auto max-w-2xl">
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
            What would you like cleaned?
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
              onClick={() => setStep("date")}
              disabled={selectedServices.length === 0}
            >
              Continue
              <ChevronRight className="ml-1" size={18} aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {step === "date" ? (
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Pick a date
          </h2>
          <p className="mt-2 text-slate/70">
            Available days within the next {site.bookingHorizonDays} days.
          </p>
          {loading ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="animate-spin text-teal" size={32} aria-hidden />
            </div>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {availableDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    setStep("time");
                    loadSlots(date);
                  }}
                  className="rounded-xl border border-slate/10 bg-white p-4 text-left transition-colors hover:border-teal hover:bg-mint"
                >
                  {formatDateLabel(date)}
                </button>
              ))}
              {availableDates.length === 0 && !loading ? (
                <p className="text-slate/70 sm:col-span-2">
                  No dates available right now. Please{" "}
                  <a href={site.phoneHref} className="text-teal font-semibold">
                    call us
                  </a>{" "}
                  to schedule.
                </p>
              ) : null}
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep("services")}>
              <ChevronLeft className="mr-1" size={18} aria-hidden />
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === "time" ? (
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Pick a time
          </h2>
          <p className="mt-2 text-slate/70">{formatDateLabel(selectedDate)}</p>
          {loading ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="animate-spin text-teal" size={32} aria-hidden />
            </div>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={`${slot.startTime}-${slot.endTime}`}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep("details");
                  }}
                  className="rounded-xl border border-slate/10 bg-white p-4 font-semibold text-forest transition-colors hover:border-teal hover:bg-mint"
                >
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </button>
              ))}
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep("date")}>
              <ChevronLeft className="mr-1" size={18} aria-hidden />
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === "details" ? (
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">
            Your details
          </h2>
          <p className="mt-2 text-slate/70">
            {formatDateLabel(selectedDate)} ·{" "}
            {selectedSlot
              ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`
              : ""}
          </p>
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
                placeholder="Gate code, pets, special requests…"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep("time")}>
              <ChevronLeft className="mr-1" size={18} aria-hidden />
              Back
            </Button>
            <Button
              onClick={submitBooking}
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
                "Submit request"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
