interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  const textClass = light ? "text-white" : "text-slate";
  const subClass = light ? "text-white/80" : "text-slate/70";

  return (
    <div className={`max-w-3xl mb-12 ${alignClass}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight ${textClass}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-4 text-lg leading-relaxed ${subClass}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}
