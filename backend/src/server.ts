import app from "./app.js";

import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

import { logger } from "./utils/logger.js";

async function startServer(): Promise<void> {
  try {
    /*
     * Connect MongoDB first.
     */
    await connectDatabase();

    /*
     * Start Express.
     */
    const server = app.listen(env.port, () => {
      logger.info(
        `NewsGarden Backend running on http://localhost:${env.port}`
      );
    });

    /*
     * Graceful shutdown.
     */
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down...`);

      server.close(async () => {
        await disconnectDatabase();

        process.exit(0);
      });
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    logger.error(
      "Failed to start NewsGarden Backend",
      error
    );

    process.exit(1);
  }
}

void startServer();