export function formatReminderOffsetLabel(offset: {
  dayOf: boolean;
  minutesBefore: number | null;
  dayOfAtTime: string;
}): string {
  if (offset.dayOf) {
    return `Day of at ${formatTime12(offset.dayOfAtTime)}`;
  }

  const minutes = offset.minutesBefore ?? 0;
  if (minutes === 0) return "At appointment start";
  if (minutes % (24 * 60) === 0) {
    const days = minutes / (24 * 60);
    return `${days} day${days === 1 ? "" : "s"} before`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"} before`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"} before`;
}

function formatTime12(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

export function normalizeDayOfAtTime(value: string): string {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value.trim());
  if (!match) {
    throw new Error("Day-of time must be HH:mm (24-hour).");
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function minutesFromAmount(
  amount: number,
  unit: "minutes" | "hours" | "days"
): number {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    throw new Error("Enter a whole number of 0 or more.");
  }
  if (unit === "minutes") return amount;
  if (unit === "hours") return amount * 60;
  return amount * 24 * 60;
}
