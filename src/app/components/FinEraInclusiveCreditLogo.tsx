import { forwardRef } from "react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";

interface FinEraInclusiveCreditLogoProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Dark mode - adjusts shell background */
  dark?: boolean;
  /** Custom class name */
  className?: string;
}

const sizePadding: Record<NonNullable<FinEraInclusiveCreditLogoProps["size"]>, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const shieldSize: Record<NonNullable<FinEraInclusiveCreditLogoProps["size"]>, number> = {
  sm: 40,
  md: 48,
  lg: 52,
};

const wordSize: Record<NonNullable<FinEraInclusiveCreditLogoProps["size"]>, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

/**
 * FinEra INCLUSIVE CREDIT — shield + FinEra wordmark + subline, in a card shell (original presentation).
 */
export const FinEraInclusiveCreditLogo = forwardRef<HTMLDivElement, FinEraInclusiveCreditLogoProps>(
  ({ size = "md", dark = false, className = "" }, ref) => {
    const configPad = sizePadding[size];

    return (
      <div
        ref={ref}
        className={`
        flex flex-col items-center ${configPad}
        rounded-xl
        ${dark ? "bg-slate-800/50" : "bg-slate-100"}
        ${className}
      `}
      >
        <div className="hero-header flex min-w-0 flex-col items-center justify-center gap-2 text-center">
          <div className="flex flex-nowrap items-center justify-center gap-0">
            <FinEraShieldIcon size={shieldSize[size]} className="shrink-0 rounded-xl" />
            <FinEraLogoText
              variant="light"
              size={wordSize[size]}
              as="span"
              className="inline !m-0 align-middle leading-none"
            />
          </div>
          <p
            className={`
            inclusive-text finera-inclusive-credit-tagline mb-0 mt-1 font-semibold uppercase tracking-[0.2em]
            ${size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"}
            ${dark ? "text-muted-foreground" : "text-muted-foreground"}
          `}
          >
            INCLUSIVE CREDIT
          </p>
          <p
            className={`
            mb-0 mt-0 font-medium
            ${size === "sm" ? "text-xs" : size === "md" ? "text-xs" : "text-sm"}
            ${dark ? "text-muted-foreground" : "text-muted-foreground"}
          `}
          >
            Formal Institutions Hub
          </p>
        </div>
      </div>
    );
  }
);

FinEraInclusiveCreditLogo.displayName = "FinEraInclusiveCreditLogo";
