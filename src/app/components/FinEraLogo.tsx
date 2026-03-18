import { forwardRef, useId } from "react";

interface FinEraLogoProps {
  /** Logo size: "sm" | "md" | "lg" | "xl" */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show tagline "INCLUSIVE CREDIT" */
  showTagline?: boolean;
  /** "dark" = Fin white (on dark bg), "light" = Fin dark (on light bg) */
  variant?: "dark" | "light";
  /** Custom class name */
  className?: string;
}

const sizes = {
  sm: { width: 160, height: 52, fontSize: 26, taglineSize: 9 },
  md: { width: 220, height: 72, fontSize: 38, taglineSize: 11 },
  lg: { width: 300, height: 100, fontSize: 52, taglineSize: 13 },
  xl: { width: 380, height: 128, fontSize: 66, taglineSize: 15 },
};

export const FinEraLogo = forwardRef<SVGSVGElement, FinEraLogoProps>(
  ({ size = "md", showTagline = true, variant = "dark", className = "" }, ref) => {
    const id = useId().replace(/:/g, "");
    const { width, height, fontSize, taglineSize } = sizes[size];
    const taglineY = fontSize + taglineSize + 14;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className={className}
      >
        <defs>
          <linearGradient id={`eraGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <filter id={`logoShadow-${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        <g filter={`url(#logoShadow-${id})`}>
          <text
            x={width / 2}
            y={fontSize + 2}
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, 'Segoe UI', 'Inter', 'Helvetica Neue', sans-serif"
            fontSize={fontSize}
            fontWeight="700"
            letterSpacing="-0.02em"
          >
            <tspan fill={variant === "light" ? "#0f172a" : "var(--text-white, #FFFFFF)"}>Fin</tspan>
            <tspan fill={`url(#eraGrad-${id})`}>Era</tspan>
          </text>
        </g>

        {showTagline && (
          <g>
            <line
              x1={width * 0.12}
              y1={taglineY}
              x2={width * 0.38}
              y2={taglineY}
              stroke="#F97316"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
            <text
              x={width / 2}
              y={taglineY + 4}
              textAnchor="middle"
              fill="#F97316"
              fontFamily="system-ui, -apple-system, 'Segoe UI', 'Inter', 'Helvetica Neue', sans-serif"
              fontSize={taglineSize}
              fontWeight="600"
              letterSpacing="0.18em"
            >
              INCLUSIVE CREDIT
            </text>
            <line
              x1={width * 0.62}
              y1={taglineY}
              x2={width * 0.88}
              y2={taglineY}
              stroke="#F97316"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    );
  }
);

FinEraLogo.displayName = "FinEraLogo";

/** Full logo on deep navy background - for splash, hero, or marketing */
export function FinEraLogoCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl p-12 ${className}`}
      style={{ backgroundColor: "var(--background-main, #0f172a)" }}
    >
      <FinEraLogo size="xl" showTagline={true} />
    </div>
  );
}
