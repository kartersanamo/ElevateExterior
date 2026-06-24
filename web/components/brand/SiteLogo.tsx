import { Sparkles } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/site-config";

interface SiteLogoProps {
  linked?: boolean;
  className?: string;
  light?: boolean;
}

export function SiteLogo({
  linked = false,
  className = "",
  light = true,
}: SiteLogoProps) {
  const textClass = light ? "text-white" : "text-forest";
  const accentClass = light ? "text-teal-light" : "text-teal";

  const content = (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      <Sparkles className={`h-6 w-6 shrink-0 ${accentClass}`} aria-hidden />
      <span className={textClass}>
        Elevate<span className={accentClass}>Exterior</span>
      </span>
    </span>
  );

  if (linked) {
    return (
      <Link href="/" aria-label={`${site.name} home`}>
        {content}
      </Link>
    );
  }

  return content;
}
