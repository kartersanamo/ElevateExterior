"use client";

import { CalendarScheduler } from "@/components/calendar/CalendarScheduler";
import { blockTimeSlot, unblockTimeSlot } from "@/lib/actions/admin";

export function AdminCalendar() {
  return (
    <CalendarScheduler
      mode="admin"
      onBlockSlot={async (date, slot, reason) => {
        await blockTimeSlot(date, slot.startTime, slot.endTime, reason);
      }}
      onUnblockSlot={async (blockId) => {
        await unblockTimeSlot(blockId);
      }}
    />
  );
}
