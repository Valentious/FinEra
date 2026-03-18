/**
 * FinEra logo text - Fin (white or dark) + Era (green)
 * Use everywhere instead of hardcoding "FinEra"
 */

interface FinEraLogoTextProps {
  /** "dark" = Fin white (on dark bg), "light" = Fin dark (on light bg) */
  variant?: "dark" | "light";
  /** Size class - only used when className doesn't specify text size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Render as span for inline/compact use */
  as?: "h1" | "span";
  /** Custom class name */
  className?: string;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

export function FinEraLogoText({
  variant = "light",
  size = "md",
  as: Component = "h1",
  className = "",
}: FinEraLogoTextProps) {
  return (
    <Component
      className={`finera-logo ${variant === "light" ? "finera-logo-light" : ""} font-bold tracking-tight leading-tight m-0 ${sizeClasses[size]} ${className}`}
    >
      <span className="fin">Fin</span>
      <span className="era">Era</span>
    </Component>
  );
}
