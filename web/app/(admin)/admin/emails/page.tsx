import { Mail } from "lucide-react";

export default function AdminEmailsPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="relative rounded-2xl border border-slate/10 bg-white px-10 py-12 shadow-sm">
        <div className="blur-[3px]">
          <Mail className="mx-auto text-forest/40" size={48} aria-hidden />
          <h1 className="mt-4 font-display text-3xl font-bold text-forest/40">
            Emails
          </h1>
          <p className="mt-2 text-slate/40">
            Templates, mailing lists, and automated campaigns.
          </p>
        </div>
        <p className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-wide text-slate/60">
          Coming soon
        </p>
      </div>
    </div>
  );
}
