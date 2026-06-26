import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminNavItem } from "@/components/admin/AdminNavItem";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { adminNavLinks } from "@/lib/admin-nav";
import { site } from "@/lib/site-config";
import {
  ClipboardList,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  RefreshCw,
  Users,
  UserCircle,
  KeyRound,
} from "lucide-react";

const icons = {
  "/admin": LayoutDashboard,
  "/admin/bookings": ClipboardList,
  "/admin/quotes": FileText,
  "/admin/customers": UserCircle,
  "/admin/recurring": RefreshCw,
  "/admin/gallery": ImageIcon,
  "/admin/emails": Mail,
  "/admin/team": Users,
  "/admin/account": KeyRound,
} as const;

export function AdminShell({
  children,
  mustChangePassword = false,
}: {
  children: React.ReactNode;
  mustChangePassword?: boolean;
}) {
  return (
    <div className="min-h-screen-safe bg-slate/5">
      <header className="border-b border-slate/10 bg-forest text-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-teal-light">
              Admin
            </p>
            <p className="font-display font-bold">{site.shortName}</p>
          </div>
          <div className="flex items-center gap-4">
            {!mustChangePassword ? (
              <Link
                href="/"
                className="text-sm text-white/70 hover:text-white"
                target="_blank"
              >
                View site
              </Link>
            ) : null}
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
      {!mustChangePassword ? <AdminMobileNav /> : null}
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {!mustChangePassword ? (
          <nav className="hidden w-48 shrink-0 md:block">
            <ul className="space-y-1">
              {adminNavLinks.map((link) => {
                const Icon = icons[link.href as keyof typeof icons];
                return (
                  <li key={link.href}>
                    <AdminNavItem link={link} icon={Icon} />
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
