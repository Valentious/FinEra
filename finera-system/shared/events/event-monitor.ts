/**
 * Event metrics and monitoring (optional)
 */

import { eventBus } from './event-bus.js';

const eventCounts = new Map<string, number>();

eventBus.on('event.published', (event: { type: string }) => {
  eventCounts.set(event.type, (eventCounts.get(event.type) || 0) + 1);
});

eventBus.on('event.consumed', ({ event }: { event: { type: string } }) => {
  if (process.env.EVENT_METRICS_DEBUG === 'true') {
    console.log(`[EventMonitor] Consumed: ${event.type}`);
  }
});

eventBus.on('event.failed', ({ event, error }: { event?: { type: string }; error?: unknown }) => {
  console.error('[EventMonitor] Failed:', event?.type, error);
});

export function getEventMetrics(): Record<string, number> {
  return Object.fromEntries(eventCounts);
}
