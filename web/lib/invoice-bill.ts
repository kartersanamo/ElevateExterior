import { parseDollarsToCents } from "@/lib/recurring";

export type BillLineItem = {
  description: string;
  amountCents: number;
};

export type BillDiscount =
  | { type: "flat"; amountCents: number }
  | { type: "percent"; percent: number };

export type BillDraftLineItem = {
  id: string;
  description: string;
  amount: string;
};

export type BillDiscountType = "none" | "flat" | "percent";

export function centsToDollarInput(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return "";
  return (cents / 100).toFixed(2);
}

export function parseLineItemAmount(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return parseDollarsToCents(trimmed);
}

export function calculateSubtotalCents(lineItems: BillLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.amountCents, 0);
}

export function calculateDiscountCents(
  subtotalCents: number,
  discount: BillDiscount | null
): number {
  if (!discount || subtotalCents <= 0) return 0;

  if (discount.type === "flat") {
    return Math.min(subtotalCents, discount.amountCents);
  }

  const percent = Math.min(100, Math.max(0, discount.percent));
  return Math.round((subtotalCents * percent) / 100);
}

export function calculateBillTotalCents(
  lineItems: BillLineItem[],
  discount: BillDiscount | null
): number {
  const subtotal = calculateSubtotalCents(lineItems);
  const discountCents = calculateDiscountCents(subtotal, discount);
  return Math.max(0, subtotal - discountCents);
}

export function draftLineItemsToBill(
  items: BillDraftLineItem[]
): BillLineItem[] {
  return items
    .map((item) => ({
      description: item.description.trim(),
      amountCents: parseLineItemAmount(item.amount),
    }))
    .filter((item) => item.description && item.amountCents > 0);
}

export function parseBillLineItemsJson(raw: unknown): BillLineItem[] {
  if (!Array.isArray(raw)) return [];

  const items: BillLineItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const description =
      "description" in entry && typeof entry.description === "string"
        ? entry.description.trim()
        : "";
    const amountCents =
      "amountCents" in entry && typeof entry.amountCents === "number"
        ? Math.round(entry.amountCents)
        : 0;
    if (!description || amountCents <= 0) continue;
    items.push({ description, amountCents });
  }

  return items;
}

export function parseBillDiscountJson(raw: unknown): BillDiscount | null {
  if (!raw || typeof raw !== "object") return null;

  if ("type" in raw && raw.type === "flat" && "amountCents" in raw) {
    const amountCents =
      typeof raw.amountCents === "number" ? Math.round(raw.amountCents) : 0;
    return amountCents > 0 ? { type: "flat", amountCents } : null;
  }

  if ("type" in raw && raw.type === "percent" && "percent" in raw) {
    const percent = typeof raw.percent === "number" ? raw.percent : 0;
    return percent > 0 ? { type: "percent", percent: Math.min(100, percent) } : null;
  }

  return null;
}

export function parseBillFromFormData(formData: FormData): {
  lineItems: BillLineItem[];
  discount: BillDiscount | null;
  amountChargedCents: number;
} {
  const lineItemsRaw = formData.get("invoiceLineItems");
  const discountRaw = formData.get("invoiceDiscount");

  if (typeof lineItemsRaw !== "string" || !lineItemsRaw.trim()) {
    throw new Error("Add at least one bill item with a description and amount.");
  }

  let parsedLineItems: unknown;
  let parsedDiscount: unknown = null;

  try {
    parsedLineItems = JSON.parse(lineItemsRaw);
  } catch {
    throw new Error("Invalid bill line items.");
  }

  if (typeof discountRaw === "string" && discountRaw.trim()) {
    try {
      parsedDiscount = JSON.parse(discountRaw);
    } catch {
      throw new Error("Invalid discount.");
    }
  }

  const lineItems = parseBillLineItemsJson(parsedLineItems);
  if (lineItems.length === 0) {
    throw new Error("Add at least one bill item with a description and amount.");
  }

  const discount = parseBillDiscountJson(parsedDiscount);
  const amountChargedCents = calculateBillTotalCents(lineItems, discount);

  if (amountChargedCents <= 0) {
    throw new Error("Bill total must be greater than zero.");
  }

  return { lineItems, discount, amountChargedCents };
}

export function serializeBillLineItems(lineItems: BillLineItem[]): string {
  return JSON.stringify(lineItems);
}

export function serializeBillDiscount(discount: BillDiscount | null): string {
  return discount ? JSON.stringify(discount) : "";
}
