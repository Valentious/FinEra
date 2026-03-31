/**
 * FinEra Backend - Server Entry Point
 */

import { createServer } from "node:http";
import app from "./app.js";
import { loadConfig } from "../config/index.js";
import { connectDatabase } from "../infrastructure/database/index.js";
import { logger } from "../core/utils/logger.js";
import { subscribeDomainEvents, startRabbitConsumer } from "../infrastructure/messaging/event-bus.js";
import { attachAdminWebSocket, broadcastAdmin } from "../websocket/admin-ws.js";
import { closeRabbit } from "../infrastructure/messaging/rabbitmq-connection.js";

subscribeDomainEvents((name, payload) => {
  broadcastAdmin({
    type: "dashboard:update",
    event: name,
    payload,
    at: new Date().toISOString(),
  });
  if (name === "ADMIN_ACTION" || name === "REPAYMENT_RECEIVED") {
    broadcastAdmin({ type: "transaction:new", event: name, payload, at: new Date().toISOString() });
  }
  if (name === "AGENT_FLAGGED") {
    broadcastAdmin({ type: "alert:risk", event: name, payload, at: new Date().toISOString() });
  }
});

async function main() {
  const config = loadConfig();

  await connectDatabase();
  logger.info("Database connected");

  await startRabbitConsumer();

  const server = createServer(app);
  attachAdminWebSocket(server);

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "FinEra Backend started");
  });

  const shutdown = async () => {
    logger.info("Shutting down...");
    server.close();
    await closeRabbit();
    const { disconnectDatabase } = await import("../infrastructure/database/index.js");
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
