import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}
