"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Menu,
  RefreshCw,
  Users,
  UserCircle,
  KeyRound,
  X,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/customers", label: "Customers", icon: UserCircle },
  { href: "/admin/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/account", label: "Account", icon: KeyRound },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  return (
    <div className="md:hidden">
      <div className="border-b border-slate/10 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="touch-target inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-forest hover:bg-slate/5"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close admin menu" : "Open admin menu"}
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          {open ? "Close menu" : "Admin menu"}
        </button>
      </div>

      <nav
        id="admin-mobile-nav"
        className={`overflow-y-auto border-b border-slate/10 bg-white transition-[max-height] duration-300 ease-out ${
          open ? "max-h-[70dvh]" : "max-h-0"
        }`}
        aria-label="Admin navigation"
        aria-hidden={!open}
      >
        <ul className="grid grid-cols-2 gap-2 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href, link.exact);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-mint text-forest"
                      : "text-slate/70 hover:bg-slate/5 hover:text-forest"
                  }`}
                >
                  <Icon size={16} className="shrink-0" aria-hidden />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
