"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addMonths,
  frequencyToMonths,
} from "@/lib/recurring";
import type { RecurringFrequency } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function createRecurringService(data: {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  services: string[];
  frequency: RecurringFrequency;
  sourceBookingId?: string;
  notes?: string;
}) {
  await requireAdmin();

  if (data.services.length === 0) {
    throw new Error("Select at least one service.");
  }

  const nextServiceDate = addMonths(new Date(), frequencyToMonths(data.frequency));

  await db.recurringService.create({
    data: {
      customerEmail: data.customerEmail.trim().toLowerCase(),
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone?.trim() || null,
      address: data.address.trim(),
      services: JSON.stringify(data.services),
      frequency: data.frequency,
      sourceBookingId: data.sourceBookingId || null,
      nextServiceDate,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/admin/recurring");
  return { ok: true };
}

export async function createRecurringFromJob(data: {
  token: string;
  frequency: RecurringFrequency;
}) {
  const booking = await db.booking.findUnique({
    where: { publicToken: data.token },
    include: { recurringService: true },
  });

  if (!booking || booking.status !== "COMPLETED") {
    throw new Error("Job not found.");
  }
  if (booking.recurringService) {
    throw new Error("Recurring service is already set up for this job.");
  }

  const nextServiceDate = addMonths(new Date(), frequencyToMonths(data.frequency));

  await db.recurringService.create({
    data: {
      customerEmail: booking.customerEmail.toLowerCase(),
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      address: booking.address,
      services: booking.services,
      frequency: data.frequency,
      sourceBookingId: booking.id,
      nextServiceDate,
      lastServiceDate: booking.completedAt ?? booking.scheduledDate,
    },
  });

  revalidatePath("/admin/recurring");
  revalidatePath(`/jobs/${data.token}`);
  return { ok: true };
}

export async function updateRecurringService(
  id: string,
  data: {
    active?: boolean;
    frequency?: RecurringFrequency;
    notes?: string;
    nextServiceDate?: string;
  }
) {
  await requireAdmin();

  let nextServiceDate: Date | undefined;
  if (data.nextServiceDate) {
    const [y, m, d] = data.nextServiceDate.split("-").map(Number);
    nextServiceDate = new Date(Date.UTC(y, m - 1, d));
  }

  await db.recurringService.update({
    where: { id },
    data: {
      active: data.active,
      frequency: data.frequency,
      notes: data.notes?.trim(),
      nextServiceDate,
    },
  });

  revalidatePath("/admin/recurring");
  return { ok: true };
}

export async function deleteRecurringService(id: string) {
  await requireAdmin();
  await db.recurringService.delete({ where: { id } });
  revalidatePath("/admin/recurring");
  return { ok: true };
}
