import { markBookingPaidFromCheckout } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        await markBookingPaidFromCheckout(session);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook error." }, { status: 400 });
  }
}
