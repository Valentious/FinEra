import { useEffect, useRef } from "react";

/**
 * Fallback when WebSocket is down - refresh overview on interval.
 */
export function useAdminPolling(
  enabled: boolean,
  intervalMs: number,
  onTick: () => void | Promise<void>
): void {
  const saved = useRef(onTick);
  saved.current = onTick;

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      void saved.current();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
}
