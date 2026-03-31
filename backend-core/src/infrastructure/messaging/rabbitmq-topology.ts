import type { Channel } from "amqplib";
import { RABBIT } from "./rabbitmq-constants.js";

/**
 * Idempotent: safe to call on publish and consume channels (same vhost).
 */
export async function assertEventTopology(ch: Channel, retryDelayMs: number): Promise<void> {
  await ch.assertExchange(RABBIT.EX_EVENTS, "topic", { durable: true });

  await ch.assertQueue(RABBIT.Q_MAIN, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": RABBIT.EX_DLX,
      "x-dead-letter-routing-key": "dead",
    },
  });
  await ch.bindQueue(RABBIT.Q_MAIN, RABBIT.EX_EVENTS, RABBIT.RK_DOMAIN);
  await ch.bindQueue(RABBIT.Q_MAIN, RABBIT.EX_EVENTS, RABBIT.RK_REPLAY);

  await ch.assertQueue(RABBIT.Q_RETRY, {
    durable: true,
    arguments: {
      "x-message-ttl": retryDelayMs,
      "x-dead-letter-exchange": RABBIT.EX_EVENTS,
      "x-dead-letter-routing-key": RABBIT.RK_REPLAY,
    },
  });

  await ch.assertExchange(RABBIT.EX_DLX, "fanout", { durable: true });
  await ch.assertQueue(RABBIT.Q_DLQ, { durable: true });
  await ch.bindQueue(RABBIT.Q_DLQ, RABBIT.EX_DLX, "");
}
