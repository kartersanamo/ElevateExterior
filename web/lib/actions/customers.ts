"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function updateCustomerNotes(customerId: string, notes: string) {
  await requireAdmin();

  await db.customer.update({
    where: { id: customerId },
    data: { notes: notes.trim() || null },
  });

  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function deleteCustomer(customerId: string) {
  await requireAdmin();
  await db.customer.delete({ where: { id: customerId } });
  revalidatePath("/admin/customers");
  return { ok: true };
}
