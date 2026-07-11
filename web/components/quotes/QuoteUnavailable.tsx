import { site } from "@/lib/site-config";
import Link from "next/link";

export function QuoteUnavailable() {
  return (
    <div className="min-h-screen-safe bg-mint/30 page-top pb-16 safe-bottom">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Link href="/" className="text-sm font-semibold text-teal hover:underline">
          ← {site.shortName}
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold text-forest">
          Quote link unavailable
        </h1>
        <p className="mt-4 text-slate/70">
          This quote link is no longer valid. It may have expired, already been
          accepted, or been replaced with an updated quote.
        </p>
        <p className="mt-2 text-slate/70">
          Check your inbox for a newer email from us, or contact {site.name} and
          we&apos;ll send you a fresh link.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={site.phoneHref}
            className="inline-flex rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal/90"
          >
            Call {site.phone}
          </a>
          <Link
            href="/contact"
            className="inline-flex rounded-lg border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal hover:bg-teal/5"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
