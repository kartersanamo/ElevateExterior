import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site-config";

interface SiteLogoProps {
  linked?: boolean;
  className?: string;
  /** @deprecated Logo image works on all backgrounds */
  light?: boolean;
  size?: "sm" | "md" | "lg";
}

const heightClass = {
  sm: "h-9",
  md: "h-10 md:h-11",
  lg: "h-12 md:h-14",
} as const;

export function SiteLogo({
  linked = false,
  className = "",
  size = "md",
}: SiteLogoProps) {
  const content = (
    <Image
      src="/logo.png"
      alt={site.name}
      width={1024}
      height={845}
      className={`w-auto object-contain ${heightClass[size]} ${className}`}
      priority
    />
  );

  if (linked) {
    return (
      <Link href="/" aria-label={`${site.name} home`} className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
