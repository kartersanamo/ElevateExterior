import type { Metadata } from "next";
import { BookingWizard } from "@/components/book/BookingWizard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Book",
  description: `Request a free quote from ${site.name}. Pick services, preferred time, and we'll respond within 24 hours.`,
};

export default function BookPage() {
  return (
    <div className="page-top">
      <section className="section-padding bg-cream">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Book online"
            title="Request your quote."
            subtitle="Pick your services and preferred time. We'll send a personalized quote within 24 hours — no payment required upfront."
            align="center"
          />
          <BookingWizard />
        </div>
      </section>
    </div>
  );
}
