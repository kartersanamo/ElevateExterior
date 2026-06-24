import type { Metadata } from "next";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { differentiators, site } from "@/lib/site-config";
import { Check, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${site.name} — locally owned, fully insured pressure washing in ${site.serviceArea}.`,
};

export default function AboutPage() {
  return (
    <div className="pt-24">
      <section className="section-padding bg-forest text-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="About us"
            title="Locally owned. Obsessed with curb appeal."
            subtitle={site.description}
            light
          />
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <AnimateIn>
              <h2 className="font-display text-3xl font-bold text-forest">
                The Elevate difference
              </h2>
              <p className="mt-4 leading-relaxed text-slate/80">
                Elevate Exterior Cleaning was built on a simple idea: your home
                deserves better than a one-size-fits-all blast of high pressure.
                We combine commercial-grade equipment with soft-wash expertise to
                clean siding, roofs, concrete, and wood safely — every time.
              </p>
              <p className="mt-4 leading-relaxed text-slate/80">
                We&apos;re fully insured, use plant- and pet-safe detergents, and
                stand behind every job with a satisfaction guarantee. When you
                book with us, you&apos;re supporting a local business that treats
                your property like our own.
              </p>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <div className="rounded-2xl border border-teal/20 bg-white p-8 shadow-sm">
                <div className="mb-6 inline-flex rounded-xl bg-mint p-3 text-teal">
                  <Shield size={28} aria-hidden />
                </div>
                <h3 className="font-display text-xl font-bold text-forest">
                  Why neighbors choose us
                </h3>
                <ul className="mt-6 space-y-4">
                  {differentiators.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                        <Check size={14} aria-hidden />
                      </span>
                      <span className="text-slate/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          </div>

          <div className="mt-16 rounded-2xl bg-mint p-8 text-center md:p-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              Service area
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-forest">
              {site.serviceArea}
            </p>
            <p className="mt-4 text-slate/70">{site.quotePromise}</p>
            <div className="mt-6">
              <ButtonLink href="/book" variant="primary">
                Schedule a cleaning
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
