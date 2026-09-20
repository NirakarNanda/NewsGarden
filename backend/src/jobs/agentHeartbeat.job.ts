import {
  AGENT_REGISTRY,
} from "../engine/brain/BrainAgent.js";

import {
  agentIdle,
} from "../engine/events/AgentEvents.js";

import {
  eventBus,
} from "../engine/events/EventBus.js";

import {
  SCHEDULES,
} from "../config/schedules.js";

export type HeartbeatAgentState =
  | "idle"
  | "working"
  | "walking"
  | "waiting"
  | "completed"
  | "error";

export interface AgentHeartbeat {

  agentId: string;

  state: HeartbeatAgentState;

  lastHeartbeatAt: Date;
}

export interface AgentHeartbeatJob {

  stop(): void;

  getStates(): AgentHeartbeat[];
}

export interface AgentHeartbeatJobOptions {

  // How often to emit heartbeats.
  intervalMs?: number;

  // Defaults to every registered agent.
  agentIds?: string[];
}

const DEFAULT_INTERVAL_MS =
  SCHEDULES.heartbeatIntervalMs;

/*
 * Periodically emits a heartbeat for each
 * registered agent so the frontend campus
 * can animate idle agents (cafe, manga
 * library, badminton court, ...).
 *
 * Agents that are currently working keep
 * their state; only idle agents get the
 * AGENT_IDLE nudge.
 */
export function startAgentHeartbeatJob(
  options: AgentHeartbeatJobOptions = {}
): AgentHeartbeatJob {

  const intervalMs =
    options.intervalMs ??
    DEFAULT_INTERVAL_MS;

  const agentIds =
    options.agentIds ??
    Object.keys(AGENT_REGISTRY);

  const states = new Map<
    string,
    AgentHeartbeat
  >();

  for (const agentId of agentIds) {

    states.set(agentId, {

      agentId,

      state: "idle",

      lastHeartbeatAt:
        new Date(),
    });
  }

  const beat = () => {

    const now = new Date();

    for (const agentId of agentIds) {

      const heartbeat =
        states.get(agentId);

      if (!heartbeat) {

        continue;
      }

      heartbeat.lastHeartbeatAt =
        now;

      if (
        heartbeat.state ===
        "idle"
      ) {

        agentIdle(agentId);
      }

      eventBus.emit(
        "AGENT_HEARTBEAT",
        {

          agentId,

          state:
            heartbeat.state,

          at: now.toISOString(),
        }
      );
    }
  };

  const timer = setInterval(
    beat,
    intervalMs
  );

  timer.unref?.();

  // One immediate beat so the campus
  // lights up without waiting.
  beat();

  return {

    stop() {

      clearInterval(timer);
    },

    getStates() {

      return [...states.values()];
    },
  };
}

/*
 * Called by BrainAgent/runTask flows when
 * an agent's real state changes, so the
 * heartbeat does not override it.
 */
export function setHeartbeatState(
  job: AgentHeartbeatJob,
  agentId: string,
  state: HeartbeatAgentState
): void {

  const states =
    job.getStates();

  const entry = states.find(
    (s) => s.agentId === agentId
  );

  if (entry) {

    entry.state = state;
  }
}
