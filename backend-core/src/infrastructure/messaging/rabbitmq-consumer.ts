import { getConsumeChannel } from "./rabbitmq-connection.js";
import { assertEventTopology } from "./rabbitmq-topology.js";
import { RABBIT } from "./rabbitmq-constants.js";
import { parseEnvelope } from "./rabbitmq-envelope.js";
import type { RabbitEventEnvelope } from "./rabbitmq-envelope.js";
import { dispatchToHandlers } from "./event-bus-dispatch.js";
import { getConfig } from "../../config/index.js";
import { logger } from "../../core/utils/logger.js";

/**
 * Consumes durable `finera.events.main`, dispatches to local handlers.
 * On failure: requeue via TTL retry queue; after max attempts → fanout DLX → DLQ.
 */
export async function startConsumer(): Promise<void> {
  const config = getConfig();
  if (!config.RABBITMQ_URL) {
    return;
  }

  const ch = await getConsumeChannel(config.RABBITMQ_URL);
  await assertEventTopology(ch, config.RABBITMQ_RETRY_DELAY_MS);
  const maxAttempts = config.RABBITMQ_RETRY_MAX;

  await ch.consume(
    RABBIT.Q_MAIN,
    (msg) => {
      void (async () => {
        if (!msg) return;
        let env: RabbitEventEnvelope;
        try {
          env = parseEnvelope(msg.content.toString());
        } catch (e) {
          logger.error({ err: e }, "invalid RabbitMQ envelope - nack to DLX");
          ch.nack(msg, false, false);
          return;
        }

        try {
          await dispatchToHandlers(env.name, env.payload);
          ch.ack(msg);
        } catch (e) {
          logger.error({ err: e, event: env.name, attempt: env.attempt }, "domain event handler failed");
          if (env.attempt >= maxAttempts - 1) {
            const poison = Buffer.from(
              JSON.stringify({
                ...env,
                error: String(e),
                deadAt: new Date().toISOString(),
                reason: "MAX_CONSUMER_ATTEMPTS",
              }),
              "utf8"
            );
            ch.publish(RABBIT.EX_DLX, "", poison, { persistent: true });
            ch.ack(msg);
          } else {
            const next: RabbitEventEnvelope = {
              ...env,
              attempt: env.attempt + 1,
              at: new Date().toISOString(),
            };
            ch.sendToQueue(RABBIT.Q_RETRY, Buffer.from(JSON.stringify(next), "utf8"), {
              persistent: true,
            });
            ch.ack(msg);
          }
        }
      })();
    },
    { noAck: false }
  );

  logger.info({ queue: RABBIT.Q_MAIN, maxAttempts, retryDelayMs: config.RABBITMQ_RETRY_DELAY_MS }, "RabbitMQ consumer started");
}
