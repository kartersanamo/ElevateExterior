import { AdminCalendar } from "@/components/admin/AdminCalendar";

export const dynamic = "force-dynamic";

export default function AdminCalendarPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Calendar</h1>
      <p className="mt-2 max-w-2xl text-slate/70">
        See every booking at a glance. Click a day to view time slots — tap any
        open slot to block it when you&apos;re unavailable.
      </p>
      <div className="mt-8">
        <AdminCalendar />
      </div>
    </div>
  );
}
