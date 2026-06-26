import { site } from "@/lib/site-config";
import Link from "next/link";

export const metadata = {
  title: `Terms of Service — ${site.shortName}`,
};

export default function TermsPage() {
  return (
    <div className="min-h-screen-safe bg-cream page-top pb-16 safe-bottom">
      <div className="section-padding mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-teal hover:underline">
          ← Home
        </Link>
        <h1 className="mt-6 font-display text-4xl font-bold text-forest">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate/60">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <div className="prose prose-slate mt-10 max-w-none space-y-6 text-slate/80">
          <p>
            By using the {site.name} website or booking our services, you agree to these terms.
            If you do not agree, please do not use our site or services.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">Services</h2>
            <p className="mt-3">
              We provide exterior cleaning services in {site.serviceArea}. Quotes are estimates
              based on the information you provide; final pricing may be confirmed before work
              begins. Appointment times are subject to weather, access, and scheduling
              availability.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              Quotes &amp; bookings
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Requesting a quote may temporarily hold your preferred time slot until the quote
                expires or is accepted
              </li>
              <li>Accepted quotes create a confirmed appointment</li>
              <li>
                You may reschedule or cancel through your appointment link, subject to our
                scheduling policies
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">Payment</h2>
            <p className="mt-3">
              Payment for completed services is processed securely through Stripe. You agree to
              provide accurate billing information and authorize charges for agreed-upon services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              Property access &amp; satisfaction
            </h2>
            <p className="mt-3">
              You are responsible for providing safe access to the work area, including gates,
              pets, and water supply where applicable. We stand behind our work—if something
              isn&apos;t right, contact us promptly so we can make it right.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              Limitation of liability
            </h2>
            <p className="mt-3">
              To the fullest extent permitted by law, {site.legalName} is not liable for
              indirect or consequential damages. Our liability for any claim related to our
              services is limited to the amount paid for the specific service giving rise to the
              claim. We maintain appropriate insurance for our operations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">Contact</h2>
            <p className="mt-3">
              Questions about these terms? Email{" "}
              <a href={`mailto:${site.email}`} className="text-teal hover:underline">
                {site.email}
              </a>{" "}
              or call{" "}
              <a href={site.phoneHref} className="text-teal hover:underline">
                {site.phone}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
