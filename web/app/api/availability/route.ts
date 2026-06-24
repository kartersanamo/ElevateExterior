import {
  getAvailableDates,
  getDaySchedule,
  getMonthSummaries,
  getSlotsForDate,
} from "@/lib/scheduling/slots";
import { site } from "@/lib/site-config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const schedule = searchParams.get("schedule");

  try {
    if (date && schedule === "1") {
      const slots = await getDaySchedule(date);
      return NextResponse.json({ date, schedule: slots });
    }

    if (date) {
      const slots = await getSlotsForDate(date);
      return NextResponse.json({ date, slots });
    }

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      if (!year || !mon) {
        return NextResponse.json({ error: "Invalid month." }, { status: 400 });
      }
      const days = await getMonthSummaries(year, mon);
      return NextResponse.json({ month, days });
    }

    const today = new Date();
    const fromDate = from ?? today.toISOString().slice(0, 10);
    const toDateObj = new Date(today);
    toDateObj.setDate(toDateObj.getDate() + site.bookingHorizonDays);
    const toDate = to ?? toDateObj.toISOString().slice(0, 10);

    const dates = await getAvailableDates(fromDate, toDate);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Unable to load availability." },
      { status: 500 }
    );
  }
}
