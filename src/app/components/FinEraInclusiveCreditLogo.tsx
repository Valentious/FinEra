import { forwardRef } from "react";

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
 * FinEra INCLUSIVE CREDIT Logo
 * Clean, corporate, fintech-grade design (Stripe/PayPal style)
 * Horizontal layout: icon (left) + text (right)
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
        inline-flex items-center ${config.gap} ${config.padding}
        rounded-xl
        ${dark ? "bg-slate-800/50" : "bg-slate-100"}
        ${className}
      `}
    >
      {/* Icon: Rounded square with gradient, shield + checkmark */}
      <div
        className="flex-shrink-0 rounded-xl shadow-md"
        style={{
          width: iconSize,
          height: iconSize,
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
          boxShadow: "0 2px 8px rgba(30, 58, 95, 0.25)",
        }}
      >
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full p-2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield outline */}
          <path
            d="M24 6L8 12v10c0 8 6 14 16 18 10-4 16-10 16-18V12L24 6z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Checkmark inside shield */}
          <path
            d="M16 24l6 6 12-12"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text block */}
      <div className="flex flex-col justify-center min-w-0">
        <h1
          className={`
            font-bold tracking-tight leading-tight
            ${config.titleSize}
            ${dark ? "text-white" : "text-slate-900"}
          `}
        >
          <span className="tracking-wide">FinEra</span>{" "}
          <span className="font-extrabold">INCLUSIVE CREDIT</span>
        </h1>
        <p
          className={`
            mt-0.5 font-medium
            ${config.subtitleSize}
            ${dark ? "text-slate-400" : "text-slate-500"}
          `}
        >
          For Formal Institutions/Organisation
        </p>
      </div>
    </div>
  );
});

FinEraInclusiveCreditLogo.displayName = "FinEraInclusiveCreditLogo";
