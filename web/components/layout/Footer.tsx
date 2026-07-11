import { SiteLogo } from "@/components/brand/SiteLogo";
import { ButtonLink } from "@/components/ui/Button";
import { navLinks, services, site } from "@/lib/site-config";
import { Mail, MapPin, Phone, Star } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 bg-forest text-white">
      <div className="section-padding pb-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <SiteLogo linked size="lg" className="mb-4" />
            <p className="mb-6 text-sm leading-relaxed text-white/70">
              {site.description}
            </p>
            <ButtonLink href="/book" variant="primary" size="sm">
              Book a cleaning
            </ButtonLink>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.25em] text-teal-light">
              Explore
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 transition-colors hover:text-teal-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/book"
                  className="text-sm text-white/75 transition-colors hover:text-teal-light"
                >
                  Book online
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.25em] text-teal-light">
              Services
            </h3>
            <ul className="space-y-3">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <Link
                    href="/services"
                    className="text-sm text-white/75 transition-colors hover:text-teal-light"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.25em] text-teal-light">
              Contact
            </h3>
            <ul className="space-y-4 text-sm text-white/75">
              <li className="flex gap-3">
                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0 text-teal-light"
                  aria-hidden
                />
                <span>{site.serviceArea}</span>
              </li>
              <li className="flex gap-3">
                <Phone
                  size={16}
                  className="mt-0.5 shrink-0 text-teal-light"
                  aria-hidden
                />
                <a
                  href={site.phoneHref}
                  className="transition-colors hover:text-teal-light"
                >
                  {site.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail
                  size={16}
                  className="mt-0.5 shrink-0 text-teal-light"
                  aria-hidden
                />
                <a
                  href={`mailto:${site.email}`}
                  className="transition-colors hover:text-teal-light"
                >
                  {site.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Star
                  size={16}
                  className="mt-0.5 shrink-0 text-teal-light"
                  aria-hidden
                />
                <Link
                  href="/review"
                  className="transition-colors hover:text-teal-light"
                >
                  Leave a review
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="safe-bottom border-t border-white/10 px-6 py-6 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-white/50 md:flex-row">
          <p>
            © {year} {site.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-teal-light">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-teal-light">
              Terms
            </Link>
            <Link href="/review" className="hover:text-teal-light">
              Leave a review
            </Link>
            <span>{site.serviceArea}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
