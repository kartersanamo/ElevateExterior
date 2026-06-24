import Link from "next/link";
import { signOut } from "@/lib/auth";
import { site } from "@/lib/site-config";
import {
  CalendarDays,
  Clock,
  ClipboardList,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  RefreshCw,
  Users,
  UserCircle,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/customers", label: "Customers", icon: UserCircle },
  { href: "/admin/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/availability", label: "Availability", icon: Clock },
  { href: "/admin/team", label: "Team", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate/5">
      <header className="border-b border-slate/10 bg-forest text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-teal-light">
              Admin
            </p>
            <p className="font-display font-bold">{site.shortName}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-white"
              target="_blank"
            >
              View site
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <nav className="hidden w-48 shrink-0 md:block">
          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate/70 hover:bg-white hover:text-forest"
                  >
                    <Icon size={16} aria-hidden />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
