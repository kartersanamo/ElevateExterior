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
  if (link.comingSoon) {
    return (
      <span
        className={`${className} relative cursor-not-allowed text-slate/40`}
        aria-disabled="true"
        title="Coming soon"
      >
        <span className="flex items-center gap-2 blur-[3px]">
          <Icon size={16} className="shrink-0" aria-hidden />
          {link.label}
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-slate/60">
          Coming soon
        </span>
      </span>
    );
  }

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
