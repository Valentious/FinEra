import { adminColors } from "../design-system/tokens";

type Level = "Low" | "Medium" | "High";

const map: Record<Level, string> = {
  Low: adminColors.safe,
  Medium: adminColors.warning,
  High: adminColors.risk,
};

export function RiskTag({ level }: { level: Level }) {
  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: map[level] }}
    >
      {level}
    </span>
  );
}
