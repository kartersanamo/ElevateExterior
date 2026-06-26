"use client";

import { SiteLogo } from "@/components/brand/SiteLogo";
import { ButtonLink } from "@/components/ui/Button";
import { navLinks, site } from "@/lib/site-config";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const solidHeader = scrolled || open || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => setHeaderHeight(header.offsetHeight);

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [open, solidHeader]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousWidth = document.body.style.width;
    const previousTop = document.body.style.top;
    const scrollY = window.scrollY;

    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.width = previousWidth;
      document.body.style.top = previousTop;
      if (open) window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pt-[env(safe-area-inset-top)] ${
          solidHeader
            ? "bg-forest/95 shadow-lg py-3"
            : "bg-gradient-to-b from-forest/95 via-forest/80 to-transparent py-5"
        } ${open ? "bg-forest/95 shadow-lg backdrop-blur-none" : solidHeader ? "backdrop-blur-md" : ""}`}
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
            className="touch-target rounded-lg p-2 text-white lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </header>

      {open ? (
        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-forest lg:hidden"
          style={{
            paddingTop:
              headerHeight > 0
                ? headerHeight
                : "calc(5.5rem + env(safe-area-inset-top))",
          }}
        >
          <div className="px-8 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <ul className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-1 font-display text-2xl text-white transition-colors hover:text-teal-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={site.phoneHref}
                  className="inline-flex items-center gap-2 py-1 font-display text-2xl text-teal-light"
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
        </div>
      ) : null}
    </>
  );
}
