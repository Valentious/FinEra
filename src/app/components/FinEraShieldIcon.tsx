/**
 * FinEra brand shield icon - green with white tick/checkmark.
 * Single source of truth for logo/icon consistency across the app.
 */

interface FinEraShieldIconProps {
  size?: number;
  className?: string;
}

const BRAND_GREEN = "#22C55E";
const BRAND_GREEN_DARK = "#16a34a";

export function FinEraShieldIcon({ size = 40, className = "" }: FinEraShieldIconProps) {
  return (
    <div
      className={`flex-shrink-0 rounded-xl shadow-md flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${BRAND_GREEN_DARK} 0%, ${BRAND_GREEN} 100%)`,
        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-[70%] h-[70%]"
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
  );
}
