import { db } from "@/lib/db";
import { galleryImages as defaultImages } from "@/lib/site-config";

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
