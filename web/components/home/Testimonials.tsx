import { AnimateIn } from "@/components/ui/AnimateIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials } from "@/lib/site-config";
import { Quote } from "lucide-react";

export function Testimonials() {
  return (
    <section className="section-padding bg-forest text-white">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Reviews"
          title="Neighbors love the results."
          align="center"
          light
        />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimateIn key={t.name} delay={i * 0.1}>
              <blockquote className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <Quote
                  className="mb-4 text-teal-light opacity-60"
                  size={28}
                  aria-hidden
                />
                <p className="flex-1 text-white/90 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-4 text-sm font-semibold text-teal-light">
                  — {t.name}
                </footer>
              </blockquote>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
