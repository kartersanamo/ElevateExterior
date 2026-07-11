import { QuoteAcceptPanel } from "@/components/quotes/QuoteAcceptPanel";
import { QuoteUnavailable } from "@/components/quotes/QuoteUnavailable";
import { findQuoteByLinkToken } from "@/lib/quote-lookup";
import { site } from "@/lib/site-config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await findQuoteByLinkToken(token);

  if (!quote) return <QuoteUnavailable />;

  const hasProposedSlot = Boolean(
    quote.proposedDate && quote.proposedStartTime && quote.proposedEndTime
  );

  return (
    <div className="min-h-screen-safe bg-mint/30 page-top pb-16 safe-bottom">
      <div className="mx-auto max-w-3xl px-6">
        <Link href="/" className="text-sm font-semibold text-teal hover:underline">
          ← {site.shortName}
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">Your quote</p>
          <h1 className="font-display text-3xl font-bold text-forest">
            Hi {quote.customerName}
          </h1>
          <p className="mt-2 text-slate/70">
            Review your quote from {site.name} and book when you&apos;re ready.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-forest">Your request</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate/70">{quote.message}</p>
        </section>

        {quote.status === "QUOTED" && quote.quotedAmountCents != null ? (
          <div className="mt-8">
            <QuoteAcceptPanel
              token={quote.publicToken}
              amountCents={quote.quotedAmountCents}
              servicesJson={quote.services}
              quoteNotes={quote.quoteNotes}
              hasProposedSlot={hasProposedSlot}
              proposedDate={quote.proposedDate?.toISOString() ?? null}
              proposedStartTime={quote.proposedStartTime}
              proposedEndTime={quote.proposedEndTime}
            />
          </div>
        ) : quote.status === "ACCEPTED" ? (
          <div className="mt-8 rounded-2xl bg-mint px-6 py-8 text-center">
            <p className="font-display text-xl font-bold text-forest">Quote accepted</p>
            <p className="mt-2 text-sm text-slate/70">Your appointment is confirmed.</p>
          </div>
        ) : quote.status === "DECLINED" ? (
          <div className="mt-8 rounded-2xl bg-slate/10 px-6 py-8 text-center text-sm text-slate/70">
            This quote was declined. Contact us anytime to request a new quote.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
            We&apos;re preparing your quote — you&apos;ll receive an email when it&apos;s ready.
          </div>
        )}
      </div>
    </div>
  );
}
