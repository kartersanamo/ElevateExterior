import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site-config";
import { Calendar, Mail, Phone } from "lucide-react";

export function QuickContact() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <a
        href={site.phoneHref}
        className="group flex flex-col items-center rounded-2xl border border-slate/10 bg-cream p-6 text-center transition-shadow hover:shadow-lg"
      >
        <span className="mb-4 inline-flex rounded-xl bg-teal/10 p-3 text-teal transition-colors group-hover:bg-teal group-hover:text-white">
          <Phone size={24} aria-hidden />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate/60">
          Call
        </span>
        <span className="mt-1 font-semibold text-forest">{site.phone}</span>
      </a>

      <a
        href={`mailto:${site.email}`}
        className="group flex flex-col items-center rounded-2xl border border-slate/10 bg-cream p-6 text-center transition-shadow hover:shadow-lg"
      >
        <span className="mb-4 inline-flex rounded-xl bg-teal/10 p-3 text-teal transition-colors group-hover:bg-teal group-hover:text-white">
          <Mail size={24} aria-hidden />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate/60">
          Email
        </span>
        <span className="mt-1 font-semibold text-forest break-all">
          {site.email}
        </span>
      </a>

      <ButtonLink
        href="/book"
        variant="outline"
        className="flex h-full flex-col items-center justify-center rounded-2xl border-slate/10 bg-cream p-6 text-center hover:shadow-lg"
      >
        <span className="mb-4 inline-flex rounded-xl bg-teal/10 p-3 text-teal">
          <Calendar size={24} aria-hidden />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate/60">
          Book online
        </span>
        <span className="mt-1 font-semibold normal-case">Schedule a visit</span>
      </ButtonLink>
    </div>
  );
}
