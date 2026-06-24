"use client";

import {
  formatMonthYear,
  getMonthBounds,
  shiftMonth,
} from "@/lib/scheduling/dates";
import type { DayAvailabilityStatus } from "@/lib/scheduling/slots";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  status?: DayAvailabilityStatus;
  slotCount?: number;
  bookingCount?: number;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedDate?: string;
  onMonthChange: (year: number, month: number) => void;
  onDateSelect: (date: string) => void;
  mode?: "book" | "admin";
}

const STATUS_STYLES: Record<
  DayAvailabilityStatus,
  { cell: string; dot: string; label: string }
> = {
  open: {
    cell: "bg-mint hover:bg-teal/20 border-teal/30 text-forest",
    dot: "bg-teal",
    label: "Open",
  },
  limited: {
    cell: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900",
    dot: "bg-amber-500",
    label: "Few spots",
  },
  full: {
    cell: "bg-slate/10 text-slate/50 border-slate/20 cursor-not-allowed",
    dot: "bg-slate/40",
    label: "Full",
  },
  blocked: {
    cell: "bg-red-50 text-red-400 border-red-100 cursor-not-allowed",
    dot: "bg-red-400",
    label: "Blocked",
  },
  unavailable: {
    cell: "bg-transparent text-slate/30 border-transparent cursor-not-allowed",
    dot: "bg-transparent",
    label: "Unavailable",
  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({
  year,
  month,
  days,
  selectedDate,
  onMonthChange,
  onDateSelect,
  mode = "book",
}: MonthCalendarProps) {
  const { startWeekday } = getMonthBounds(year, month);

  const grid = useMemo(() => {
    const cells: (CalendarDay | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (const day of days) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [days, startWeekday]);

  const prev = () => {
    const n = shiftMonth(year, month, -1);
    onMonthChange(n.year, n.month);
  };

  const next = () => {
    const n = shiftMonth(year, month, 1);
    onMonthChange(n.year, n.month);
  };

  return (
    <div className="rounded-2xl border border-slate/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          className="rounded-lg p-2 text-forest hover:bg-mint"
          aria-label="Previous month"
        >
          <ChevronLeft size={22} />
        </button>
        <h3 className="font-display text-xl font-bold text-forest">
          {formatMonthYear(year, month)}
        </h3>
        <button
          type="button"
          onClick={next}
          className="rounded-lg p-2 text-forest hover:bg-mint"
          aria-label="Next month"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate/50"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const status = cell.status ?? "unavailable";
          const styles = STATUS_STYLES[status];
          const isSelected = selectedDate === cell.date;
          const clickable =
            mode === "admin"
              ? cell.inMonth
              : cell.inMonth && (status === "open" || status === "limited");

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onDateSelect(cell.date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all ${styles.cell} ${
                isSelected
                  ? "ring-2 ring-teal ring-offset-2 scale-[1.02]"
                  : ""
              } ${!cell.inMonth ? "opacity-30" : ""}`}
            >
              <span>{cell.day}</span>
              {cell.inMonth && status !== "unavailable" ? (
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${styles.dot}`}
                  aria-hidden
                />
              ) : null}
              {mode === "admin" && cell.bookingCount ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
                  {cell.bookingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate/60">
        {(Object.keys(STATUS_STYLES) as DayAvailabilityStatus[])
          .filter((s) => s !== "unavailable")
          .map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].dot}`}
              />
              {STATUS_STYLES[status].label}
            </span>
          ))}
      </div>
    </div>
  );
}
