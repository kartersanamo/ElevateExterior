import Image from "next/image";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { differentiators } from "@/lib/site-config";
import { Check } from "lucide-react";

export function DifferenceSection() {
  return (
    <section className="section-padding bg-mint">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <AnimateIn>
            <SectionHeading
              eyebrow="The Elevate difference"
              title="Pressure where it counts. Softness where it matters."
              subtitle={`Most "pressure washers" use one setting for everything — and damage paint, wood, and shingles. We tailor PSI and biodegradable detergents to each surface, so the only thing that disappears is the grime.`}
            />
            <ul className="space-y-4">
              {differentiators.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                    <Check size={14} aria-hidden />
                  </span>
                  <span className="text-slate/80">{item}</span>
                </li>
              ))}
            </ul>
          </AnimateIn>
          <AnimateIn delay={0.15}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="https://images.pexels.com/photos/5652626/pexels-photo-5652626.jpeg?_gl=1*jutudy*_ga*MTYyNjExNjAwLjE3NzYwODk1MDA.*_ga_8JE65Q40S6*czE3ODI0ODgyNzYkbzEyJGcxJHQxNzgyNDg4Mjk1JGo0MSRsMCRoMA.."
                alt="Technician soft washing a home's siding"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
