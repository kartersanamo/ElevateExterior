import { db } from "@/lib/db";
import { copyJobPhotoToGallery } from "@/lib/uploads";
import { galleryImages as defaultImages, services } from "@/lib/site-config";

/** Category used for gallery images auto-added from completed jobs. */
export const JOB_GALLERY_CATEGORY = "Completed Jobs";

function formatBookingServices(servicesJson: string): string {
  try {
    const ids = JSON.parse(servicesJson) as string[];
    return ids
      .map((id) => services.find((s) => s.id === id)?.title ?? id)
      .join(", ");
  } catch {
    return "exterior cleaning";
  }
}

export async function syncJobPhotosToGallery(
  booking: { id: string; customerName: string; services: string },
  photos: Array<{ filename: string }>
): Promise<void> {
  if (photos.length === 0) return;

  const maxOrder = await db.galleryImage.aggregate({ _max: { sortOrder: true } });
  let nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;
  const serviceLabel = formatBookingServices(booking.services);

  for (const photo of photos) {
    const { storageKey } = await copyJobPhotoToGallery(booking.id, photo.filename);
    await db.galleryImage.create({
      data: {
        src: `/api/gallery/files/${storageKey}`,
        storageKey,
        alt: `Completed ${serviceLabel} — ${booking.customerName}`,
        category: JOB_GALLERY_CATEGORY,
        sortOrder: nextOrder++,
        published: false,
      },
    });
  }
}

export interface PublicGalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
}

export async function getPublishedGalleryImages(): Promise<PublicGalleryImage[]> {
  const images = await db.galleryImage.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  if (images.length === 0) {
    return defaultImages.map((img, i) => ({
      id: `default-${i}`,
      ...img,
    }));
  }

  return images;
}

export async function getGalleryCategories(
  images: PublicGalleryImage[]
): Promise<string[]> {
  return ["All", ...Array.from(new Set(images.map((img) => img.category)))];
}
