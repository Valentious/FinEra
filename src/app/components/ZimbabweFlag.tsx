/**
 * Zimbabwe national flag - vector SVG
 * Stripes: green, gold, red, black, red, gold, green
 * White triangle with black fimbriation, red star, Zimbabwe Bird (gold)
 */
interface ZimbabweFlagProps {
  height?: number;
  className?: string;
}

export function ZimbabweFlag({ height = 16, className = "" }: ZimbabweFlagProps) {
  const aspectRatio = 2; // Zimbabwe flag 1:2 ratio
  const width = height * aspectRatio;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 10"
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 7 equal stripes: green, gold, red, black, red, gold, green */}
      <rect x="3.5" y="0" width="16.5" height="1.43" fill="#006400" />
      <rect x="3.5" y="1.43" width="16.5" height="1.43" fill="#FFD700" />
      <rect x="3.5" y="2.86" width="16.5" height="1.43" fill="#DC143C" />
      <rect x="3.5" y="4.29" width="16.5" height="1.43" fill="#000000" />
      <rect x="3.5" y="5.72" width="16.5" height="1.43" fill="#DC143C" />
      <rect x="3.5" y="7.15" width="16.5" height="1.43" fill="#FFD700" />
      <rect x="3.5" y="8.58" width="16.5" height="1.42" fill="#006400" />
      {/* White triangle with black fimbriation (hoist) */}
      <path d="M 0 0 L 3.5 5 L 0 10 Z" fill="#000000" />
      <path d="M 0.15 0.15 L 3.35 5 L 0.15 9.85 Z" fill="#FFFFFF" />
      {/* Red star (5-pointed) centered in triangle */}
      <path
        d="M 1.75 4.2 L 1.9 4.8 L 2.5 4.6 L 2.1 5 L 2.25 5.5 L 1.75 5.2 L 1.25 5.5 L 1.4 5 L 1 4.6 L 1.6 4.8 Z"
        fill="#DC143C"
      />
      {/* Zimbabwe Bird (golden soapstone bird silhouette) */}
      <path
        d="M 1.75 4.9 L 1.85 5.1 L 2.1 5 L 1.9 5.2 L 2 5.35 L 1.75 5.25 L 1.5 5.35 L 1.6 5.2 L 1.4 5 L 1.65 5.1 Z"
        fill="#FFD700"
      />
    </svg>
  );
}
