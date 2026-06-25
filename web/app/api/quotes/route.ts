import { createQuoteRequest } from "@/lib/quote-intake";
import { getClientIpFromRequest } from "@/lib/request-ip";
import { quoteRequestSchema } from "@/lib/validators/contact";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = quoteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quote request.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ip = getClientIpFromRequest(request);

    try {
      const quote = await createQuoteRequest({
        ...parsed.data,
        clientIp: ip,
      });

      return NextResponse.json({ ok: true, token: quote.publicToken });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Quote request failed.";
      const status =
        message.includes("Too many requests") ||
        message.includes("Unable to process")
          ? message.includes("Too many")
            ? 429
            : 400
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
  } catch (error) {
    console.error("Quote request error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
