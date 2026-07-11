"use server";

import { auth } from "@/lib/auth";
import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import {
  sendQuoteAcceptedEmails,
  sendQuoteToCustomer,
} from "@/lib/quote-mail";
import { sendBookingConfirmedEmail } from "@/lib/booking-mail";
import {
  bookingToEmailPayload,
  describeTimeSlotConflict,
} from "@/lib/scheduling/slots";
import { parseDollarsToCents } from "@/lib/recurring";
import { findQuoteByLinkToken } from "@/lib/quote-lookup";
import { generatePublicToken } from "@/lib/tokens";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

function quoteHoldExpiry(days: number): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}

export type SendQuoteResult =
  | { ok: true; token: string }
  | { ok: false; needsConfirmation: true; message: string };

export async function sendQuote(data: {
  quoteId: string;
  amount: string;
  services: string[];
  quoteNotes?: string;
  proposedDate?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  confirmUnavailableSlot?: boolean;
}): Promise<SendQuoteResult> {
  await requireAdmin();

  const quote = await db.quoteRequest.findUnique({ where: { id: data.quoteId } });
  if (!quote) throw new Error("Quote request not found.");
  if (quote.status !== "PENDING" && quote.status !== "QUOTED") {
    throw new Error("This quote can no longer be updated.");
  }

  if (!data.amount.trim()) {
    throw new Error("Enter a quote amount before sending.");
  }

  const quotedAmountCents = parseDollarsToCents(data.amount);

  let serviceIds = data.services;
  if (serviceIds.length === 0) {
    try {
      serviceIds = JSON.parse(quote.services) as string[];
    } catch {
      serviceIds = [];
    }
  }
  if (serviceIds.length === 0) {
    throw new Error("Select at least one service.");
  }

  let proposedDate: Date | null = null;
  if (data.proposedDate) {
    const [y, m, d] = data.proposedDate.split("-").map(Number);
    proposedDate = new Date(Date.UTC(y, m - 1, d));
  } else if (quote.proposedDate) {
    proposedDate = quote.proposedDate;
  }

  const proposedStartTime = (
    data.proposedStartTime ||
    quote.proposedStartTime ||
    null
  )?.slice(0, 5) ?? null;
  const proposedEndTime = (
    data.proposedEndTime ||
    quote.proposedEndTime ||
    null
  )?.slice(0, 5) ?? null;

  if (proposedDate && proposedStartTime && proposedEndTime) {
    const dateStr = proposedDate.toISOString().slice(0, 10);
    const conflictMessage = await describeTimeSlotConflict(
      dateStr,
      proposedStartTime,
      proposedEndTime,
      { excludeQuoteId: data.quoteId }
    );

    if (conflictMessage) {
      if (conflictMessage === "End time must be after start time.") {
        throw new Error(conflictMessage);
      }
      if (!data.confirmUnavailableSlot) {
        return { ok: false, needsConfirmation: true, message: conflictMessage };
      }
    }
  }

  const updated = await db.quoteRequest.update({
    where: { id: data.quoteId },
    data: {
      status: "QUOTED",
      quotedAmountCents,
      services: JSON.stringify(serviceIds),
      quoteNotes: data.quoteNotes?.trim() || null,
      proposedDate,
      proposedStartTime: proposedStartTime || null,
      proposedEndTime: proposedEndTime || null,
      quotedAt: new Date(),
      holdExpiresAt: quoteHoldExpiry(7),
    },
  });

  try {
    await sendQuoteToCustomer(updated);
  } catch (error) {
    console.error("Quote email error:", error);
    throw new Error("Quote saved but email could not be sent. Check Mailgun settings.");
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/quote/${updated.publicToken}`);
  return { ok: true as const, token: updated.publicToken };
}

export type AcceptQuoteResult =
  | { ok: true; bookingId: string; appointmentToken: string }
  | { ok: false; error: string; needsNewSlot?: boolean };

export async function acceptQuote(data: {
  token: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
}): Promise<AcceptQuoteResult> {
  const quote = await findQuoteByLinkToken(data.token);

  if (!quote) return { ok: false, error: "Quote not found." };
  if (quote.status !== "QUOTED") {
    return { ok: false, error: "This quote is no longer available." };
  }
  if (quote.bookingId) {
    return { ok: false, error: "This quote has already been accepted." };
  }

  const serviceIds = JSON.parse(quote.services) as string[];
  const scheduledDateStr =
    data.scheduledDate ?? quote.proposedDate?.toISOString().slice(0, 10);
  const startTime = (data.startTime ?? quote.proposedStartTime)?.slice(0, 5);
  const endTime = (data.endTime ?? quote.proposedEndTime)?.slice(0, 5);

  if (!scheduledDateStr || !startTime || !endTime) {
    return { ok: false, error: "Please select a date and time to book." };
  }

  const conflict = await describeTimeSlotConflict(
    scheduledDateStr,
    startTime,
    endTime,
    { excludeQuoteId: quote.id, allowCustomRange: true }
  );
  if (conflict) {
    return {
      ok: false,
      error: "That time slot is no longer available. Please pick another.",
      needsNewSlot: true,
    };
  }

  const [y, m, d] = scheduledDateStr.split("-").map(Number);
  const scheduledDate = new Date(Date.UTC(y, m - 1, d));
  const publicToken = generatePublicToken();

  const booking = await db.booking.create({
    data: {
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone ?? "",
      address: quote.address ?? "Address to confirm",
      services: JSON.stringify(serviceIds),
      notes: quote.quoteNotes
        ? `From quote ${quote.id}. ${quote.quoteNotes}`
        : `From quote ${quote.id}.`,
      scheduledDate,
      startTime,
      endTime,
      status: "CONFIRMED",
      amountChargedCents: quote.quotedAmountCents,
      publicToken,
    },
  });

  await db.quoteRequest.update({
    where: { id: quote.id },
    data: {
      status: "ACCEPTED",
      bookingId: booking.id,
      respondedAt: new Date(),
    },
  });

  try {
    await upsertCustomer({
      email: quote.customerEmail,
      name: quote.customerName,
      phone: quote.customerPhone,
      address: quote.address,
      source: "contact",
    });
  } catch (error) {
    console.error("Customer upsert error:", error);
  }

  try {
    await sendBookingConfirmedEmail(bookingToEmailPayload(booking));
    await sendQuoteAcceptedEmails(quote);
  } catch (error) {
    console.error("Quote accept email error:", error);
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/bookings");
  revalidatePath(`/quote/${quote.publicToken}`);
  revalidatePath(`/appointments/${publicToken}`);

  return {
    ok: true,
    bookingId: booking.id,
    appointmentToken: publicToken,
  };
}

export async function declineQuote(token: string) {
  const quote = await findQuoteByLinkToken(token);
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "QUOTED") {
    throw new Error("This quote is no longer available.");
  }

  await db.quoteRequest.update({
    where: { id: quote.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  revalidatePath("/admin/quotes");
  revalidatePath(`/quote/${quote.publicToken}`);
  return { ok: true };
}

export async function releaseQuoteHold(quoteId: string) {
  await requireAdmin();

  const quote = await db.quoteRequest.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "PENDING" && quote.status !== "QUOTED") {
    throw new Error("This quote hold cannot be released.");
  }

  await db.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status: "EXPIRED",
      proposedDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      holdExpiresAt: null,
    },
  });

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/bookings");
  return { ok: true };
}
