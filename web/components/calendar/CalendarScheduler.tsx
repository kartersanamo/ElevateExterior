"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { CalendarDay } from "@/components/calendar/MonthCalendar";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DaySchedulePanel } from "@/components/calendar/DaySchedulePanel";
import type { DayScheduleSlot } from "@/lib/scheduling/slots";

interface CalendarSchedulerProps {
  mode: "book" | "admin";
  onSlotSelect?: (date: string, slot: { startTime: string; endTime: string }) => void;
  onBlockSlot?: (
    date: string,
    slot: { startTime: string; endTime: string },
    reason?: string
  ) => Promise<void>;
  onUnblockSlot?: (blockId: string) => Promise<void>;
}

export function CalendarScheduler({
  mode,
  onSlotSelect,
  onBlockSlot,
  onUnblockSlot,
}: CalendarSchedulerProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [schedule, setSchedule] = useState<DayScheduleSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [pending, startTransition] = useTransition();
  const [blockReason, setBlockReason] = useState("");
  const [message, setMessage] = useState("");

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoadingMonth(true);
    try {
      const res = await fetch(
        `/api/availability?month=${y}-${String(m).padStart(2, "0")}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDays(
        (data.days ?? []).map(
          (d: {
            date: string;
            status: CalendarDay["status"];
            slotCount: number;
            bookingCount: number;
          }) => ({
            date: d.date,
            day: Number(d.date.split("-")[2]),
            inMonth: true,
            status: d.status,
            slotCount: d.slotCount,
            bookingCount: d.bookingCount,
          })
        )
      );
    } catch {
      setMessage("Could not load calendar.");
    } finally {
      setLoadingMonth(false);
    }
  }, []);

  const loadDay = useCallback(async (date: string) => {
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/availability?date=${date}&schedule=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchedule(data.schedule ?? []);
    } catch {
      setSchedule([]);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

  useEffect(() => {
    if (selectedDate) loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelectedDate("");
    setSelectedSlot(null);
    setSchedule([]);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setMessage("");
  };

  const handleSelectSlot = (slot: { startTime: string; endTime: string }) => {
    setSelectedSlot(slot);
    if (mode === "book" && selectedDate) {
      onSlotSelect?.(selectedDate, slot);
    }
  };

  const handleBlock = (slot: { startTime: string; endTime: string }) => {
    if (!selectedDate || !onBlockSlot) return;
    startTransition(async () => {
      await onBlockSlot(selectedDate, slot, blockReason || undefined);
      setMessage("Time blocked.");
      await loadDay(selectedDate);
      await loadMonth(year, month);
    });
  };

  const handleUnblock = (blockId: string) => {
    if (!onUnblockSlot) return;
    startTransition(async () => {
      await onUnblockSlot(blockId);
      setMessage("Block removed.");
      if (selectedDate) {
        await loadDay(selectedDate);
        await loadMonth(year, month);
      }
    });
  };

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-lg bg-mint px-4 py-2 text-sm text-forest">{message}</p>
      ) : null}

      <div className={loadingMonth ? "opacity-60" : ""}>
        <MonthCalendar
          year={year}
          month={month}
          days={days}
          selectedDate={selectedDate}
          onMonthChange={handleMonthChange}
          onDateSelect={handleDateSelect}
          mode={mode}
          size={mode === "admin" ? "large" : "default"}
        />
      </div>

      {mode === "admin" && selectedDate ? (
        <div className="rounded-xl border border-slate/10 bg-cream p-4">
          <label className="block text-sm font-semibold text-forest">
            Reason for blocking (optional)
          </label>
          <input
            type="text"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Dentist appointment, personal errand…"
            className="mt-2 w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <DaySchedulePanel
        date={selectedDate}
        slots={schedule}
        loading={loadingDay}
        mode={mode}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSelectSlot}
        onBlockSlot={handleBlock}
        onUnblockSlot={handleUnblock}
        pending={pending}
        stacked
      />
    </div>
  );
}
