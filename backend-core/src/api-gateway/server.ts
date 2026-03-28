/**
 * FinEra Backend - Server Entry Point
 */

import app from "./app.js";
import { loadConfig } from "../config/index.js";
import { connectDatabase } from "../infrastructure/database/index.js";
import { logger } from "../core/utils/logger.js";

async function main() {
  const config = loadConfig();

  await connectDatabase();
  logger.info("Database connected");

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "FinEra Backend started");
  });

  const shutdown = async () => {
    logger.info("Shutting down...");
    server.close();
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
