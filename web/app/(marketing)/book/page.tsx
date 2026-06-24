import type { Metadata } from "next";
import { BookingWizard } from "@/components/book/BookingWizard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Book",
  description: `Schedule a pressure washing or soft washing appointment with ${site.name}.`,
};

export default function BookPage() {
  return (
    <div className="pt-24">
      <section className="section-padding bg-cream">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Book online"
            title="Schedule your cleaning."
            subtitle="Pick your services, choose a time, and we'll confirm within 24 hours. No payment required upfront."
            align="center"
          />
          <BookingWizard />
        </div>
      </section>
    </div>
  );
}
