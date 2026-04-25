/**
 * FinEra brand shield icon with a bold "F" monogram.
 * Single source of truth for logo/icon consistency across the app.
 */

import { cn } from "@/app/components/ui/utils";

interface FinEraShieldIconProps {
  size?: number;
  /** When set, width/height come from Tailwind (e.g. `h-10 w-10 sm:h-12 sm:w-12`) instead of the `size` prop. */
  dimensionClassName?: string;
  /**
   * Classes for the inner white shield SVG. Default is `w-[70%] h-[70%]`; use a larger
   * percentage to shrink the visible green margin around the shield.
   */
  innerSvgClassName?: string;
  /** `circle` = full circular green badge (e.g. splash). Default = rounded square. */
  variant?: "default" | "circle";
  className?: string;
}

const BRAND_GREEN = "#22C55E";
const BRAND_GREEN_DARK = "#16a34a";

export function FinEraShieldIcon({
  size = 40,
  dimensionClassName,
  innerSvgClassName,
  variant = "default",
  className = "",
}: FinEraShieldIconProps) {
  const sizeFromClass = Boolean(dimensionClassName);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center shadow-md",
        variant === "circle" ? "rounded-full" : "rounded-xl",
        sizeFromClass && "aspect-square",
        dimensionClassName,
        className
      )}
      style={{
        ...(sizeFromClass ? {} : { width: size, height: size }),
        background: `linear-gradient(135deg, ${BRAND_GREEN_DARK} 0%, ${BRAND_GREEN} 100%)`,
        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className={cn("h-[70%] w-[70%]", innerSvgClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* White shield */}
        <path
          d="M24 6L8 12v10c0 8 6 14 16 18 10-4 16-10 16-18V12L24 6z"
          fill="white"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Minimal geometric F monogram */}
        <path
          d="M18 34V14h13v4H22v4h8v4h-8v8h-4z"
          fill={BRAND_GREEN_DARK}
        />
      </svg>
    </div>
  );
}
