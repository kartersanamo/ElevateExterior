import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AdminAvailabilityPage() {
  const [rules, blocked, settings] = await Promise.all([
    db.availabilityRule.findMany({ orderBy: { dayOfWeek: "asc" } }),
    db.blockedDate.findMany({ orderBy: { date: "asc" } }),
    db.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  const rulesWithNames = rules.map((r) => ({
    ...r,
    dayName: DAY_NAMES[r.dayOfWeek] ?? `Day ${r.dayOfWeek}`,
  }));

  const blockedFormatted = blocked.map((b) => ({
    id: b.id,
    date: b.date.toISOString().slice(0, 10),
    reason: b.reason,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">
        Availability
      </h1>
      <p className="mt-2 text-slate/70">
        Set your weekly hours, block days off, and configure appointment length.
      </p>
      <AvailabilityManager
        rules={rulesWithNames}
        blocked={blockedFormatted}
        slotDurationMinutes={settings?.slotDurationMinutes ?? 180}
      />
    </div>
  );
}
