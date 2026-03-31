import type { Channel, ChannelModel } from "amqplib";
import amqp from "amqplib";
import { logger } from "../../core/utils/logger.js";

let connection: ChannelModel | null = null;
let publishChannel: Channel | null = null;
let consumeChannel: Channel | null = null;

export async function connectRabbit(url: string): Promise<ChannelModel> {
  if (!connection) {
    connection = await amqp.connect(url);
    connection.on("error", (err) => {
      logger.error({ err }, "RabbitMQ connection error");
    });
    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
      connection = null;
      publishChannel = null;
      consumeChannel = null;
    });
  }
  return connection;
}

export async function getPublishChannel(url: string): Promise<Channel> {
  const conn = await connectRabbit(url);
  if (!publishChannel) {
    publishChannel = await conn.createChannel();
  }
  return publishChannel;
}

export async function getConsumeChannel(url: string): Promise<Channel> {
  const conn = await connectRabbit(url);
  if (!consumeChannel) {
    consumeChannel = await conn.createChannel();
    await consumeChannel.prefetch(10);
  }
  return consumeChannel;
}

export async function closeRabbit(): Promise<void> {
  try {
    await publishChannel?.close();
  } catch {
    /* ignore */
  }
  try {
    await consumeChannel?.close();
  } catch {
    /* ignore */
  }
  publishChannel = null;
  consumeChannel = null;
  try {
    await connection?.close();
  } catch {
    /* ignore */
  }
  connection = null;
}
