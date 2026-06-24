"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendManualEmail } from "@/lib/email/send";
import type { EmailAudience, EmailTrigger } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}) {
  await requireAdmin();

  if (!data.name.trim() || !data.subject.trim() || !data.bodyHtml.trim()) {
    throw new Error("Name, subject, and body are required.");
  }

  await db.emailTemplate.create({
    data: {
      name: data.name.trim(),
      subject: data.subject.trim(),
      bodyHtml: data.bodyHtml.trim(),
      bodyText: data.bodyText?.trim() || null,
    },
  });

  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function updateEmailTemplate(
  id: string,
  data: {
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
  }
) {
  await requireAdmin();

  await db.emailTemplate.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      subject: data.subject?.trim(),
      bodyHtml: data.bodyHtml?.trim(),
      bodyText: data.bodyText?.trim() || null,
    },
  });

  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function deleteEmailTemplate(id: string) {
  await requireAdmin();
  await db.emailTemplate.delete({ where: { id } });
  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function createEmailList(data: {
  name: string;
  description?: string;
}) {
  await requireAdmin();

  if (!data.name.trim()) throw new Error("List name is required.");

  await db.emailList.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    },
  });

  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function deleteEmailList(id: string) {
  await requireAdmin();
  await db.emailList.delete({ where: { id } });
  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function addEmailListMember(data: {
  listId: string;
  email: string;
  name?: string;
}) {
  await requireAdmin();

  const email = data.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required.");

  await db.emailListMember.upsert({
    where: { listId_email: { listId: data.listId, email } },
    create: {
      listId: data.listId,
      email,
      name: data.name?.trim() || null,
    },
    update: { name: data.name?.trim() || null },
  });

  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function removeEmailListMember(memberId: string) {
  await requireAdmin();
  await db.emailListMember.delete({ where: { id: memberId } });
  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function createEmailAutomation(data: {
  name: string;
  trigger: EmailTrigger;
  daysOffset?: number | null;
  audience: EmailAudience;
  templateId: string;
  listId?: string | null;
  enabled?: boolean;
}) {
  await requireAdmin();

  if (!data.name.trim()) throw new Error("Automation name is required.");

  if (
    (data.trigger === "DAYS_BEFORE_APPOINTMENT" ||
      data.trigger === "DAYS_AFTER_APPOINTMENT") &&
    (data.daysOffset === undefined || data.daysOffset === null)
  ) {
    throw new Error("Days offset is required for scheduled automations.");
  }

  if (data.audience === "EMAIL_LIST" && !data.listId) {
    throw new Error("Select an email list for list-based automations.");
  }

  await db.emailAutomation.create({
    data: {
      name: data.name.trim(),
      trigger: data.trigger,
      daysOffset: data.daysOffset ?? null,
      audience: data.audience,
      templateId: data.templateId,
      listId: data.audience === "EMAIL_LIST" ? data.listId : null,
      enabled: data.enabled ?? true,
    },
  });

  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function updateEmailAutomation(
  id: string,
  data: {
    name?: string;
    enabled?: boolean;
    trigger?: EmailTrigger;
    daysOffset?: number | null;
    audience?: EmailAudience;
    templateId?: string;
    listId?: string | null;
  }
) {
  await requireAdmin();

  await db.emailAutomation.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      enabled: data.enabled,
      trigger: data.trigger,
      daysOffset: data.daysOffset,
      audience: data.audience,
      templateId: data.templateId,
      listId: data.listId,
    },
  });

  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function deleteEmailAutomation(id: string) {
  await requireAdmin();
  await db.emailAutomation.delete({ where: { id } });
  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function sendManualCampaign(data: {
  templateId: string;
  listId?: string;
  recipientEmails?: string[];
}) {
  await requireAdmin();

  const result = await sendManualEmail({
    templateId: data.templateId,
    listId: data.listId,
    recipientEmails: data.recipientEmails,
  });

  revalidatePath("/admin/emails");
  return result;
}
