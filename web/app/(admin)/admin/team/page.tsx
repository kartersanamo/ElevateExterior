import { TeamManager } from "@/components/admin/TeamManager";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const admins = await db.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Team</h1>
      <p className="mt-2 text-slate/70">
        Manage admin logins for all three co-founders.
      </p>
      <TeamManager
        admins={admins.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
