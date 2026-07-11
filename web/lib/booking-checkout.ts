import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type { Booking } from "@prisma/client";
import type Stripe from "stripe";

const CHECKOUT_CURRENCY = "usd";

function defaultPriceId(product: Stripe.Product): string {
  const defaultPrice = product.default_price;
  if (typeof defaultPrice === "string") return defaultPrice;
  if (defaultPrice?.id) return defaultPrice.id;

  throw new Error("STRIPE_DEFAULT_PRICE_MISSING");
}

async function priceMatchesBookingAmount(
  priceId: string,
  amountCents: number
): Promise<boolean> {
  const price = await getStripe().prices.retrieve(priceId);
  return (
    price.active &&
    price.currency === CHECKOUT_CURRENCY &&
    price.unit_amount === amountCents
  );
}

async function findStoredPriceId(
  booking: Booking,
  amountCents: number
): Promise<string | null> {
  if (booking.stripePriceId) {
    const priceIsCurrent = await priceMatchesBookingAmount(
      booking.stripePriceId,
      amountCents
    );
    if (priceIsCurrent) return booking.stripePriceId;
  }

  if (!booking.stripeProductId) return null;

  const product = await getStripe().products.retrieve(booking.stripeProductId);
  if ("deleted" in product) return null;

  const priceId = defaultPriceId(product);
  const priceIsCurrent = await priceMatchesBookingAmount(priceId, amountCents);
  if (!priceIsCurrent) return null;

  await db.booking.update({
    where: { id: booking.id },
    data: { stripePriceId: priceId },
  });

  return priceId;
}

function checkoutProductName(booking: Booking): string {
  return `Exterior cleaning - ${booking.customerName}`;
}

function checkoutProductDescription(booking: Booking): string {
  const serviceDate = booking.scheduledDate.toISOString().slice(0, 10);
  return `Service on ${serviceDate}`;
}

export async function ensureBookingCheckoutPrice(booking: Booking): Promise<string> {
  const amountCents = booking.amountChargedCents;
  if (!amountCents || amountCents <= 0) {
    throw new Error("BOOKING_AMOUNT_REQUIRED");
  }

  const storedPriceId = await findStoredPriceId(booking, amountCents);
  if (storedPriceId) return storedPriceId;

  const product = await getStripe().products.create({
    name: checkoutProductName(booking),
    description: checkoutProductDescription(booking),
    default_price_data: {
      currency: CHECKOUT_CURRENCY,
      unit_amount: amountCents,
    },
    metadata: {
      bookingId: booking.id,
      publicToken: booking.publicToken ?? "",
    },
  });

  const priceId = defaultPriceId(product);
  await db.booking.update({
    where: { id: booking.id },
    data: {
      stripeProductId: product.id,
      stripePriceId: priceId,
    },
  });

  return priceId;
}
