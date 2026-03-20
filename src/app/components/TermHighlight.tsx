/**
 * TermHighlight - Interactive financial term with tooltip
 * Recognizes key terms, shows definition on click/hover, tracks interactions
 */

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Button } from "@/app/components/ui/button";
import { Sparkles } from "lucide-react";
import type { FinancialTerm } from "@/services/api";
import { recordTermInteraction } from "@/services/api";

interface TermHighlightProps {
  /** Text that may contain financial terms */
  children: string;
  /** List of financial terms to highlight */
  terms: FinancialTerm[];
  /** Context for analytics (e.g. "learning_module_budgeting") */
  context?: string;
  /** Optional class for the wrapper */
  className?: string;
}

/** Split text into segments: plain text and term spans */
function splitByTerms(text: string, terms: FinancialTerm[]): Array<{ type: "text" | "term"; value: string; term?: FinancialTerm }> {
  if (!text || terms.length === 0) return [{ type: "text", value: text }];

  const segments: Array<{ type: "text" | "term"; value: string; term?: FinancialTerm }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchedTerm: FinancialTerm | null = null;

    for (const t of terms) {
      const lower = remaining.toLowerCase();
      const termLower = t.term.toLowerCase();
      const idx = lower.indexOf(termLower);
      if (idx >= 0 && idx < earliestIdx) {
        earliestIdx = idx;
        matchedTerm = t;
      }
    }

    if (matchedTerm) {
      if (earliestIdx > 0) {
        segments.push({ type: "text", value: remaining.slice(0, earliestIdx) });
      }
      segments.push({
        type: "term",
        value: remaining.slice(earliestIdx, earliestIdx + matchedTerm.term.length),
        term: matchedTerm,
      });
      remaining = remaining.slice(earliestIdx + matchedTerm.term.length);
    } else {
      segments.push({ type: "text", value: remaining });
      break;
    }
  }

  return segments;
}

function TermTooltipContent({ term: t, context }: { term: FinancialTerm; context?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-sm p-3 space-y-2">
      <p className="font-semibold text-slate-900">{t.term}</p>
      <p className="text-sm text-slate-600">{t.simpleDefinition}</p>
      {t.advancedDefinition && (
        <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">
          {t.advancedDefinition}
        </p>
      )}
      {t.example && (
        <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2">
          Example: {t.example}
        </p>
      )}
      {t.relatedTerms?.length > 0 && (
        <p className="text-[10px] text-slate-400">
          Related: {t.relatedTerms.join(", ")}
        </p>
      )}
      <Button
        size="sm"
        variant="outline"
        className="w-full mt-2 text-xs"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await recordTermInteraction(t.slug, "ask_ai", context).catch(() => {});
          setLoading(false);
        }}
      >
        <Sparkles className="w-3 h-3 mr-1" /> Ask AI
      </Button>
    </div>
  );
}

export function TermHighlight({ children, terms, context, className = "" }: TermHighlightProps) {
  const segments = splitByTerms(children, terms);

  if (segments.length === 1 && segments[0].type === "text") {
    return <span className={className}>{children}</span>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <span className={className}>
        {segments.map((seg, i) => {
          if (seg.type === "text") {
            return <span key={i}>{seg.value}</span>;
          }
          const t = seg.term!;
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span
                  className="cursor-help border-b border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 rounded px-0.5"
                  onClick={() => recordTermInteraction(t.slug, "click", context).catch(() => {})}
                >
                  {seg.value}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="p-0 border-slate-200 bg-white shadow-xl"
                onPointerEnter={() => recordTermInteraction(t.slug, "hover", context).catch(() => {})}
              >
                <TermTooltipContent term={t} context={context} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
}
