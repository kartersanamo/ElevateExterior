import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { QuickContact } from "@/components/contact/QuickContact";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} — call ${site.phone}, email ${site.email}, or send a message online.`,
};

export default function ContactPage() {
  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Contact"
            title="Let's talk about your property."
            subtitle={site.quotePromise}
          />

          <QuickContact />

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-forest">
                Send a message
              </h2>
              <p className="mt-2 text-slate/70">
                Prefer email? Fill out the form and we&apos;ll get back to you
                within 24 hours.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
            <div className="rounded-2xl bg-mint p-8">
              <h2 className="font-display text-2xl font-bold text-forest">
                Service area
              </h2>
              <p className="mt-4 leading-relaxed text-slate/80">
                We serve {site.serviceArea}. Not sure if we cover your address?
                Give us a call or book online — we&apos;ll confirm availability
                when we review your request.
              </p>
              <p className="mt-6 text-sm text-slate/60">
                For the fastest response, call{" "}
                <a
                  href={site.phoneHref}
                  className="font-semibold text-teal hover:underline"
                >
                  {site.phone}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
