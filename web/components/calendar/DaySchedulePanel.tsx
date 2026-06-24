"use client";

import { formatDateLong, formatTime12 } from "@/lib/scheduling/dates";
import type { DayScheduleSlot } from "@/lib/scheduling/slots";
import { Ban, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";

interface DaySchedulePanelProps {
  date: string;
  slots: DayScheduleSlot[];
  loading?: boolean;
  mode: "book" | "admin";
  selectedSlot?: { startTime: string; endTime: string } | null;
  onSelectSlot?: (slot: { startTime: string; endTime: string }) => void;
  onBlockSlot?: (slot: { startTime: string; endTime: string }) => void;
  onUnblockSlot?: (blockId: string) => void;
  pending?: boolean;
}

const STATE_CONFIG = {
  available: {
    label: "Available",
    icon: Clock,
    book: "bg-mint border-teal/30 text-forest hover:bg-teal hover:text-white",
    admin:
      "bg-mint border-teal/30 text-forest hover:border-red-300 hover:bg-red-50",
  },
  booked: {
    label: "Booked",
    icon: CheckCircle,
    book: "bg-slate/5 border-slate/10 text-slate/50 cursor-default",
    admin: "bg-teal/10 border-teal/30 text-forest cursor-default",
  },
  blocked: {
    label: "Blocked",
    icon: Ban,
    book: "bg-red-50 border-red-100 text-red-400 cursor-not-allowed line-through",
    admin:
      "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 cursor-pointer",
  },
  past: {
    label: "Past",
    icon: Clock,
    book: "bg-transparent border-transparent text-slate/30 cursor-not-allowed",
    admin: "bg-transparent border-transparent text-slate/30 cursor-not-allowed",
  },
};

export function DaySchedulePanel({
  date,
  slots,
  loading,
  mode,
  selectedSlot,
  onSelectSlot,
  onBlockSlot,
  onUnblockSlot,
  pending,
}: DaySchedulePanelProps) {
  if (!date) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate/20 bg-cream/50 p-8 text-center text-slate/50">
        <Calendar className="mb-3 h-10 w-10 opacity-40" />
        <p>Select a date on the calendar</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate/10 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg font-bold text-forest">
        {formatDateLong(date)}
      </h3>
      <p className="mt-1 text-sm text-slate/60">
        {mode === "admin"
          ? "Tap a time to block it, or tap a blocked slot to unblock."
          : "Choose an available time slot."}
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-teal" size={28} />
        </div>
      ) : slots.length === 0 ? (
        <p className="mt-6 text-sm text-slate/50">No time slots this day.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {slots.map((slot) => {
            const config = STATE_CONFIG[slot.state];
            const Icon = config.icon;
            const isSelected =
              selectedSlot?.startTime === slot.startTime &&
              selectedSlot?.endTime === slot.endTime;

            const handleClick = () => {
              if (slot.state === "available" && mode === "book") {
                onSelectSlot?.({
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                });
              } else if (slot.state === "available" && mode === "admin") {
                onBlockSlot?.({
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                });
              } else if (slot.state === "blocked" && mode === "admin" && slot.blockId) {
                onUnblockSlot?.(slot.blockId);
              }
            };

            const clickable =
              (slot.state === "available" && (mode === "book" || mode === "admin")) ||
              (slot.state === "blocked" && mode === "admin");

            return (
              <li key={`${slot.startTime}-${slot.endTime}`}>
                <button
                  type="button"
                  disabled={!clickable || pending}
                  onClick={handleClick}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${config[mode]} ${
                    isSelected ? "ring-2 ring-teal ring-offset-1" : ""
                  } disabled:opacity-60`}
                >
                  <Icon size={18} className="shrink-0 opacity-70" aria-hidden />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {formatTime12(slot.startTime)} –{" "}
                      {formatTime12(slot.endTime)}
                    </p>
                    {slot.state === "booked" && slot.customerName ? (
                      <p className="text-xs opacity-80">{slot.customerName}</p>
                    ) : null}
                    {slot.state === "blocked" && slot.reason ? (
                      <p className="text-xs opacity-80">{slot.reason}</p>
                    ) : null}
                    {slot.state === "available" && mode === "admin" ? (
                      <p className="text-xs opacity-60">Tap to block</p>
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-60">
                    {config.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
