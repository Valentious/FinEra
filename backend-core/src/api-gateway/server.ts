/**
 * FinEra Backend - Server Entry Point
 */

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer as createNetServer } from "node:net";
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

  const findAvailablePort = async (startPort: number, attempts: number): Promise<number> => {
    for (let i = 0; i < attempts; i += 1) {
      const port = startPort + i;
      try {
        await new Promise<void>((resolve, reject) => {
          const probe = createNetServer();
          probe.once("error", (err: NodeJS.ErrnoException) => {
            probe.close();
            reject(err);
          });
          probe.listen(port, () => {
            probe.close(() => resolve());
          });
        });
        return port;
      } catch (err) {
        const e = err as NodeJS.ErrnoException;
        if (e.code === "EADDRINUSE") {
          logger.warn({ port }, "Port in use, trying next port");
          continue;
        }
        throw err;
      }
    }
    throw new Error(`No available port found from ${startPort} to ${startPort + attempts - 1}`);
  };

  const server = createServer(app);
  const targetPort = await findAvailablePort(config.PORT, 10);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(targetPort, () => resolve());
  });
  attachAdminWebSocket(server);

  const boundPort = targetPort;
  const actualPort = (server.address() as AddressInfo | null)?.port ?? boundPort;
  logger.info({ port: actualPort, env: config.NODE_ENV }, "FinEra Backend started");
  logger.info({ port: actualPort }, "backend-core started");

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
