import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "inverse" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-teal text-white hover:bg-teal-light hover:text-forest shadow-md hover:shadow-lg",
  secondary:
    "bg-forest text-white hover:bg-forest-light shadow-md hover:shadow-lg",
  inverse:
    "bg-white text-forest hover:bg-cream shadow-md hover:shadow-lg",
  ghost:
    "bg-transparent text-white border border-white/60 hover:bg-white/10",
  outline:
    "bg-transparent text-forest border-2 border-forest hover:bg-forest hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm tracking-wide",
  lg: "px-8 py-4 text-base tracking-wide",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 touch-target items-center justify-center rounded-lg font-semibold uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  external?: boolean;
  onClick?: () => void;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
  external = false,
  onClick,
}: ButtonLinkProps) {
  const classes = `inline-flex min-h-11 touch-target items-center justify-center rounded-lg font-semibold uppercase transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
    </Link>
  );
}
