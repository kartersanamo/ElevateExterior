"use server";

import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
} from "@/lib/booking-mail";
import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import { runAutomationForBooking } from "@/lib/email/send";
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

  if (status === "COMPLETED") {
    throw new Error("Use the complete job flow to mark bookings complete.");
  }

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  try {
    await upsertCustomer({
      email: booking.customerEmail,
      name: booking.customerName,
      phone: booking.customerPhone,
      address: booking.address,
      source: "booking",
    });
  } catch (error) {
    console.error("Customer upsert error:", error);
  }

  const payload = bookingToEmailPayload(booking);

  try {
    if (status === "CONFIRMED") {
      await sendBookingConfirmedEmail(payload);
      await runAutomationForBooking("ON_BOOKING_CONFIRMED", booking);
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

export async function blockTimeSlot(
  dateStr: string,
  startTime: string,
  endTime: string,
  reason?: string
) {
  await requireAdmin();

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  await db.blockedTimeSlot.create({
    data: {
      date,
      startTime,
      endTime,
      reason: reason?.trim() || null,
    },
  });

  revalidatePath("/admin/availability");
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function unblockTimeSlot(blockId: string) {
  await requireAdmin();
  await db.blockedTimeSlot.delete({ where: { id: blockId } });
  revalidatePath("/admin/availability");
  return { ok: true };
}

export async function blockEntireDate(dateStr: string, reason?: string) {
  await requireAdmin();
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  await db.blockedDate.upsert({
    where: { date },
    create: { date, reason: reason?.trim() || null },
    update: { reason: reason?.trim() || null },
  });
  revalidatePath("/admin/availability");
  return { ok: true };
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  await requireAdmin();
  const email = data.email.trim().toLowerCase();

  if (!data.name.trim() || !email || data.password.length < 8) {
    throw new Error("Name, email, and password (8+ chars) are required.");
  }

  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An admin with this email already exists.");
  }

  const { hashPassword } = await import("@/lib/password");
  await db.adminUser.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash: await hashPassword(data.password),
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin/team");
  return { ok: true, email };
}

export async function removeAdminUser(adminId: string) {
  const session = await requireAdmin();
  if (session.user.id === adminId) {
    throw new Error("You cannot remove your own account.");
  }

  const count = await db.adminUser.count();
  if (count <= 1) {
    throw new Error("At least one admin must remain.");
  }

  await db.adminUser.delete({ where: { id: adminId } });
  revalidatePath("/admin/team");
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
