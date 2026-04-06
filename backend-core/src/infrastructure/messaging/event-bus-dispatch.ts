/**
 * Local subscriber registry - RabbitMQ consumer invokes `dispatchToHandlers`.
 */

import type { CurrencyCode } from "@prisma/client";

export type DomainEventName =
  | "USER_REGISTERED"
  | "WALLET_CREATED"
  | "LOAN_REQUESTED"
  | "LOAN_APPROVED"
  | "REPAYMENT_RECEIVED"
  | "RECONCILIATION_REQUIRED"
  | "AGENT_FLAGGED"
  | "ADMIN_ACTION";

export interface DomainEventPayload {
  [key: string]: unknown;
  currency?: CurrencyCode;
  userId?: string;
  adminId?: string;
}

export type DomainEventHandler = (
  name: DomainEventName,
  payload: DomainEventPayload
) => void | Promise<void>;

const subscribers = new Set<DomainEventHandler>();

export function subscribeDomainEvents(handler: DomainEventHandler): () => void {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

export async function dispatchToHandlers(name: DomainEventName, payload: DomainEventPayload): Promise<void> {
  for (const h of subscribers) {
    await Promise.resolve(h(name, payload));
  }
}
