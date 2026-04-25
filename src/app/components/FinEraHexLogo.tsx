import { useId } from "react";
import { cn } from "@/app/components/ui/utils";

type FinEraHexLogoSize = "sm" | "md" | "lg" | "hero";

const SIZE_CLASS: Record<FinEraHexLogoSize, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11 sm:h-12 sm:w-12",
  lg: "h-12 w-12 sm:h-14 sm:w-14",
  hero: "h-14 w-14 sm:h-16 sm:w-16",
};

export type FinEraHexLogoProps = {
  className?: string;
  size?: FinEraHexLogoSize;
};

/**
 * Green hex, white border, white “F” — same asset as the splash; used across the app.
 */
export function FinEraHexLogo({ className, size = "md" }: FinEraHexLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `fhex-grad-${uid}`;
  const shId = `fhex-sh-${uid}`;

  return (
    <svg
      className={cn("shrink-0", SIZE_CLASS[size], className)}
      viewBox="0 0 64 64"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1ea34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <filter id={shId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>
      <polygon
        points="32,10 50.2,20.5 50.2,43.5 32,54 13.8,43.5 13.8,20.5"
        fill={`url(#${gradId})`}
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <text
        x="32"
        y="39.5"
        textAnchor="middle"
        fill="#ffffff"
        filter={`url(#${shId})`}
        style={{
          fontSize: "20px",
          fontWeight: 800,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        F
      </text>
    </svg>
  );
}
