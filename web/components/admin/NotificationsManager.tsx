"use client";

import { updateNotificationPreference } from "@/lib/actions/notifications";
import {
  ADMIN_NOTIFICATION_CATEGORY_LABELS,
  ADMIN_NOTIFICATION_DEFINITIONS,
  type AdminNotificationCategory,
} from "@/lib/admin-notifications";
import type { AdminNotificationEvent } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PreferenceRow = {
  event: AdminNotificationEvent;
  enabled: boolean;
};

const CATEGORY_ORDER: AdminNotificationCategory[] = [
  "inquiries",
  "quotes",
  "bookings",
  "payments",
];

export function NotificationsManager({
  email,
  preferences,
}: {
  email: string;
  preferences: PreferenceRow[];
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

  const toggle = (event: AdminNotificationEvent, enabled: boolean) => {
    setError("");
    setMessage("");
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

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: ADMIN_NOTIFICATION_CATEGORY_LABELS[category],
    items: ADMIN_NOTIFICATION_DEFINITIONS.filter(
      (definition) => definition.category === category
    ),
  }));

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
                <li
                  key={item.event}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
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
                    <span aria-hidden>{localPrefs[item.event] ? "On" : "Off"}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
