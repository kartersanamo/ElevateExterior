"use client";

import { SiteLogo } from "@/components/brand/SiteLogo";
import { ButtonLink } from "@/components/ui/Button";
import { navLinks, site } from "@/lib/site-config";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const solidHeader = scrolled || open || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solidHeader
          ? "bg-forest/95 shadow-lg backdrop-blur-md py-3"
          : "bg-gradient-to-b from-forest/95 via-forest/80 to-transparent py-5"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12 lg:px-20"
        aria-label="Main navigation"
      >
        <SiteLogo linked light />

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm uppercase tracking-widest text-white/90 transition-colors hover:text-teal-light"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 text-sm text-teal-light transition-colors hover:text-white"
            >
              <Phone size={16} aria-hidden />
              {site.phone}
            </a>
          </li>
          <li>
            <ButtonLink href="/book" variant="primary" size="sm">
              Book now
            </ButtonLink>
          </li>
        </ul>

        <button
          type="button"
          className="p-2 text-white lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 top-[60px] z-40 bg-forest px-8 py-10 lg:hidden">
          <ul className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-xl text-white transition-colors hover:text-teal-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-2 font-display text-xl text-teal-light"
              >
                <Phone size={20} aria-hidden />
                {site.phone}
              </a>
            </li>
            <li onClick={() => setOpen(false)}>
              <ButtonLink
                href="/book"
                variant="primary"
                className="w-full justify-center"
              >
                Book now
              </ButtonLink>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
