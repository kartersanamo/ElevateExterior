"use client";

import { SiteLogo } from "@/components/brand/SiteLogo";
import { ButtonLink } from "@/components/ui/Button";
import { navLinks, site } from "@/lib/site-config";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(72);

  const solidHeader = scrolled || open || !isHome;

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!open) return;

    const html = document.documentElement;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    html.classList.add("nav-menu-open");

    return () => {
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      html.classList.remove("nav-menu-open");
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const mobileMenu =
    open && mounted
      ? createPortal(
        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="mobile-nav-overlay lg:hidden"
          style={{ "--nav-header-height": `${headerHeight}px` } as React.CSSProperties}
        >
          <nav aria-label="Mobile navigation links">
            <ul className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 font-display text-2xl text-white transition-colors hover:text-teal-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={site.phoneHref}
                  className="inline-flex items-center gap-2 py-2 font-display text-2xl text-teal-light"
                >
                  <Phone size={20} aria-hidden />
                  {site.phone}
                </a>
              </li>
              <li>
                <ButtonLink
                  href="/book"
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => setOpen(false)}
                >
                  Book now
                </ButtonLink>
              </li>
            </ul>
          </nav>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[100] transition-[padding,background-color,box-shadow] duration-300 pt-[env(safe-area-inset-top)] ${solidHeader
          ? "bg-forest shadow-lg py-3"
          : "bg-gradient-to-b from-forest/95 via-forest/80 to-transparent py-5"
          }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12 lg:px-20">
          <SiteLogo linked size="lg" />

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
        </div>
      </header>
      {mobileMenu}
    </>
  );
}
