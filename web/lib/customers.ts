import { db } from "@/lib/db";

export async function upsertCustomer(data: {
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  source: "booking" | "contact" | "quote";
}) {
  const email = data.email.trim().toLowerCase();

  return db.customer.upsert({
    where: { email },
    create: {
      email,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      source: data.source,
    },
    update: {
      name: data.name.trim(),
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
    },
  });
}

export interface CustomerWithStats {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  source: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  bookingCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  lastBookingDate: Date | null;
  lastStatus: string | null;
}

export async function getCustomersWithStats(): Promise<CustomerWithStats[]> {
  const customers = await db.customer.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const stats = await Promise.all(
    customers.map(async (customer) => {
      const bookings = await db.booking.findMany({
        where: { customerEmail: customer.email },
        orderBy: { scheduledDate: "desc" },
      });

      return {
        ...customer,
        bookingCount: bookings.length,
        pendingCount: bookings.filter((b) => b.status === "PENDING").length,
        confirmedCount: bookings.filter((b) => b.status === "CONFIRMED").length,
        completedCount: bookings.filter((b) => b.status === "COMPLETED").length,
        lastBookingDate: bookings[0]?.scheduledDate ?? null,
        lastStatus: bookings[0]?.status ?? null,
      };
    })
  );

  return stats;
}

export async function getCustomerBookings(email: string) {
  return db.booking.findMany({
    where: { customerEmail: email.toLowerCase() },
    orderBy: [{ scheduledDate: "desc" }, { startTime: "desc" }],
  });
}
