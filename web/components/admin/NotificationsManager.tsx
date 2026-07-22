"use client";

import { formatReminderOffsetLabel } from "@/lib/booking-reminder-format";
import type { AdminNotificationEvent } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addBookingReminderOffset,
  removeBookingReminderOffset,
  updateNotificationPreference,
} from "@/lib/actions/notifications";
import {
  ADMIN_NOTIFICATION_CATEGORY_LABELS,
  ADMIN_NOTIFICATION_DEFINITIONS,
  type AdminNotificationCategory,
} from "@/lib/admin-notifications";

type PreferenceRow = {
  event: AdminNotificationEvent;
  enabled: boolean;
};

type ReminderOffsetRow = {
  id: string;
  minutesBefore: number | null;
  dayOf: boolean;
  dayOfAtTime: string;
};

const CATEGORY_ORDER: AdminNotificationCategory[] = [
  "inquiries",
  "quotes",
  "bookings",
  "payments",
];

const PRESET_BEFORE = [
  { label: "5 min before", amount: 5, unit: "minutes" as const },
  { label: "15 min before", amount: 15, unit: "minutes" as const },
  { label: "1 hour before", amount: 1, unit: "hours" as const },
  { label: "24 hours before", amount: 24, unit: "hours" as const },
];

export function NotificationsManager({
  email,
  preferences,
  reminderOffsets,
}: {
  email: string;
  preferences: PreferenceRow[];
  reminderOffsets: ReminderOffsetRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [localPrefs, setLocalPrefs] = useState(() =>
    Object.fromEntries(preferences.map((pref) => [pref.event, pref.enabled])) as Record<
      AdminNotificationEvent,
      boolean
    >
  );
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [dayOfAtTime, setDayOfAtTime] = useState("07:00");

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const toggle = (event: AdminNotificationEvent, enabled: boolean) => {
    clearStatus();
    setLocalPrefs((current) => ({ ...current, [event]: enabled }));

    startTransition(async () => {
      try {
        await updateNotificationPreference(event, enabled);
        setMessage("Notification preferences saved.");
        router.refresh();
      } catch (e) {
        setLocalPrefs((current) => ({ ...current, [event]: !enabled }));
        setError(e instanceof Error ? e.message : "Could not save preference.");
      }
    });
  };

  const addBefore = (nextAmount: number, nextUnit: "minutes" | "hours" | "days") => {
    clearStatus();
    startTransition(async () => {
      try {
        await addBookingReminderOffset({
          kind: "before",
          amount: nextAmount,
          unit: nextUnit,
        });
        setLocalPrefs((current) => ({ ...current, BOOKING_REMINDER: true }));
        setMessage("Reminder timing added.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add reminder.");
      }
    });
  };

  const addDayOf = () => {
    clearStatus();
    startTransition(async () => {
      try {
        await addBookingReminderOffset({
          kind: "dayOf",
          dayOfAtTime,
        });
        setLocalPrefs((current) => ({ ...current, BOOKING_REMINDER: true }));
        setMessage("Day-of reminder added.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add reminder.");
      }
    });
  };

  const removeOffset = (offsetId: string) => {
    clearStatus();
    startTransition(async () => {
      try {
        await removeBookingReminderOffset(offsetId);
        setMessage("Reminder timing removed.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove reminder.");
      }
    });
  };

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: ADMIN_NOTIFICATION_CATEGORY_LABELS[category],
    items: ADMIN_NOTIFICATION_DEFINITIONS.filter(
      (definition) => definition.category === category
    ),
  }));

  const remindersEnabled = localPrefs.BOOKING_REMINDER ?? false;

  return (
    <div className="mt-8 space-y-8">
      {message ? (
        <p className="rounded-lg bg-mint px-4 py-2 text-sm text-forest">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <p className="text-sm text-slate/70">
        Choose which admin alerts are sent to <strong className="text-forest">{email}</strong>.
      </p>

      <div className="space-y-6">
        {grouped.map(({ category, label, items }) => (
          <section
            key={category}
            className="rounded-2xl border border-slate/10 bg-white p-6"
          >
            <h2 className="font-display text-lg font-bold text-forest">{label}</h2>
            <ul className="mt-4 divide-y divide-slate/10">
              {items.map((item) => (
                <li key={item.event} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-forest">{item.label}</p>
                      <p className="mt-1 text-sm text-slate/60">{item.description}</p>
                    </div>
                    <label className="flex shrink-0 items-center gap-2 text-sm text-slate/70">
                      <input
                        type="checkbox"
                        checked={localPrefs[item.event] ?? true}
                        disabled={pending}
                        onChange={(e) => toggle(item.event, e.target.checked)}
                        className="size-4 rounded border-slate/30 text-forest focus:ring-forest"
                      />
                      <span className="sr-only">{item.label}</span>
                      <span aria-hidden>
                        {localPrefs[item.event] ? "On" : "Off"}
                      </span>
                    </label>
                  </div>

                  {item.event === "BOOKING_REMINDER" && remindersEnabled ? (
                    <div className="mt-4 space-y-4 rounded-xl border border-slate/10 bg-cream/40 p-4">
                      {reminderOffsets.length > 0 ? (
                        <ul className="space-y-2">
                          {reminderOffsets.map((offset) => (
                            <li
                              key={offset.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="text-forest">
                                {formatReminderOffsetLabel(offset)}
                              </span>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => removeOffset(offset.id)}
                                className="text-slate/60 underline-offset-2 hover:text-forest hover:underline disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate/60">
                          No reminder times yet. Add at least one below.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {PRESET_BEFORE.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            disabled={pending}
                            onClick={() => addBefore(preset.amount, preset.unit)}
                            className="rounded-lg border border-slate/20 bg-white px-3 py-1.5 text-sm text-forest hover:border-forest/40 disabled:opacity-50"
                          >
                            {preset.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={addDayOf}
                          className="rounded-lg border border-slate/20 bg-white px-3 py-1.5 text-sm text-forest hover:border-forest/40 disabled:opacity-50"
                        >
                          Day of
                        </button>
                      </div>

                      <div className="flex flex-wrap items-end gap-3 border-t border-slate/10 pt-4">
                        <label className="text-sm text-slate/70">
                          Custom
                          <span className="mt-1 flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={amount}
                              disabled={pending}
                              onChange={(e) =>
                                setAmount(Number.parseInt(e.target.value, 10) || 0)
                              }
                              className="w-20 rounded-lg border border-slate/20 px-2 py-1.5 text-forest"
                            />
                            <select
                              value={unit}
                              disabled={pending}
                              onChange={(e) =>
                                setUnit(e.target.value as "minutes" | "hours" | "days")
                              }
                              className="rounded-lg border border-slate/20 px-2 py-1.5 text-forest"
                            >
                              <option value="minutes">minutes before</option>
                              <option value="hours">hours before</option>
                              <option value="days">days before</option>
                            </select>
                          </span>
                        </label>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => addBefore(amount, unit)}
                          className="rounded-lg bg-forest px-3 py-1.5 text-sm text-white hover:bg-forest/90 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>

                      <label className="block text-sm text-slate/70">
                        Day-of send time
                        <input
                          type="time"
                          value={dayOfAtTime}
                          disabled={pending}
                          onChange={(e) => setDayOfAtTime(e.target.value)}
                          className="mt-1 block rounded-lg border border-slate/20 px-2 py-1.5 text-forest"
                        />
                        <span className="mt-1 block text-xs text-slate/50">
                          Used when you add a “Day of” reminder (default 7:00 AM).
                        </span>
                      </label>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
