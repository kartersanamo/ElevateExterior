import { NotificationsManager } from "@/components/admin/NotificationsManager";
import {
  ADMIN_NOTIFICATION_EVENTS,
} from "@/lib/admin-notifications";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stored = await db.adminNotificationPreference.findMany({
    where: { adminUserId: session.user.id },
    select: { event: true, enabled: true },
  });

  const storedByEvent = new Map(stored.map((pref) => [pref.event, pref.enabled]));

  const preferences = ADMIN_NOTIFICATION_EVENTS.map((event) => ({
    event,
    enabled: storedByEvent.get(event) ?? true,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Notifications</h1>
      <p className="mt-2 text-slate/70">
        Control which business alerts you receive by email.
      </p>
      <NotificationsManager
        email={session.user.email ?? ""}
        preferences={preferences}
      />
    </div>
  );
}
