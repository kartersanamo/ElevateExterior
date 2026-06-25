import { upsertCustomer } from "@/lib/customers";
import { sendContactFormEmail } from "@/lib/contact-mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request-ip";
import { contactSchema } from "@/lib/validators/contact";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, message, website } =
      parsed.data;

    if (website && website.length > 0) {
      return NextResponse.json(
        { error: "Unable to process request." },
        { status: 400 }
      );
    }

    const limit = parseInt(
      process.env.CONTACT_RATE_LIMIT_PER_HOUR ?? "5",
      10
    );
    const ip = getClientIpFromRequest(request);
    if (!checkRateLimit(`contact:${ip}`, limit)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    try {
      await upsertCustomer({
        email,
        name: `${firstName} ${lastName}`.trim(),
        phone,
        source: "contact",
      });
    } catch (error) {
      console.error("Customer upsert error:", error);
    }

    try {
      await sendContactFormEmail({
        firstName,
        lastName,
        email,
        phone,
        message,
        website: "",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "MAILGUN_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "Contact form is temporarily unavailable. Please call or email us directly.",
          },
          { status: 503 }
        );
      }
      if (error instanceof Error && error.message === "NO_CONTACT_RECIPIENTS") {
        return NextResponse.json(
          {
            error:
              "Contact form is temporarily unavailable. Please call or email us directly.",
          },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
