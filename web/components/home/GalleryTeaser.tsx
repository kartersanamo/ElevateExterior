import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { galleryImages } from "@/lib/site-config";

export function GalleryTeaser() {
  const preview = galleryImages.slice(0, 3);

  return (
    <section className="section-padding bg-white">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Results"
          title="See what's possible."
          subtitle="Real transformations — swap in your own job photos anytime."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {preview.map((img, i) => (
            <AnimateIn key={img.src} delay={i * 0.08}>
              <Link
                href="/gallery"
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-forest opacity-0 transition-opacity group-hover:opacity-100">
                  {img.category}
                </span>
              </Link>
            </AnimateIn>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link
            href="/gallery"
            className="text-sm font-semibold uppercase tracking-wider text-teal hover:text-forest"
          >
            View full gallery →
          </Link>
        </p>
      </div>
    </section>
  );
}
