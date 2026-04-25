import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { cn } from "@/app/components/ui/utils";

export type FinEraBrandMarkSurface = "onDark" | "onLight";

export interface FinEraBrandMarkProps {
  className?: string;
  surface?: FinEraBrandMarkSurface;
  /** Set `false` to hide the “INCLUSIVE CREDIT” line. */
  showSubline?: boolean;
  /** Overrides default “INCLUSIVE CREDIT” when `showSubline` is true. */
  sublineText?: string;
  /** @deprecated No-op; retained so existing callers do not break. */
  finClassName?: string;
  /** @deprecated No-op; retained so existing callers do not break. */
  extraHexClassName?: string;
}

/**
 * FinEra presentation: shield + FinEra wordmark (FinEraLogoText) + optional INCLUSIVE CREDIT.
 */
export function FinEraBrandMark({
  className,
  surface = "onDark",
  showSubline = true,
  sublineText = "INCLUSIVE CREDIT",
  finClassName: _fin,
  extraHexClassName: _hex,
}: FinEraBrandMarkProps) {
  const shieldSize = surface === "onLight" ? 48 : 56;
  const wordSize = surface === "onLight" ? "md" : "lg";
  const sublineClass =
    surface === "onLight"
      ? "inclusive-text finera-inclusive-credit-tagline text-xs font-semibold tracking-[0.2em] uppercase mt-2 mb-0"
      : "text-xs font-semibold tracking-[0.2em] uppercase mt-2 mb-0 text-[#9fe8c0] drop-shadow-sm";

  return (
    <div className={cn("flex w-full flex-col items-center text-center", className)}>
      <FinEraShieldIcon size={shieldSize} className={cn("mb-4 shrink-0 rounded-xl drop-shadow-sm sm:mb-5")} />
      <FinEraLogoText variant="light" size={wordSize} />
      {showSubline ? (
        <p
          className={sublineClass}
          style={surface === "onDark" ? { textShadow: "0 0 20px color-mix(in srgb, #4ade80 15%, transparent)" } : undefined}
        >
          {sublineText}
        </p>
      ) : null}
    </div>
  );
}
