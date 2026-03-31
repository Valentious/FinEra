import { getPublishChannel } from "./rabbitmq-connection.js";
import { assertEventTopology } from "./rabbitmq-topology.js";
import { RABBIT } from "./rabbitmq-constants.js";
import { getConfig } from "../../config/index.js";
import type { RabbitEventEnvelope } from "./rabbitmq-envelope.js";

let topologyAsserted = false;

export async function publishEnvelope(env: RabbitEventEnvelope): Promise<void> {
  const config = getConfig();
  if (!config.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is not configured");
  }
  const ch = await getPublishChannel(config.RABBITMQ_URL);
  if (!topologyAsserted) {
    await assertEventTopology(ch, config.RABBITMQ_RETRY_DELAY_MS);
    topologyAsserted = true;
  }
  const buf = Buffer.from(JSON.stringify(env), "utf8");
  ch.publish(RABBIT.EX_EVENTS, RABBIT.RK_DOMAIN, buf, {
    persistent: true,
    contentType: "application/json",
  });
}
