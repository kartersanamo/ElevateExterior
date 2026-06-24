import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site-config";
import { Mail, Phone } from "lucide-react";

export function CtaSection() {
  return (
    <section className="section-padding bg-gradient-to-br from-teal to-forest text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-4xl font-bold md:text-5xl">
          Ready to elevate your exterior?
        </h2>
        <p className="mt-4 text-lg text-white/85">{site.quotePromise}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink href="/book" variant="inverse" size="lg">
            Book online
          </ButtonLink>
          <ButtonLink
            href={site.phoneHref}
            variant="ghost"
            size="lg"
            external
            className="justify-center"
          >
            <Phone size={18} className="mr-2" aria-hidden />
            Call {site.phone}
          </ButtonLink>
        </div>
        <a
          href={`mailto:${site.email}`}
          className="mt-6 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
        >
          <Mail size={16} aria-hidden />
          {site.email}
        </a>
      </div>
    </section>
  );
}
