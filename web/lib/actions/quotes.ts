"use server";

import { auth } from "@/lib/auth";
import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import {
  sendQuoteAcceptedEmails,
  sendQuoteToCustomer,
} from "@/lib/quote-mail";
import { sendBookingConfirmedEmail } from "@/lib/booking-mail";
import { bookingToEmailPayload, getSlotsForDate } from "@/lib/scheduling/slots";
import { parseDollarsToCents } from "@/lib/recurring";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function sendQuote(data: {
  quoteId: string;
  amount: string;
  services: string[];
  quoteNotes?: string;
  proposedDate?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
}) {
  await requireAdmin();

  const quote = await db.quoteRequest.findUnique({ where: { id: data.quoteId } });
  if (!quote) throw new Error("Quote request not found.");
  if (quote.status !== "PENDING" && quote.status !== "QUOTED") {
    throw new Error("This quote can no longer be updated.");
  }

  const quotedAmountCents = parseDollarsToCents(data.amount);
  if (data.services.length === 0) {
    throw new Error("Select at least one service.");
  }

  let proposedDate: Date | null = null;
  if (data.proposedDate) {
    const [y, m, d] = data.proposedDate.split("-").map(Number);
    proposedDate = new Date(Date.UTC(y, m - 1, d));
  }

  const updated = await db.quoteRequest.update({
    where: { id: data.quoteId },
    data: {
      status: "QUOTED",
      quotedAmountCents,
      services: JSON.stringify(data.services),
      quoteNotes: data.quoteNotes?.trim() || null,
      proposedDate,
      proposedStartTime: data.proposedStartTime || null,
      proposedEndTime: data.proposedEndTime || null,
      quotedAt: new Date(),
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
  return { ok: true, token: updated.publicToken };
}

export async function acceptQuote(data: {
  token: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
}) {
  const quote = await db.quoteRequest.findUnique({
    where: { publicToken: data.token },
  });

  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "QUOTED") {
    throw new Error("This quote is no longer available.");
  }
  if (quote.bookingId) {
    throw new Error("This quote has already been accepted.");
  }

  const serviceIds = JSON.parse(quote.services) as string[];
  const scheduledDateStr = data.scheduledDate ?? quote.proposedDate?.toISOString().slice(0, 10);
  const startTime = data.startTime ?? quote.proposedStartTime;
  const endTime = data.endTime ?? quote.proposedEndTime;

  if (!scheduledDateStr || !startTime || !endTime) {
    throw new Error("Please select a date and time to book.");
  }

  const slots = await getSlotsForDate(scheduledDateStr);
  const slotValid = slots.some(
    (s) => s.startTime === startTime && s.endTime === endTime
  );
  if (!slotValid) {
    throw new Error("That time slot is no longer available. Please pick another.");
  }

  const [y, m, d] = scheduledDateStr.split("-").map(Number);
  const scheduledDate = new Date(Date.UTC(y, m - 1, d));

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
  revalidatePath(`/quote/${data.token}`);

  return { ok: true, bookingId: booking.id };
}

export async function declineQuote(token: string) {
  const quote = await db.quoteRequest.findUnique({ where: { publicToken: token } });
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "QUOTED") {
    throw new Error("This quote is no longer available.");
  }

  await db.quoteRequest.update({
    where: { id: quote.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  revalidatePath("/admin/quotes");
  revalidatePath(`/quote/${token}`);
  return { ok: true };
}
