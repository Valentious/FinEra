/**
 * Topology: topic exchange → main queue; retry queue (TTL) → DLX back to replay;
 * poison / max retries → fanout DLX → DLQ.
 */
export const RABBIT = {
  EX_EVENTS: "finera.events",
  EX_DLX: "finera.dlx",
  /** New events from API */
  RK_DOMAIN: "domain.event",
  /** Delayed retry loopback */
  RK_REPLAY: "replay",
  Q_MAIN: "finera.events.main",
  Q_RETRY: "finera.events.retry",
  Q_DLQ: "finera.events.dlq",
} as const;
