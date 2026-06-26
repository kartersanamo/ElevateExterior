export type AdminNavLink = {
  href: string;
  label: string;
  exact?: boolean;
  comingSoon?: boolean;
};

export const adminNavLinks: AdminNavLink[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/recurring", label: "Recurring" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/emails", label: "Emails", comingSoon: true },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/account", label: "Account" },
];
