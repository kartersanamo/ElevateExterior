import type { RecurringFrequency } from "@prisma/client";

export const RECURRING_FREQUENCY_OPTIONS: Array<{
  value: RecurringFrequency;
  label: string;
  months: number;
}> = [
  { value: "MONTHLY", label: "Every month", months: 1 },
  { value: "EVERY_2_MONTHS", label: "Every 2 months", months: 2 },
  { value: "EVERY_3_MONTHS", label: "Every 3 months", months: 3 },
  { value: "EVERY_6_MONTHS", label: "Every 6 months", months: 6 },
  { value: "YEARLY", label: "Once a year", months: 12 },
];

export function frequencyToMonths(frequency: RecurringFrequency): number {
  const option = RECURRING_FREQUENCY_OPTIONS.find((o) => o.value === frequency);
  return option?.months ?? 1;
}

export function frequencyLabel(frequency: RecurringFrequency): string {
  return (
    RECURRING_FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ??
    frequency
  );
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function parseDollarsToCents(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Enter a valid amount.");
  }
  return Math.round(parsed * 100);
}
