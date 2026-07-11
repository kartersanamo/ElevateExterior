import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { AdminNavLink } from "@/lib/admin-nav";

export function AdminNavItem({
  link,
  icon: Icon,
  active,
  className = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
}: {
  link: AdminNavLink;
  icon: LucideIcon;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={link.href}
      className={`${className} ${
        active
          ? "bg-mint text-forest"
          : "text-slate/70 hover:bg-white hover:text-forest"
      }`}
    >
      <Icon size={16} className="shrink-0" aria-hidden />
      {link.label}
    </Link>
  );
}
