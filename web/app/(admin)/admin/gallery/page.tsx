import { GalleryManager } from "@/components/admin/GalleryManager";
import { db } from "@/lib/db";
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
  const categories = Array.from(new Set([...dbCategories, ...defaultCategories]));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Gallery</h1>
      <p className="mt-2 text-slate/70">
        Manage photos shown on the public gallery page. Reorder with move up/down.
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
