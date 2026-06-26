import type { Metadata } from "next";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatMethod, services, site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Services",
  description: `Pressure washing and soft washing services in ${site.serviceArea}. No pricing online — request a free quote.`,
};

export default function ServicesPage() {
  return (
    <div className="page-top">
      <section className="section-padding bg-forest text-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our services"
            title="Everything we can clean."
            subtitle="We tailor pressure and detergents to each surface. Request a free quote for any combination of services — no prices listed online."
            light
          />
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="mx-auto max-w-7xl space-y-8">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <AnimateIn key={service.id} delay={i * 0.05}>
                <article className="grid gap-6 rounded-2xl border border-slate/10 bg-white p-8 md:grid-cols-[auto_1fr] md:gap-8">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mint text-teal">
                    <Icon size={28} aria-hidden />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <h2 className="font-display text-2xl font-bold text-forest">
                        {service.title}
                      </h2>
                      <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal">
                        {formatMethod(service.method)}
                      </span>
                    </div>
                    <p className="mt-2 text-lg text-slate/80">
                      {service.shortDescription}
                    </p>
                    <p className="mt-4 leading-relaxed text-slate/70">
                      {service.description}
                    </p>
                  </div>
                </article>
              </AnimateIn>
            );
          })}
        </div>

        <div className="mx-auto mt-16 max-w-7xl rounded-2xl bg-forest p-8 text-center text-white md:p-12">
          <h2 className="font-display text-3xl font-bold">
            Not sure what you need?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            {site.quotePromise}. Tell us about your property and we&apos;ll
            recommend the right services.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <ButtonLink href="/book" variant="primary">
              Book a visit
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Send a message
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
