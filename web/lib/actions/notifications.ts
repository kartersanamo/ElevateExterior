"use server";

import { auth } from "@/lib/auth";
import { seedAdminNotificationPreferences } from "@/lib/admin-notifications";
import { db } from "@/lib/db";
import type { AdminNotificationEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateNotificationPreference(
  event: AdminNotificationEvent,
  enabled: boolean
) {
  const session = await requireAdmin();

  await db.adminNotificationPreference.upsert({
    where: {
      adminUserId_event: {
        adminUserId: session.user.id,
        event,
      },
    },
    create: {
      adminUserId: session.user.id,
      event,
      enabled,
    },
    update: { enabled },
  });

  revalidatePath("/admin/notifications");
  return { ok: true };
}
