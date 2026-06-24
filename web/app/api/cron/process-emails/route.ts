import { processScheduledAutomations } from "@/lib/email/send";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processScheduledAutomations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Email cron error:", error);
    return NextResponse.json(
      { error: "Failed to process emails." },
      { status: 500 }
    );
  }
}
