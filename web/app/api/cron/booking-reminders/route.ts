import { processBookingReminders } from "@/lib/booking-reminders";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processBookingReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Booking reminder cron failed:", error);
    return NextResponse.json(
      { error: "Failed to process booking reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
