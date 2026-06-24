import { AdminShell } from "@/components/admin/AdminShell";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <AdminShell mustChangePassword={session?.user?.mustChangePassword ?? false}>
      {children}
    </AdminShell>
  );
}
