import { site } from "@/lib/site-config";
import Link from "next/link";

export const metadata = {
  title: `Privacy Policy — ${site.shortName}`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen-safe bg-cream page-top pb-16 safe-bottom">
      <div className="section-padding mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-teal hover:underline">
          ← Home
        </Link>
        <h1 className="mt-6 font-display text-4xl font-bold text-forest">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate/60">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <div className="prose prose-slate mt-10 max-w-none space-y-6 text-slate/80">
          <p>
            {site.legalName} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your
            privacy. This policy explains what information we collect when you use our website,
            request a quote, book a service, or communicate with us.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              Information we collect
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Contact details you provide (name, email, phone, service address)
              </li>
              <li>Service preferences, notes, and appointment times you select</li>
              <li>Photos uploaded for completed jobs or gallery purposes</li>
              <li>
                Payment-related records processed through Stripe (we do not store full card
                numbers)
              </li>
              <li>Basic technical data such as IP address for spam prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              How we use your information
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Respond to quote requests and schedule cleanings</li>
              <li>Send appointment confirmations, invoices, and service updates</li>
              <li>Process payments and recurring service preferences</li>
              <li>Improve our website and customer experience</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              Third-party services
            </h2>
            <p className="mt-3">
              We use trusted providers to operate our business, including Mailgun (email), Stripe
              (payments), and Twilio (optional SMS notifications). These providers process data
              according to their own privacy policies and only as needed to deliver our services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">
              Data retention &amp; your choices
            </h2>
            <p className="mt-3">
              We retain booking and customer records as needed for scheduling, billing, and legal
              obligations. You may request access, correction, or deletion of your information by
              contacting us at{" "}
              <a href={`mailto:${site.email}`} className="text-teal hover:underline">
                {site.email}
              </a>
              .
            </p>
            <p className="mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-forest">Contact</h2>
            <p className="mt-3">
              {site.legalName}
              <br />
              {site.serviceArea}
              <br />
              <a href={`mailto:${site.email}`} className="text-teal hover:underline">
                {site.email}
              </a>
              {" · "}
              <a href={site.phoneHref} className="text-teal hover:underline">
                {site.phone}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
