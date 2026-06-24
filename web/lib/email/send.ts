import { db } from "@/lib/db";
import { renderTemplate, type TemplateVars } from "@/lib/email/render";
import {
  getContactRecipients,
  getMailFromAddress,
  getMailgunClient,
} from "@/lib/mailgun";
import { formatDateLong, formatTime12 } from "@/lib/scheduling/dates";
import type { Booking, EmailAutomation, EmailTemplate } from "@prisma/client";

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const mailgun = getMailgunClient();
  const from = getMailFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;

  if (!mailgun || !from || !domain) {
    throw new Error("MAILGUN_NOT_CONFIGURED");
  }

  await mailgun.messages.create(domain, {
    from,
    to: [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text ?? options.html.replace(/<[^>]+>/g, ""),
  });
}

export async function sendTemplateEmail(options: {
  template: Pick<EmailTemplate, "id" | "subject" | "bodyHtml" | "bodyText">;
  to: string;
  vars: TemplateVars;
  automationId?: string;
  bookingId?: string;
  manual?: boolean;
}) {
  const subject = renderTemplate(options.template.subject, options.vars);
  const html = renderTemplate(options.template.bodyHtml, options.vars);
  const text = options.template.bodyText
    ? renderTemplate(options.template.bodyText, options.vars)
    : undefined;

  await sendMail({ to: options.to, subject, html, text });

  await db.emailSendLog.create({
    data: {
      recipientEmail: options.to.toLowerCase(),
      subject,
      templateId: options.template.id,
      automationId: options.automationId ?? null,
      bookingId: options.bookingId ?? null,
      manual: options.manual ?? false,
    },
  });
}

function bookingVars(booking: Booking, services?: string): TemplateVars {
  const dateStr = booking.scheduledDate.toISOString().slice(0, 10);
  return {
    name: booking.customerName,
    email: booking.customerEmail,
    phone: booking.customerPhone,
    address: booking.address,
    date: formatDateLong(dateStr),
    time: `${formatTime12(booking.startTime)} – ${formatTime12(booking.endTime)}`,
    services,
  };
}

async function getAutomationRecipients(
  automation: EmailAutomation
): Promise<Array<{ email: string; name: string }>> {
  if (automation.audience === "EMAIL_LIST" && automation.listId) {
    const members = await db.emailListMember.findMany({
      where: { listId: automation.listId },
    });
    return members.map((m) => ({
      email: m.email,
      name: m.name ?? m.email,
    }));
  }

  const customers = await db.customer.findMany({
    orderBy: { name: "asc" },
  });
  return customers.map((c) => ({ email: c.email, name: c.name }));
}

export async function runAutomationForBooking(
  trigger: "ON_BOOKING_REQUESTED" | "ON_BOOKING_CONFIRMED",
  booking: Booking
) {
  const automations = await db.emailAutomation.findMany({
    where: { enabled: true, trigger },
    include: { template: true },
  });

  const services = JSON.parse(booking.services) as string[];
  const vars = bookingVars(booking, services.join(", "));

  for (const automation of automations) {
    const recipients = await getAutomationRecipients(automation);
    const target = recipients.find(
      (r) => r.email.toLowerCase() === booking.customerEmail.toLowerCase()
    );
    if (!target) continue;

    const existing = await db.emailSendLog.findFirst({
      where: {
        automationId: automation.id,
        bookingId: booking.id,
        recipientEmail: target.email.toLowerCase(),
      },
    });
    if (existing) continue;

    try {
      await sendTemplateEmail({
        template: automation.template,
        to: target.email,
        vars,
        automationId: automation.id,
        bookingId: booking.id,
      });
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error);
    }
  }
}

export async function processScheduledAutomations() {
  const automations = await db.emailAutomation.findMany({
    where: {
      enabled: true,
      trigger: { in: ["DAYS_BEFORE_APPOINTMENT", "DAYS_AFTER_APPOINTMENT"] },
    },
    include: { template: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let sent = 0;

  for (const automation of automations) {
    const offset = automation.daysOffset ?? 0;
    const target = new Date(today);

    if (automation.trigger === "DAYS_BEFORE_APPOINTMENT") {
      target.setDate(target.getDate() + offset);
    } else {
      target.setDate(target.getDate() - offset);
    }

    const dayStart = new Date(
      Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const status =
      automation.trigger === "DAYS_BEFORE_APPOINTMENT"
        ? "CONFIRMED"
        : "COMPLETED";

    const bookings = await db.booking.findMany({
      where: {
        status,
        scheduledDate: { gte: dayStart, lt: dayEnd },
      },
    });

    for (const booking of bookings) {
      const services = JSON.parse(booking.services) as string[];
      const vars = bookingVars(booking, services.join(", "));

      const existing = await db.emailSendLog.findFirst({
        where: {
          automationId: automation.id,
          bookingId: booking.id,
          recipientEmail: booking.customerEmail.toLowerCase(),
        },
      });
      if (existing) continue;

      try {
        await sendTemplateEmail({
          template: automation.template,
          to: booking.customerEmail,
          vars,
          automationId: automation.id,
          bookingId: booking.id,
        });
        sent += 1;
      } catch (error) {
        console.error(`Scheduled automation ${automation.id} failed:`, error);
      }
    }
  }

  return { sent };
}

export async function sendManualEmail(options: {
  templateId: string;
  listId?: string;
  recipientEmails?: string[];
}) {
  const template = await db.emailTemplate.findUnique({
    where: { id: options.templateId },
  });
  if (!template) throw new Error("Template not found.");

  let recipients: Array<{ email: string; name: string }> = [];

  if (options.recipientEmails?.length) {
    recipients = options.recipientEmails.map((email) => ({
      email,
      name: email,
    }));
  } else if (options.listId) {
    const members = await db.emailListMember.findMany({
      where: { listId: options.listId },
    });
    recipients = members.map((m) => ({
      email: m.email,
      name: m.name ?? m.email,
    }));
  } else {
    const customers = await db.customer.findMany();
    recipients = customers.map((c) => ({ email: c.email, name: c.name }));
  }

  if (recipients.length === 0) {
    throw new Error("No recipients selected.");
  }

  let sent = 0;
  for (const recipient of recipients) {
    const customer = await db.customer.findUnique({
      where: { email: recipient.email.toLowerCase() },
    });

    try {
      await sendTemplateEmail({
        template,
        to: recipient.email,
        vars: {
          name: customer?.name ?? recipient.name,
          email: recipient.email,
          phone: customer?.phone ?? "",
          address: customer?.address ?? "",
        },
        manual: true,
      });
      sent += 1;
    } catch (error) {
      console.error(`Manual send to ${recipient.email} failed:`, error);
    }
  }

  return { sent, total: recipients.length };
}

export async function getRecentSendLogs(limit = 50) {
  return db.emailSendLog.findMany({
    orderBy: { sentAt: "desc" },
    take: limit,
  });
}
