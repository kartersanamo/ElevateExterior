"use server";

import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
} from "@/lib/booking-mail";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { bookingToEmailPayload } from "@/lib/scheduling/slots";
import type { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
) {
  await requireAdmin();

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  const payload = bookingToEmailPayload(booking);

  try {
    if (status === "CONFIRMED") {
      await sendBookingConfirmedEmail(payload);
    } else if (status === "CANCELLED") {
      await sendBookingCancelledEmail(payload);
    }
  } catch (error) {
    console.error("Status email error:", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function updateAvailabilityRule(
  dayOfWeek: number,
  data: { startTime: string; endTime: string; enabled: boolean }
) {
  await requireAdmin();

  await db.availabilityRule.upsert({
    where: { dayOfWeek },
    create: { dayOfWeek, ...data },
    update: data,
  });

  revalidatePath("/admin/availability");
  return { ok: true };
}

export async function addBlockedDate(dateStr: string, reason?: string) {
  await requireAdmin();

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  await db.blockedDate.upsert({
    where: { date },
    create: { date, reason: reason ?? null },
    update: { reason: reason ?? null },
  });

  revalidatePath("/admin/availability");
  return { ok: true };
}

export async function removeBlockedDate(id: string) {
  await requireAdmin();
  await db.blockedDate.delete({ where: { id } });
  revalidatePath("/admin/availability");
  return { ok: true };
}

export async function updateSlotDuration(minutes: number) {
  await requireAdmin();

  if (minutes < 60 || minutes > 480) {
    throw new Error("Slot duration must be between 60 and 480 minutes.");
  }

  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", slotDurationMinutes: minutes },
    update: { slotDurationMinutes: minutes },
  });

  revalidatePath("/admin/availability");
  return { ok: true };
}
