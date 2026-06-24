import { EmailManager } from "@/components/admin/EmailManager";
import { db } from "@/lib/db";
import { getRecentSendLogs } from "@/lib/email/send";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const [templates, lists, automations, sendLogs, customerCount] = await Promise.all([
    db.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    db.emailList.findMany({
      include: { members: { orderBy: { email: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.emailAutomation.findMany({
      include: { template: true, list: true },
      orderBy: { createdAt: "desc" },
    }),
    getRecentSendLogs(50),
    db.customer.count(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Emails</h1>
      <p className="mt-2 text-slate/70">
        Templates, mailing lists, automated reminders, and manual campaigns.
      </p>
      <EmailManager
        templates={templates}
        lists={lists}
        automations={automations}
        sendLogs={sendLogs.map((log) => ({
          ...log,
          sentAt: log.sentAt.toISOString(),
        }))}
        customerCount={customerCount}
      />
    </div>
  );
}
