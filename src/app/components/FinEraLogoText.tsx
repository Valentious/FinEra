/**
 * FinEra logo text — default: "Fin" light, "Era" brand green. Use `allGreen` for the full word in green.
 * Colours come from `index.css` under `.finera-logo` (and `.finera-logo--all-green` when set).
 */

interface FinEraLogoTextProps {
  /** "light" adds `finera-logo-light` for any layout hooks; "Fin" is always white via CSS. */
  variant?: "dark" | "light";
  /** Size class - only used when className doesn't specify text size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Render as span for inline/compact use */
  as?: "h1" | "span";
  /** Custom class name */
  className?: string;
  /**
   * Entire wordmark in brand green (overrides default white "Fin" + green "Era").
   * Use for glass / gradient cards where a solid green mark reads better.
   */
  allGreen?: boolean;
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
  allGreen = false,
}: FinEraLogoTextProps) {
  return (
    <Component
      className={`finera-logo ${!allGreen && variant === "light" ? "finera-logo-light" : ""} ${allGreen ? "finera-logo--all-green" : ""} font-bold tracking-tight leading-tight m-0 ${sizeClasses[size]} ${className}`}
    >
      <span className="fin">Fin</span>
      <span className="era">Era</span>
    </Component>
  );
}
