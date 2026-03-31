/**
 * Domain events: PostgreSQL persistence + RabbitMQ (durable queues, persistent messages, retry + DLQ).
 * If RABBITMQ_URL is unset, handlers run synchronously in the publish path (dev fallback).
 */

import { prisma } from "../database/index.js";
import { getConfig } from "../../config/index.js";
import { logger } from "../../core/utils/logger.js";
import { dispatchToHandlers } from "./event-bus-dispatch.js";
import type { DomainEventName, DomainEventPayload } from "./event-bus-dispatch.js";

export type { DomainEventName, DomainEventPayload } from "./event-bus-dispatch.js";
export { subscribeDomainEvents } from "./event-bus-dispatch.js";

export async function publishDomainEvent(name: DomainEventName, payload: DomainEventPayload): Promise<void> {
  const at = new Date().toISOString();
  await prisma.domainEvent.create({
    data: { name, payload: payload as object },
  });

  const config = getConfig();
  if (!config.RABBITMQ_URL) {
    await dispatchToHandlers(name, payload);
    return;
  }

  try {
    const { publishEnvelope } = await import("./rabbitmq-publisher.js");
    await publishEnvelope({ name, payload, at, attempt: 0 });
  } catch (e) {
    logger.error(e, "RabbitMQ publish failed — synchronous handler dispatch fallback");
    await dispatchToHandlers(name, payload);
  }
}

/** Recent persisted events for admin activity feed (Postgres). */
export async function getRecentDomainEvents(limit = 50) {
  return prisma.domainEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, payload: true, createdAt: true },
  });
}

export async function startRabbitConsumer(): Promise<void> {
  const config = getConfig();
  if (!config.RABBITMQ_URL) {
    logger.warn("RABBITMQ_URL not set — domain events use synchronous dispatch on publish only");
    return;
  }
  const { startConsumer } = await import("./rabbitmq-consumer.js");
  await startConsumer();
}
