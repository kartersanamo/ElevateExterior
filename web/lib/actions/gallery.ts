"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { JOB_GALLERY_CATEGORY } from "@/lib/gallery";
import { deleteGalleryFile } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function createGalleryImage(data: {
  src: string;
  alt: string;
  category: string;
  sortOrder?: number;
  published?: boolean;
  storageKey?: string;
}) {
  await requireAdmin();

  if (!data.src.trim() || !data.alt.trim() || !data.category.trim()) {
    throw new Error("Image, alt text, and category are required.");
  }

  const maxOrder = await db.galleryImage.aggregate({ _max: { sortOrder: true } });

  await db.galleryImage.create({
    data: {
      src: data.src.trim(),
      storageKey: data.storageKey?.trim() || null,
      alt: data.alt.trim(),
      category: data.category.trim(),
      sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      published: data.published ?? true,
    },
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

export async function updateGalleryImage(
  id: string,
  data: {
    src?: string;
    alt?: string;
    category?: string;
    sortOrder?: number;
    published?: boolean;
  }
) {
  await requireAdmin();

  await db.galleryImage.update({
    where: { id },
    data: {
      src: data.src?.trim(),
      alt: data.alt?.trim(),
      category: data.category?.trim(),
      sortOrder: data.sortOrder,
      published: data.published,
    },
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteGalleryImage(id: string) {
  await requireAdmin();
  const image = await db.galleryImage.findUnique({ where: { id } });
  if (image?.storageKey) {
    await deleteGalleryFile(image.storageKey);
  }
  await db.galleryImage.delete({ where: { id } });
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

export async function reorderGalleryImage(
  id: string,
  direction: "up" | "down",
  section?: "site" | "jobs"
) {
  await requireAdmin();

  const categoryFilter =
    section === "jobs"
      ? JOB_GALLERY_CATEGORY
      : section === "site"
        ? { not: JOB_GALLERY_CATEGORY }
        : undefined;

  const images = await db.galleryImage.findMany({
    where: categoryFilter ? { category: categoryFilter } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = images.findIndex((img) => img.id === id);
  if (index === -1) throw new Error("Image not found.");

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= images.length) return { ok: true };

  const current = images[index];
  const swap = images[swapIndex];

  await db.$transaction([
    db.galleryImage.update({
      where: { id: current.id },
      data: { sortOrder: swap.sortOrder },
    }),
    db.galleryImage.update({
      where: { id: swap.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}
