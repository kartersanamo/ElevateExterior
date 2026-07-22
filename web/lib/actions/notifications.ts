"use server";

import {
  minutesFromAmount,
  normalizeDayOfAtTime,
} from "@/lib/booking-reminder-format";
import { db } from "@/lib/db";
import type { AdminNotificationEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

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

export async function addBookingReminderOffset(input: {
  kind: "before" | "dayOf";
  amount?: number;
  unit?: "minutes" | "hours" | "days";
  dayOfAtTime?: string;
}) {
  const session = await requireAdmin();
  const adminUserId = session.user.id;

  if (input.kind === "dayOf") {
    const dayOfAtTime = normalizeDayOfAtTime(input.dayOfAtTime ?? "07:00");

    const existing = await db.adminBookingReminderOffset.findFirst({
      where: { adminUserId, dayOf: true, dayOfAtTime },
    });
    if (existing) {
      throw new Error("That day-of reminder is already set.");
    }

    await db.adminBookingReminderOffset.create({
      data: {
        adminUserId,
        dayOf: true,
        dayOfAtTime,
        minutesBefore: null,
      },
    });
  } else {
    const minutesBefore = minutesFromAmount(
      input.amount ?? 0,
      input.unit ?? "minutes"
    );

    const existing = await db.adminBookingReminderOffset.findFirst({
      where: { adminUserId, dayOf: false, minutesBefore },
    });
    if (existing) {
      throw new Error("That reminder timing is already set.");
    }

    await db.adminBookingReminderOffset.create({
      data: {
        adminUserId,
        dayOf: false,
        minutesBefore,
        dayOfAtTime: "07:00",
      },
    });
  }

  const pref = await db.adminNotificationPreference.findUnique({
    where: {
      adminUserId_event: {
        adminUserId,
        event: "BOOKING_REMINDER",
      },
    },
  });

  if (!pref?.enabled) {
    await db.adminNotificationPreference.upsert({
      where: {
        adminUserId_event: {
          adminUserId,
          event: "BOOKING_REMINDER",
        },
      },
      create: {
        adminUserId,
        event: "BOOKING_REMINDER",
        enabled: true,
      },
      update: { enabled: true },
    });
  }

  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function removeBookingReminderOffset(offsetId: string) {
  const session = await requireAdmin();

  const offset = await db.adminBookingReminderOffset.findFirst({
    where: { id: offsetId, adminUserId: session.user.id },
  });
  if (!offset) {
    throw new Error("Reminder not found.");
  }

  await db.adminBookingReminderOffset.delete({ where: { id: offsetId } });

  revalidatePath("/admin/notifications");
  return { ok: true };
}
