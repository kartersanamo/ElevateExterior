"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  sendReviewDiscountClaimedAdminEmail,
  sendReviewDiscountConfirmationEmail,
} from "@/lib/review-reward-mail";
import { generateReviewDiscountCode } from "@/lib/review-reward";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function claimReviewDiscount({
  token,
}: {
  token: string;
}): Promise<{ code: string }> {
  const booking = await db.booking.findUnique({
    where: { publicToken: token },
  });

  if (!booking) throw new Error("Appointment not found.");
  if (!booking.paidAt) throw new Error("Payment must be completed before claiming a review reward.");
  if (booking.reviewDiscountClaimedAt && booking.reviewDiscountCode) {
    return { code: booking.reviewDiscountCode };
  }

  let code = generateReviewDiscountCode();
  let attempts = 0;

  while (attempts < 5) {
    const existing = await db.booking.findUnique({
      where: { reviewDiscountCode: code },
    });
    if (!existing) break;
    code = generateReviewDiscountCode();
    attempts++;
  }

  const updated = await db.booking.update({
    where: { id: booking.id },
    data: {
      reviewDiscountCode: code,
      reviewDiscountClaimedAt: new Date(),
    },
  });

  try {
    await sendReviewDiscountConfirmationEmail(updated, code);
  } catch (error) {
    console.error("Review discount confirmation email error:", error);
  }

  try {
    await sendReviewDiscountClaimedAdminEmail(updated, code);
  } catch (error) {
    console.error("Review discount admin notification error:", error);
  }

  revalidatePath(`/appointments/${token}`);
  revalidatePath(`/admin/jobs/${booking.id}`);

  return { code };
}

export async function markReviewDiscountRedeemed({
  bookingId,
}: {
  bookingId: string;
}): Promise<void> {
  await requireAdmin();

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found.");
  if (!booking.reviewDiscountCode) {
    throw new Error("No review discount has been claimed for this booking.");
  }
  if (booking.reviewDiscountRedeemedAt) {
    throw new Error("This discount has already been marked as redeemed.");
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { reviewDiscountRedeemedAt: new Date() },
  });

  revalidatePath(`/admin/jobs/${bookingId}`);
}
