"use client";

import {
  calculateBillTotalCents,
  calculateDiscountCents,
  calculateSubtotalCents,
  centsToDollarInput,
  draftLineItemsToBill,
  parseBillDiscountJson,
  type BillDiscountType,
  type BillDraftLineItem,
} from "@/lib/invoice-bill";
import { formatCents } from "@/lib/recurring";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

function createLineItem(
  description = "",
  amount = ""
): BillDraftLineItem {
  return {
    id: crypto.randomUUID(),
    description,
    amount,
  };
}

function parseDiscountValue(
  type: BillDiscountType,
  value: string
): ReturnType<typeof parseBillDiscountJson> {
  if (type === "none" || !value.trim()) return null;

  if (type === "flat") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return { type: "flat", amountCents: Math.round(parsed * 100) };
  }

  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return { type: "percent", percent: Math.min(100, parsed) };
}

export function BillBuilder({
  initialDescription,
  initialAmountCents,
}: {
  initialDescription: string;
  initialAmountCents: number | null;
}) {
  const [lineItems, setLineItems] = useState<BillDraftLineItem[]>(() => [
    createLineItem(initialDescription, centsToDollarInput(initialAmountCents)),
  ]);
  const [discountType, setDiscountType] = useState<BillDiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");

  const bill = useMemo(() => {
    const items = draftLineItemsToBill(lineItems);
    const discount = parseDiscountValue(discountType, discountValue);
    const subtotalCents = calculateSubtotalCents(items);
    const discountCents = calculateDiscountCents(subtotalCents, discount);
    const totalCents = calculateBillTotalCents(items, discount);

    return { items, discount, subtotalCents, discountCents, totalCents };
  }, [discountType, discountValue, lineItems]);

  const updateLineItem = (
    id: string,
    field: "description" | "amount",
    value: string
  ) => {
    setLineItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addLineItem = () => {
    setLineItems((current) => [...current, createLineItem()]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id)
    );
  };

  return (
    <section className="rounded-2xl border border-slate/10 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-forest">Amount charged</h2>
      <p className="mt-1 text-sm text-slate/60">
        Build the customer&apos;s bill. The total below is what they will pay online via Stripe.
      </p>

      <div className="mt-5 space-y-3">
        <div className="hidden gap-3 text-xs font-semibold uppercase tracking-wide text-slate/50 sm:grid sm:grid-cols-[1fr_8rem_2.5rem]">
          <span>Description</span>
          <span>Amount</span>
          <span className="sr-only">Remove</span>
        </div>

        {lineItems.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-xl border border-slate/10 bg-cream/30 p-3 sm:grid-cols-[1fr_8rem_2.5rem] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate/50 sm:sr-only">
                Description
              </label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                placeholder={index === 0 ? "Service description" : "Extra charge description"}
                className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate/50 sm:sr-only">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/50">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={item.amount}
                  onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate/20 py-2 pl-8 pr-3 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeLineItem(item.id)}
              disabled={lineItems.length === 1}
              className="flex h-10 w-10 items-center justify-center self-end rounded-lg text-slate/40 hover:bg-slate/5 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 sm:self-center"
              aria-label="Remove line item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLineItem}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate/25 px-3 py-2 text-sm font-semibold text-teal hover:border-teal/40 hover:bg-teal/5"
      >
        <Plus className="h-4 w-4" />
        Add line item
      </button>

      <div className="mt-6 rounded-xl border border-slate/10 bg-slate/5 p-4">
        <p className="text-sm font-semibold text-forest">Discount</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="discount-type" className="mb-1 block text-xs font-medium text-slate/50">
              Type
            </label>
            <select
              id="discount-type"
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value as BillDiscountType);
                if (e.target.value === "none") setDiscountValue("");
              }}
              className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
            >
              <option value="none">No discount</option>
              <option value="flat">Flat amount</option>
              <option value="percent">Percentage off</option>
            </select>
          </div>
          {discountType !== "none" ? (
            <div>
              <label htmlFor="discount-value" className="mb-1 block text-xs font-medium text-slate/50">
                {discountType === "flat" ? "Amount off" : "Percent off"}
              </label>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/50">
                  {discountType === "flat" ? "$" : "%"}
                </span>
                <input
                  id="discount-value"
                  type="text"
                  inputMode="decimal"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "flat" ? "0.00" : "10"}
                  className="w-full rounded-lg border border-slate/20 py-2 pl-8 pr-3 text-sm"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <dl className="mt-6 space-y-2 border-t border-slate/10 pt-4 text-sm">
        <div className="flex items-center justify-between text-slate/70">
          <dt>Subtotal</dt>
          <dd>{formatCents(bill.subtotalCents)}</dd>
        </div>
        {bill.discountCents > 0 ? (
          <div className="flex items-center justify-between text-teal">
            <dt>Discount</dt>
            <dd>-{formatCents(bill.discountCents)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-slate/10 pt-2 font-display text-lg font-bold text-forest">
          <dt>Total charged</dt>
          <dd>{formatCents(bill.totalCents)}</dd>
        </div>
      </dl>

      <input
        type="hidden"
        name="invoiceLineItems"
        value={JSON.stringify(bill.items)}
      />
      <input
        type="hidden"
        name="invoiceDiscount"
        value={bill.discount ? JSON.stringify(bill.discount) : ""}
      />
    </section>
  );
}
