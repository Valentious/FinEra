import type { DomainEventName, DomainEventPayload } from "./event-bus-dispatch.js";

export interface RabbitEventEnvelope {
  name: DomainEventName;
  payload: DomainEventPayload;
  at: string;
  /** Delivery attempt (0 = first consume). */
  attempt: number;
}

export function parseEnvelope(raw: string): RabbitEventEnvelope {
  const o = JSON.parse(raw) as RabbitEventEnvelope;
  if (!o || typeof o.name !== "string") {
    throw new Error("Invalid envelope");
  }
  if (typeof o.attempt !== "number" || o.attempt < 0) {
    o.attempt = 0;
  }
  return o;
}
