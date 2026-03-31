/**
 * Meaning-based palette — consistent across Admin (Figma foundations).
 * Green: safe / active | Red: risk / suspended | Yellow: warning | Blue: system / neutral
 */
export const adminColors = {
  safe: "#059669",
  risk: "#dc2626",
  warning: "#d97706",
  system: "#2563eb",
  neutral: "#64748b",
  surface: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
} as const;

export type AdminNavId =
  | "dashboard"
  | "users"
  | "wallets"
  | "credit"
  | "agents"
  | "risk"
  | "transactions"
  | "audit"
  | "settings";
