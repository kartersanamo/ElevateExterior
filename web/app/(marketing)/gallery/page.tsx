import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGalleryCategories, getPublishedGalleryImages } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getPublishedGalleryImages();
  const categories = await getGalleryCategories(images);

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Gallery"
            title="What's possible."
            subtitle="Before-and-after style results across every service we offer."
          />
          <GalleryGrid images={images} categories={categories} />
        </div>
      </section>
    </div>
  );
}
