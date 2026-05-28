import type { ReactNode } from "react";

const INCLUSIVE_NAME_RE = /(FinEra Inclusive Credit|INCLUSIVE Micro-Loans)/g;

/** Wraps “INCLUSIVE Micro-Loans” or “FinEra Inclusive Credit” in the black subbrand style. */
export function withInclusiveCreditBrandColor(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  const re = new RegExp(INCLUSIVE_NAME_RE.source, "g");
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={k++} className="finera-inclusive-credit-phrase">
        {m[1]}
      </span>
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? <>{parts}</> : text;
}
