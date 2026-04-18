import type { CheckedState } from "@radix-ui/react-checkbox";

/** Radix checkbox emits `true` | `false` | `"indeterminate"` — only `true` means checked. */
export function isCheckboxChecked(state: CheckedState): boolean {
  return state === true;
}
