import { ButtonLink } from "@/components/ui/Button";
import { site, trustBadges } from "@/lib/site-config";
import { Phone, Star } from "lucide-react";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative flex min-h-[90dvh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=80"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/80 to-forest/40"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-32 md:px-12 lg:px-20">
        <div className="max-w-2xl">
          <p className="mb-4 flex items-center gap-2 text-sm text-teal-light">
            <Star size={16} className="fill-teal-light text-teal-light" aria-hidden />
            {site.socialProof}
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            Your home,
            <span className="block text-teal-light">elevated.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            {site.tagline} — fully insured, locally owned.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ButtonLink href="/book" variant="primary" size="lg">
              Book a cleaning
            </ButtonLink>
            <ButtonLink
              href={site.phoneHref}
              variant="ghost"
              size="lg"
              external
              className="justify-center"
            >
              <Phone size={18} className="mr-2" aria-hidden />
              {site.phone}
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-3">
            {trustBadges.map((badge) => (
              <li
                key={badge.label}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm"
              >
                {badge.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
