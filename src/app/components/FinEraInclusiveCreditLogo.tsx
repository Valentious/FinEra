import { forwardRef } from "react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";

interface FinEraInclusiveCreditLogoProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Dark mode - adjusts for dark backgrounds */
  dark?: boolean;
  /** Custom class name */
  className?: string;
}

const sizeConfig = {
  sm: {
    iconSize: 40,
    titleSize: "text-base",
    subtitleSize: "text-[10px]",
    gap: "gap-3",
    padding: "p-3",
  },
  md: {
    iconSize: 48,
    titleSize: "text-lg",
    subtitleSize: "text-xs",
    gap: "gap-4",
    padding: "p-4",
  },
  lg: {
    iconSize: 56,
    titleSize: "text-xl",
    subtitleSize: "text-sm",
    gap: "gap-5",
    padding: "p-5",
  },
};

/**
 * FinEra INCLUSIVE FINANCIAL ECOSYSTEM Logo
 * Clean, corporate, fintech-grade design
 * Vertical layout: logo above FinEra text
 */
export const FinEraInclusiveCreditLogo = forwardRef<
  HTMLDivElement,
  FinEraInclusiveCreditLogoProps
>(({ size = "md", dark = false, className = "" }, ref) => {
  const config = sizeConfig[size];
  const iconSize = config.iconSize;

  return (
    <div
      ref={ref}
      className={`
        flex flex-col items-center ${config.gap} ${config.padding}
        rounded-xl
        ${dark ? "bg-slate-800/50" : "bg-slate-100"}
        ${className}
      `}
    >
      {/* Icon: Reusable green shield with tick */}
      <FinEraShieldIcon size={iconSize} className="rounded-xl" />

      {/* Text block */}
      <div className="hero-header flex flex-col items-center justify-center text-center min-w-0">
        <FinEraLogoText
          variant={dark ? "dark" : "light"}
          size="md"
          className={config.titleSize}
        />
        <p
          className={`
            inclusive-text font-extrabold tracking-wide mt-2 mb-0
            ${config.subtitleSize}
            ${dark ? "text-slate-300" : "text-slate-600"}
          `}
        >
          INCLUSIVE FINANCIAL ECOSYSTEM
        </p>
        <p
          className={`
            mt-1 font-medium
            ${config.subtitleSize}
            ${dark ? "text-slate-400" : "text-slate-500"}
          `}
        >
          For Formal Institutions
        </p>
      </div>
    </div>
  );
});

FinEraInclusiveCreditLogo.displayName = "FinEraInclusiveCreditLogo";
