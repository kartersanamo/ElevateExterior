import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { getGoogleReviewUrl } from "@/lib/google-review";
import { site } from "@/lib/site-config";
import { Star } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Leave a Review",
  description: `Share your experience with ${site.name} on Google. Your feedback helps neighbors find trusted exterior cleaning.`,
};

export default async function ReviewPage() {
  const reviewUrl = await getGoogleReviewUrl();

  return (
    <div className="min-h-screen-safe bg-cream page-top pb-16 safe-bottom">
      <section className="section-padding bg-forest text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-light">
            Google reviews
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            Love your results? Tell your neighbors.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            A quick Google review helps local families find a crew they can trust
            — and it means the world to our small business.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-teal-light">
            <Star size={18} className="fill-teal-light text-teal-light" aria-hidden />
            {site.socialProof}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-2xl">
          {reviewUrl ? (
            <div className="rounded-3xl border border-slate/10 bg-white p-10 text-center shadow-lg md:p-14">
              <h2 className="font-display text-2xl font-bold text-forest md:text-3xl">
                Share your experience on Google
              </h2>
              <p className="mt-4 text-slate/70 leading-relaxed">
                It only takes a minute. Tap below to open our Google Business
                profile and leave your honest review.
              </p>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target mt-10 inline-flex w-full max-w-md items-center justify-center rounded-xl bg-teal px-10 py-5 text-lg font-bold uppercase tracking-wide text-white shadow-md transition-colors hover:bg-teal-light md:w-auto"
              >
                Leave a Google review
              </a>
              <p className="mt-6 text-sm text-slate/50">
                Opens Google in a new tab
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate/10 bg-white p-10 text-center shadow-lg">
              <h2 className="font-display text-2xl font-bold text-forest">
                We&apos;d love your feedback
              </h2>
              <p className="mt-4 text-slate/70">
                Our Google review link is being set up. In the meantime, reach out
                and tell us how we did — we read every message.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <ButtonLink href="/contact" variant="primary" size="lg">
                  Contact us
                </ButtonLink>
                <ButtonLink href={site.phoneHref} variant="outline" size="lg">
                  Call {site.phone}
                </ButtonLink>
              </div>
            </div>
          )}

          <p className="mt-10 text-center text-sm text-slate/60">
            <Link href="/" className="font-semibold text-teal hover:underline">
              ← Back to {site.shortName}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
