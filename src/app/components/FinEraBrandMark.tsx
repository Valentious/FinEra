import type { CSSProperties } from "react";
import { FinEraLogo } from "./FinEraLogo";
import { FinEraShieldIcon } from "./FinEraShieldIcon";
import { cn } from "@/app/components/ui/utils";

export type FinEraBrandMarkSurface = "onDark" | "onLight";

export interface FinEraBrandMarkProps {
  className?: string;
  /**
   * `onDark` / `onLight` map to `FinEraLogo`’s `variant` for the SVG. “Fin” stays white; “Inclusive Credit” is styled in `index.css` (black).
   */
  surface?: FinEraBrandMarkSurface;
  /** Set `false` to hide the “Inclusive Credit” line (e.g. operating mode). */
  showSubline?: boolean;
}

const BRAND_SUBLINE_STYLE: CSSProperties = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Inter', 'Helvetica Neue', sans-serif",
};

/**
 * Shared FinEra lockup: circular green shield + “FinEra” + optional “Inclusive Credit” (black, global classes).
 */
export function FinEraBrandMark({
  className,
  surface = "onDark",
  showSubline = true,
}: FinEraBrandMarkProps) {
  const logoVariant = surface === "onLight" ? "light" : "dark";
  return (
    <div
      className={cn(
        "mb-4 flex flex-col items-center gap-0 sm:mb-5",
        showSubline ? "w-full max-w-md" : "w-auto max-w-none",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-row flex-nowrap items-center gap-0",
          showSubline
            ? "w-full max-w-sm justify-center sm:max-w-md"
            : "w-auto max-w-none justify-start"
        )}
      >
        <FinEraShieldIcon
          variant="circle"
          dimensionClassName="h-11 w-11 self-center sm:h-12 sm:w-12"
          innerSvgClassName="h-[90%] w-[90%]"
          className="shrink-0 shadow-sm"
        />
        <FinEraLogo
          size="lg"
          showTagline={false}
          wordmarkAlign="start"
          variant={logoVariant}
          className="h-11 w-auto min-w-0 shrink-0 self-center sm:h-[4.5rem]"
        />
      </div>
      {showSubline && (
        <p
          className="finera-inclusive-credit-tagline -mt-1.5 w-full text-center text-xs font-semibold leading-none tracking-wide sm:-mt-2 sm:text-sm"
          style={BRAND_SUBLINE_STYLE}
        >
          Inclusive Credit
        </p>
      )}
    </div>
  );
}
