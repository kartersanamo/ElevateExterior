import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import { sendQuoteRequestNotification } from "@/lib/quote-mail";
import type { QuoteRequest } from "@prisma/client";
import { z } from "zod";

const angiInterviewSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const angiLeadSchema = z.object({
  name: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  postalCode: z.string().min(1),
  primaryPhone: z.string().min(1),
  phoneExt: z.string().optional(),
  secondaryPhone: z.string().optional(),
  secondaryPhoneExt: z.string().optional(),
  email: z.string().email(),
  srOid: z.number().int(),
  leadOid: z.number().int(),
  fee: z.union([z.number(), z.string()]).optional(),
  taskName: z.string().min(1),
  comments: z.string(),
  matchType: z.string().optional(),
  leadDescription: z.string().optional(),
  spEntityId: z.number().int().optional(),
  spCompanyName: z.string().optional(),
  contactStatus: z.string().optional(),
  crmKey: z.string().optional(),
  leadSource: z.string().optional(),
  trustedFormURL: z.string().optional(),
  trustedFormUrl: z.string().optional(),
  interview: z.array(angiInterviewSchema).optional(),
  automatedContactCompliant: z.boolean().optional(),
  automatedContactConsentId: z.string().optional(),
});

export type AngiLeadPayload = z.infer<typeof angiLeadSchema>;

export function buildAngiMessage(payload: AngiLeadPayload): string {
  const parts: string[] = [];

  parts.push(`Service requested: ${payload.taskName}`);

  if (payload.leadDescription?.trim()) {
    parts.push(`Lead type: ${payload.leadDescription.trim()}`);
  }

  if (payload.matchType?.trim()) {
    parts.push(`Match type: ${payload.matchType.trim()}`);
  }

  if (payload.comments?.trim()) {
    parts.push(`Customer comments:\n${payload.comments.trim()}`);
  }

  if (payload.interview && payload.interview.length > 0) {
    const qa = payload.interview
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join("\n\n");
    parts.push(`Interview:\n${qa}`);
  }

  if (payload.leadSource?.trim()) {
    parts.push(`Angi lead source: ${payload.leadSource.trim()}`);
  }

  if (payload.fee !== undefined && payload.fee !== null && payload.fee !== "") {
    parts.push(`Lead fee: ${payload.fee}`);
  }

  return parts.join("\n\n");
}

export function buildAngiAddress(payload: AngiLeadPayload): string {
  return `${payload.address}, ${payload.city}, ${payload.stateProvince} ${payload.postalCode}`;
}

export function mapAngiLeadToQuoteData(payload: AngiLeadPayload) {
  return {
    source: "angi" as const,
    externalLeadId: String(payload.leadOid),
    customerName: payload.name.trim(),
    customerEmail: payload.email.trim().toLowerCase(),
    customerPhone: payload.primaryPhone.trim(),
    address: buildAngiAddress(payload),
    services: "[]",
    message: buildAngiMessage(payload),
    status: "PENDING" as const,
  };
}

export async function importAngiLead(
  payload: AngiLeadPayload
): Promise<{ quote: QuoteRequest; created: boolean }> {
  const externalLeadId = String(payload.leadOid);

  const existing = await db.quoteRequest.findUnique({
    where: { externalLeadId },
  });

  if (existing) {
    return { quote: existing, created: false };
  }

  const quote = await db.quoteRequest.create({
    data: mapAngiLeadToQuoteData(payload),
  });

  try {
    await upsertCustomer({
      email: quote.customerEmail,
      name: quote.customerName,
      phone: quote.customerPhone,
      address: quote.address,
      source: "angi",
    });
  } catch (error) {
    console.error("Angi customer upsert error:", error);
  }

  try {
    await sendQuoteRequestNotification(quote);
  } catch (error) {
    console.error("Angi quote notification error:", error);
  }

  return { quote, created: true };
}
