import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct booking is no longer available. Please use the Book Now flow to request a quote.",
    },
    { status: 405 }
  );
}
