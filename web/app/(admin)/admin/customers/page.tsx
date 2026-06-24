import { CustomersManager } from "@/components/admin/CustomersManager";
import { getCustomersWithStats } from "@/lib/customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getCustomersWithStats();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Customers</h1>
      <p className="mt-2 text-slate/70">
        Everyone who has booked or contacted you — with booking history at a glance.
      </p>
      <CustomersManager
        customers={customers.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          lastBookingDate: c.lastBookingDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
