import { RecurringManager } from "@/components/admin/RecurringManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminRecurringPage() {
  const rows = await db.recurringService.findMany({
    orderBy: [{ active: "desc" }, { nextServiceDate: "asc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Recurring services</h1>
      <p className="mt-2 text-slate/70">
        Customers on a regular schedule — monthly, quarterly, or custom intervals.
      </p>
      <RecurringManager
        rows={rows.map((r) => ({
          ...r,
          nextServiceDate: r.nextServiceDate?.toISOString() ?? null,
          lastServiceDate: r.lastServiceDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
