"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { galleryCategories, galleryImages } from "@/lib/site-config";

export default function GalleryPage() {
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    if (active === "All") return galleryImages;
    return galleryImages.filter((img) => img.category === active);
  }, [active]);

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Gallery"
            title="What's possible."
            subtitle="Before-and-after style results across every service we offer. Replace these placeholders with your own job photos when ready."
          />

          <div className="mb-10 flex flex-wrap gap-2">
            {galleryCategories.map((cat) => (
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
              <AnimateIn key={`${img.src}-${i}`} delay={(i % 3) * 0.08}>
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
        </div>
      </section>
    </div>
  );
}
