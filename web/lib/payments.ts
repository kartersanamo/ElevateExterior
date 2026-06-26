import { db } from "@/lib/db";
import { sendReviewRequest } from "@/lib/review-mail";
import type Stripe from "stripe";
import {
  buildInvoiceHtml,
  generateInvoiceNumber,
} from "@/lib/invoice";
import { sendInvoiceEmail } from "@/lib/job-mail";

export async function markBookingPaidFromCheckout(
  session: Stripe.Checkout.Session
): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.paidAt) return;

  const paidAt = new Date();
  const invoiceNumber =
    booking.invoiceNumber ?? generateInvoiceNumber(booking.id);
  const invoiceHtml =
    booking.invoiceHtml ??
    buildInvoiceHtml(
      { ...booking, amountChargedCents: booking.amountChargedCents ?? 0 },
      invoiceNumber,
      paidAt
    );

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      paidAt,
      stripeCheckoutSessionId: session.id,
      invoiceNumber,
      invoiceHtml,
    },
  });

  try {
    await sendInvoiceEmail(updated, invoiceHtml);
  } catch (error) {
    console.error("Invoice email error:", error);
  }

  if (!updated.reviewRequestSentAt) {
    try {
      await sendReviewRequest(updated);
      await db.booking.update({
        where: { id: bookingId },
        data: { reviewRequestSentAt: new Date() },
      });
    } catch (error) {
      console.error("Review request error:", error);
    }
  }
}
