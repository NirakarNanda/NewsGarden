import app from "./app.js";

import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

import { logger } from "./utils/logger.js";

import {
  eventBus,
} from "./engine/events/EventBus.js";

import {
  eventLogger,
} from "./engine/events/EventLogger.js";

import {
  updateAgentState,
} from "./repositories/agent.repository.js";

import {
  startDailyEditionJob,
} from "./jobs/dailyEdition.job.js";

import {
  startAgentHeartbeatJob,
} from "./jobs/agentHeartbeat.job.js";

import {
  checkAIHealth,
} from "./services/aiHealth.service.js";

import {
  startEditionRun,
} from "./services/editionRun.service.js";

import {
  sseClients,
} from "./routes/events.routes.js";

function agentIdOf(payload: unknown): string | null {

  if (
    typeof payload === "object" &&
    payload !== null &&
    "agentId" in payload &&
    typeof (payload as { agentId: unknown }).agentId === "string"
  ) {

    return (payload as { agentId: string }).agentId;
  }

  return null;
}

function taskIdOf(payload: unknown): string | undefined {

  if (
    typeof payload === "object" &&
    payload !== null &&
    "taskId" in payload &&
    typeof (payload as { taskId: unknown }).taskId === "string"
  ) {

    return (payload as { taskId: string }).taskId;
  }

  return undefined;
}

/*
 * Keeps the REST-visible agent list in sync with engine events.
 * This is what lets the frontend campus show an agent as working
 * the moment the brain starts one of its tasks (the V1 milestone).
 */
function syncAgentStatesFromEvents(): void {

  eventBus.on("AGENT_STARTED", (payload) => {

    const agentId = agentIdOf(payload);

    if (!agentId) {

      return;
    }

    updateAgentState(agentId, {
      state: "working",
      currentTaskId: taskIdOf(payload),
    });
  });

  eventBus.on("AGENT_MOVEMENT_REQUESTED", (payload) => {

    const agentId = agentIdOf(payload);

    if (!agentId) {

      return;
    }

    updateAgentState(agentId, {
      state: "walking",
    });
  });

  const markIdle = (payload: unknown): void => {

    const agentId = agentIdOf(payload);

    if (!agentId) {

      return;
    }

    updateAgentState(agentId, {
      state: "idle",
    });
  };

  eventBus.on("AGENT_TASK_COMPLETED", markIdle);

  eventBus.on("AGENT_TASK_FAILED", markIdle);

  eventBus.on("AGENT_IDLE", markIdle);
}

async function startServer(): Promise<void> {
  try {
    /*
     * Connect MongoDB first.
     */
    await connectDatabase();

    /*
     * Persist every bus event to the activity feed,
     * and mirror agent lifecycle events into the
     * agent list served by /api/agents.
     */
    eventLogger.start();

    syncAgentStatesFromEvents();

    /*
     * Reachability check for the configured AI provider.
     * Never blocks startup past its own timeout; an
     * unreachable provider means editions are built with
     * the offline fallback and labelled as such.
     */
    await checkAIHealth();

    /*
     * Background jobs: daily edition scheduler
     * and the agent heartbeat for the campus UI.
     */
    const dailyEditionJob = startDailyEditionJob();

    const heartbeatJob = startAgentHeartbeatJob();

    /*
     * Optional: build an edition as soon as the
     * server is up (RUN_ON_START=true).
     */
    if (env.runOnStart) {

      const { accepted } =
        startEditionRun();

      logger.info(
        accepted
          ? "RUN_ON_START: edition run started."
          : "RUN_ON_START: a run was already in progress."
      );
    }

    /*
     * Start Express.
     */
    if (
      env.nodeEnv === "production" &&
      !env.apiKey
    ) {
      logger.warn(
        "API_KEY is empty: the approval routes are unauthenticated. " +
        "Set API_KEY in production."
      );
    }

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

      dailyEditionJob.stop();

      heartbeatJob.stop();

      // Close SSE streams so clients reconnect
      // instead of hanging on a dead socket.
      for (const client of sseClients) {

        try {

          client.end();

        } catch {

          // Already gone; ignore.
        }
      }

      sseClients.clear();

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
