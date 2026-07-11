"use server";

import { auth } from "@/lib/auth";
import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import { sendJobCompletedEmail } from "@/lib/job-mail";
import { parseDollarsToCents } from "@/lib/recurring";
import { syncJobPhotosToGallery } from "@/lib/gallery";
import { saveJobPhotos } from "@/lib/uploads";
import { generatePublicToken } from "@/lib/tokens";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function completeBooking(bookingId: string, formData: FormData) {
  await requireAdmin();

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found.");
  if (booking.status !== "CONFIRMED") {
    throw new Error("Only confirmed bookings can be marked complete.");
  }

  const amountRaw = formData.get("amount");
  if (typeof amountRaw !== "string") {
    throw new Error("Amount is required.");
  }
  const amountChargedCents = parseDollarsToCents(amountRaw);

  const files = formData.getAll("photos");
  const photoFiles = files.filter((f): f is File => f instanceof File);
  const savedPhotos = await saveJobPhotos(bookingId, photoFiles);

  const publicToken = booking.publicToken ?? generatePublicToken();

  await db.$transaction(async (tx) => {
    await tx.jobPhoto.deleteMany({ where: { bookingId } });
    for (let i = 0; i < savedPhotos.length; i++) {
      await tx.jobPhoto.create({
        data: {
          bookingId,
          filename: savedPhotos[i].filename,
          mimeType: savedPhotos[i].mimeType,
          sortOrder: i,
        },
      });
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "COMPLETED",
        amountChargedCents,
        completedAt: new Date(),
        publicToken,
      },
    });
  });

  const updated = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  try {
    await syncJobPhotosToGallery(updated, updated.photos);
  } catch (error) {
    console.error("Gallery sync from job photos error:", error);
  }

  try {
    await upsertCustomer({
      email: updated.customerEmail,
      name: updated.customerName,
      phone: updated.customerPhone,
      address: updated.address,
      source: "booking",
    });
  } catch (error) {
    console.error("Customer upsert error:", error);
  }

  try {
    await sendJobCompletedEmail(updated);
  } catch (error) {
    console.error("Job completed email error:", error);
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}/complete`);
  revalidatePath(`/admin/jobs/${bookingId}`);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath(`/appointments/${publicToken}`);

  return { ok: true, publicToken };
}
