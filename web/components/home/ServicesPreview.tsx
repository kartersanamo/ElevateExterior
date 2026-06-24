import { AnimateIn } from "@/components/ui/AnimateIn";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatMethod, services } from "@/lib/site-config";

export function ServicesPreview() {
  const preview = services.slice(0, 4);

  return (
    <section className="section-padding bg-white">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What we clean"
          title="Built for every surface."
          subtitle="From delicate cedar siding to weathered concrete, we match the right pressure and detergent to every job."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {preview.map((service, i) => {
            const Icon = service.icon;
            return (
              <AnimateIn key={service.id} delay={i * 0.08}>
                <article className="group h-full rounded-2xl border border-slate/10 bg-cream p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 inline-flex rounded-xl bg-mint p-3 text-teal">
                    <Icon size={24} aria-hidden />
                  </div>
                  <h3 className="font-display text-xl font-bold text-forest">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate/70">
                    {service.shortDescription}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-teal">
                    {formatMethod(service.method)}
                  </p>
                </article>
              </AnimateIn>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/services" variant="outline">
            See all services
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
