import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { DifferenceSection } from "@/components/home/DifferenceSection";
import { Testimonials } from "@/components/home/Testimonials";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { CtaSection } from "@/components/home/CtaSection";
import { site } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description: site.description,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <DifferenceSection />
      <GalleryTeaser />
      <Testimonials />
      <CtaSection />
    </>
  );
}
