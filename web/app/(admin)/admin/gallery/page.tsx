import { GalleryManager } from "@/components/admin/GalleryManager";
import { db } from "@/lib/db";
import { JOB_GALLERY_CATEGORY } from "@/lib/gallery";
import { galleryImages as defaultImages } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const images = await db.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const dbCategories = Array.from(new Set(images.map((img) => img.category)));
  const defaultCategories = Array.from(
    new Set(defaultImages.map((img) => img.category))
  );
  const categories = Array.from(
    new Set([...dbCategories, ...defaultCategories, JOB_GALLERY_CATEGORY])
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Gallery</h1>
      <p className="mt-2 text-slate/70">
        Manage photos on the public gallery page. Job completion photos land in the section
        below, unpublished, until you review and publish them.
      </p>
      <GalleryManager
        images={images.map((img) => ({
          ...img,
        }))}
        categories={categories}
      />
    </div>
  );
}
