import { db } from "@/lib/db";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Online payments are not configured yet." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const token = body.token as string | undefined;
    if (!token) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { publicToken: token },
    });

    if (!booking || booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (booking.paidAt) {
      return NextResponse.json({ error: "Already paid." }, { status: 409 });
    }
    if (!booking.amountChargedCents || booking.amountChargedCents <= 0) {
      return NextResponse.json({ error: "No amount due." }, { status: 400 });
    }

    const siteUrl = getSiteUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: booking.amountChargedCents,
            product_data: {
              name: `Exterior cleaning — ${booking.customerName}`,
              description: `Service on ${booking.scheduledDate.toISOString().slice(0, 10)}`,
            },
          },
        },
      ],
      metadata: { bookingId: booking.id, publicToken: token },
      success_url: `${siteUrl}/appointments/${token}?paid=1`,
      cancel_url: `${siteUrl}/appointments/${token}`,
    });

    await db.booking.update({
      where: { id: booking.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 }
    );
  }
}
