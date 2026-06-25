import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import {
  sendQuoteRequestConfirmation,
  sendQuoteRequestNotification,
} from "@/lib/quote-mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { services } from "@/lib/site-config";
import {
  quoteRequestSchema,
  type QuoteRequestFormData,
} from "@/lib/validators/contact";
import type { QuoteRequest } from "@prisma/client";

export type QuoteIntakeInput = QuoteRequestFormData & { clientIp?: string };

function buildMessage(data: QuoteRequestFormData): string {
  const serviceTitles = data.services
    .map((id) => services.find((s) => s.id === id)?.title ?? id)
    .join(", ");

  const parts = [`Services requested: ${serviceTitles}`];
  if (data.notes?.trim()) {
    parts.push(data.notes.trim());
  }
  return parts.join("\n\n");
}

export async function createQuoteRequest(
  input: QuoteIntakeInput
): Promise<QuoteRequest> {
  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid quote request data.");
  }

  const data = parsed.data;

  if (data.website && data.website.length > 0) {
    throw new Error("Unable to process request.");
  }

  if (input.clientIp && !checkRateLimit(`quote:${input.clientIp}`, 5)) {
    throw new Error("Too many requests. Please try again later.");
  }

  const [y, m, d] = data.scheduledDate.split("-").map(Number);
  const proposedDate = new Date(Date.UTC(y, m - 1, d));

  const quote = await db.quoteRequest.create({
    data: {
      customerName: data.customerName,
      customerEmail: data.customerEmail.toLowerCase(),
      customerPhone: data.customerPhone,
      address: data.address,
      services: JSON.stringify(data.services),
      message: buildMessage(data),
      proposedDate,
      proposedStartTime: data.startTime,
      proposedEndTime: data.endTime,
      status: "PENDING",
    },
  });

  try {
    await upsertCustomer({
      email: data.customerEmail,
      name: data.customerName,
      phone: data.customerPhone,
      address: data.address,
      source: "quote",
    });
  } catch (error) {
    console.error("Customer upsert error:", error);
  }

  try {
    await sendQuoteRequestNotification(quote);
    await sendQuoteRequestConfirmation(quote);
  } catch (error) {
    console.error("Quote request email error:", error);
  }

  return quote;
}
