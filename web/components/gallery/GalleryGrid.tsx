"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { PublicGalleryImage } from "@/lib/gallery";

export function GalleryGrid({
  images,
  categories,
}: {
  images: PublicGalleryImage[];
  categories: string[];
}) {
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    if (active === "All") return images;
    return images.filter((img) => img.category === active);
  }, [active, images]);

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === cat
                ? "bg-teal text-white"
                : "bg-mint text-forest hover:bg-teal/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((img, i) => (
          <AnimateIn key={img.id} delay={(i % 3) * 0.08}>
            <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate/5">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-forest/90 to-transparent p-4 pt-12">
                <span className="text-sm font-semibold text-white">
                  {img.category}
                </span>
              </figcaption>
            </figure>
          </AnimateIn>
        ))}
      </div>
    </>
  );
}
