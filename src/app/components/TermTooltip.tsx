/**
 * TermTooltip - Smart term intelligence per user spec
 * Fetches definition from GET /api/learning/term/:term on hover
 * Tracks interaction via POST /api/learning/term-interaction
 */

import { useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Button } from "@/app/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { getTermDefinition, recordTermInteractionSpec } from "@/services/api";

interface TermTooltipProps {
  term: string;
  moduleId?: string;
  children: React.ReactNode;
}

export function TermTooltip({ term, moduleId, children }: TermTooltipProps) {
  const [definition, setDefinition] = useState<{
    simple: string;
    advanced: string;
    example: string;
    contextual: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchDefinition = useCallback(async () => {
    if (fetched && definition) return;
    setLoading(true);
    try {
      const def = await getTermDefinition(term);
      setDefinition(def);
      setFetched(true);
      await recordTermInteractionSpec(term, "hover", moduleId).catch(() => {});
    } catch {
      setDefinition({
        simple: "Financial term related to your learning journey",
        advanced: "This term appears in your current learning context",
        example: "Understanding this concept helps in making better financial decisions",
        contextual: "Keep exploring to learn more about this concept.",
      });
    } finally {
      setLoading(false);
    }
  }, [term, moduleId, fetched, definition]);

  const handleAskAi = async () => {
    await recordTermInteractionSpec(term, "ask_ai", moduleId).catch(() => {});
    // Placeholder - in production would open AI chat
    alert(`AI Assistant: I can help you understand "${term}" better. What would you like to know?`);
  };

  const handleOpen = () => {
    fetchDefinition();
    recordTermInteractionSpec(term, "click", moduleId).catch(() => {});
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="cursor-help border-b border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 rounded px-0.5"
            onMouseEnter={fetchDefinition}
            onClick={handleOpen}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 border-slate-200 bg-white shadow-xl max-w-sm">
          <div className="p-3 space-y-2">
            <h4 className="font-semibold text-foreground">{term}</h4>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : definition ? (
              <>
                <div className="definition-section">
                  <strong className="text-xs text-muted-foreground">Simple Definition:</strong>
                  <p className="text-sm text-foreground">{definition.simple}</p>
                </div>
                <div className="definition-section">
                  <strong className="text-xs text-muted-foreground">Advanced:</strong>
                  <p className="text-xs text-muted-foreground">{definition.advanced}</p>
                </div>
                <div className="definition-section">
                  <strong className="text-xs text-muted-foreground">Example:</strong>
                  <p className="text-xs text-muted-foreground">{definition.example}</p>
                </div>
                <div className="definition-section p-2 bg-emerald-50 rounded-lg">
                  <strong className="text-xs text-emerald-700">For You:</strong>
                  <p className="text-xs text-emerald-800">{definition.contextual}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 text-xs"
                  onClick={handleAskAi}
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Ask AI
                </Button>
              </>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
