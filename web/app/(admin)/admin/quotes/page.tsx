import { QuoteManager } from "@/components/admin/QuoteManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const quotes = await db.quoteRequest.findMany({
    where: { status: { in: ["PENDING", "QUOTED"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Quotes</h1>
      <p className="mt-2 text-slate/70">
        Review customer requests, adjust details if needed, set a price, and send the
        quote back.
      </p>
      <QuoteManager
        quotes={quotes.map((q) => ({
          ...q,
          createdAt: q.createdAt.toISOString(),
          proposedDate: q.proposedDate?.toISOString() ?? null,
          holdExpiresAt: q.holdExpiresAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
