"use client";

import {
  addBlockedDate,
  removeBlockedDate,
  updateAvailabilityRule,
  updateSlotDuration,
} from "@/lib/actions/admin";
import { useState, useTransition } from "react";

interface Rule {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface Blocked {
  id: string;
  date: string;
  reason: string | null;
}

export function AvailabilityManager({
  rules,
  blocked,
  slotDurationMinutes,
}: {
  rules: Rule[];
  blocked: Blocked[];
  slotDurationMinutes: number;
}) {
  const [pending, startTransition] = useTransition();
  const [localRules, setLocalRules] = useState(rules);
  const [duration, setDuration] = useState(slotDurationMinutes);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [message, setMessage] = useState("");

  const saveRule = (dayOfWeek: number) => {
    const rule = localRules.find((r) => r.dayOfWeek === dayOfWeek);
    if (!rule) return;
    startTransition(async () => {
      await updateAvailabilityRule(dayOfWeek, {
        startTime: rule.startTime,
        endTime: rule.endTime,
        enabled: rule.enabled,
      });
      setMessage("Hours saved.");
    });
  };

  const saveDuration = () => {
    startTransition(async () => {
      try {
        await updateSlotDuration(duration);
        setMessage("Slot duration updated.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Error saving duration.");
      }
    });
  };

  const addBlock = () => {
    if (!blockDate) return;
    startTransition(async () => {
      await addBlockedDate(blockDate, blockReason || undefined);
      setBlockDate("");
      setBlockReason("");
      setMessage("Date blocked.");
    });
  };

  const removeBlock = (id: string) => {
    startTransition(async () => {
      await removeBlockedDate(id);
      setMessage("Block removed.");
    });
  };

  return (
    <div className="mt-8 space-y-10">
      {message ? (
        <p className="rounded-lg bg-mint px-4 py-2 text-sm text-forest">
          {message}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          Appointment length
        </h2>
        <p className="mt-1 text-sm text-slate/60">
          How long each booking slot lasts (minutes).
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="number"
            min={60}
            max={480}
            step={30}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-32 rounded-lg border border-slate/20 px-3 py-2"
          />
          <button
            type="button"
            disabled={pending}
            onClick={saveDuration}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          Weekly hours
        </h2>
        <ul className="mt-4 space-y-4">
          {localRules.map((rule) => (
            <li
              key={rule.dayOfWeek}
              className="flex flex-wrap items-center gap-4 border-b border-slate/5 pb-4 last:border-0"
            >
              <label className="flex w-32 items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) =>
                    setLocalRules((prev) =>
                      prev.map((r) =>
                        r.dayOfWeek === rule.dayOfWeek
                          ? { ...r, enabled: e.target.checked }
                          : r
                      )
                    )
                  }
                />
                <span className="text-sm font-semibold">{rule.dayName}</span>
              </label>
              <input
                type="time"
                value={rule.startTime}
                disabled={!rule.enabled}
                onChange={(e) =>
                  setLocalRules((prev) =>
                    prev.map((r) =>
                      r.dayOfWeek === rule.dayOfWeek
                        ? { ...r, startTime: e.target.value }
                        : r
                    )
                  )
                }
                className="rounded-lg border border-slate/20 px-2 py-1 text-sm disabled:opacity-40"
              />
              <span className="text-slate/40">to</span>
              <input
                type="time"
                value={rule.endTime}
                disabled={!rule.enabled}
                onChange={(e) =>
                  setLocalRules((prev) =>
                    prev.map((r) =>
                      r.dayOfWeek === rule.dayOfWeek
                        ? { ...r, endTime: e.target.value }
                        : r
                    )
                  )
                }
                className="rounded-lg border border-slate/20 px-2 py-1 text-sm disabled:opacity-40"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => saveRule(rule.dayOfWeek)}
                className="ml-auto rounded-lg border border-teal px-3 py-1 text-sm font-semibold text-teal hover:bg-mint disabled:opacity-50"
              >
                Save
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          Blocked dates
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="date"
            value={blockDate}
            onChange={(e) => setBlockDate(e.target.value)}
            className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="flex-1 min-w-[160px] rounded-lg border border-slate/20 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending || !blockDate}
            onClick={addBlock}
            className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Block date
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {blocked.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg bg-slate/5 px-4 py-2 text-sm"
            >
              <span>
                {b.date}
                {b.reason ? ` — ${b.reason}` : ""}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => removeBlock(b.id)}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
          {blocked.length === 0 ? (
            <li className="text-sm text-slate/50">No blocked dates.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
