import {
  angiLeadSchema,
  importAngiLead,
} from "@/lib/angi-intake";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function angiSuccessResponse() {
  return NextResponse.json({ status: "success" });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANGI_WEBHOOK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const providedKey = request.headers.get("x-api-key");
  if (!providedKey || providedKey !== apiKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = angiLeadSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Angi webhook validation error:", parsed.error.flatten());
    return NextResponse.json({ error: "Invalid lead payload." }, { status: 400 });
  }

  try {
    await importAngiLead(parsed.data);
    return angiSuccessResponse();
  } catch (error) {
    console.error("Angi webhook import error:", error);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
