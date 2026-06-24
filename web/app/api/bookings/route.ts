import { sendBookingSubmittedEmails } from "@/lib/booking-mail";
import { upsertCustomer } from "@/lib/customers";
import { db } from "@/lib/db";
import { runAutomationForBooking } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request-ip";
import {
  bookingToEmailPayload,
  getSlotsForDate,
} from "@/lib/scheduling/slots";
import { bookingSchema } from "@/lib/validators/contact";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.website && data.website.length > 0) {
      return NextResponse.json(
        { error: "Unable to process request." },
        { status: 400 }
      );
    }

    const ip = getClientIpFromRequest(request);
    if (!checkRateLimit(`booking:${ip}`, 5)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const slots = await getSlotsForDate(data.scheduledDate);
    const slotValid = slots.some(
      (s) => s.startTime === data.startTime && s.endTime === data.endTime
    );

    if (!slotValid) {
      return NextResponse.json(
        { error: "That time slot is no longer available. Please pick another." },
        { status: 409 }
      );
    }

    const [y, m, d] = data.scheduledDate.split("-").map(Number);
    const scheduledDate = new Date(Date.UTC(y, m - 1, d));

    const booking = await db.booking.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        address: data.address,
        services: JSON.stringify(data.services),
        notes: data.notes || null,
        scheduledDate,
        startTime: data.startTime,
        endTime: data.endTime,
        status: "PENDING",
      },
    });

    try {
      await upsertCustomer({
        email: data.customerEmail,
        name: data.customerName,
        phone: data.customerPhone,
        address: data.address,
        source: "booking",
      });
    } catch (error) {
      console.error("Customer upsert error:", error);
    }

    try {
      await sendBookingSubmittedEmails(bookingToEmailPayload(booking));
    } catch (error) {
      console.error("Booking email error:", error);
    }

    try {
      await runAutomationForBooking("ON_BOOKING_REQUESTED", booking);
    } catch (error) {
      console.error("Booking automation error:", error);
    }

    return NextResponse.json({ ok: true, id: booking.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
