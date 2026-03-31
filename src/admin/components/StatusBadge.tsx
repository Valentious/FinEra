import { adminColors } from "../design-system/tokens";

type Status = "Active" | "Suspended" | "Flagged" | "Review";

const map: Record<Status, { bg: string; fg: string }> = {
  Active: { bg: `${adminColors.safe}22`, fg: adminColors.safe },
  Suspended: { bg: `${adminColors.risk}22`, fg: adminColors.risk },
  Flagged: { bg: `${adminColors.warning}22`, fg: adminColors.warning },
  Review: { bg: `${adminColors.system}22`, fg: adminColors.system },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = map[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}
