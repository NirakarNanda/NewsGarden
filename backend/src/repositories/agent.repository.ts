import {
  AGENT_DEFINITIONS,
  type AgentDefinition,
} from "../config/agents.js";

import type {
  CampusAgentState,
} from "../types/campus.js";

export interface AgentRuntimeState
  extends AgentDefinition {

  state: CampusAgentState;

  currentTaskId?: string;

  lastHeartbeat: Date;

  x?: number;

  y?: number;
}

// In-memory live state, keyed by agent id.
// The engine worker updates this as agents move and work;
// nothing here touches the database.
interface LiveAgentEntry {
  state: CampusAgentState;

  currentTaskId?: string;

  lastHeartbeat: Date;

  x?: number;

  y?: number;
}

const liveState = new Map<string, LiveAgentEntry>();

function getLiveState(
  agentId: string
): LiveAgentEntry {

  const existing = liveState.get(agentId);

  if (existing) {

    return existing;
  }

  const fresh: LiveAgentEntry = {

    state: "idle",

    lastHeartbeat: new Date(),
  };

  liveState.set(agentId, fresh);

  return fresh;
}

function toRuntimeState(
  definition: AgentDefinition
): AgentRuntimeState {

  const live = getLiveState(definition.id);

  return {

    ...definition,

    state: live.state,

    currentTaskId: live.currentTaskId,

    lastHeartbeat: live.lastHeartbeat,

    x: live.x,

    y: live.y,
  };
}

export function getAllAgents(): AgentRuntimeState[] {

  return AGENT_DEFINITIONS.map(toRuntimeState);
}

export function getAgentById(
  agentId: string
): AgentRuntimeState | null {

  const definition = AGENT_DEFINITIONS.find(
    (candidate) => candidate.id === agentId
  );

  if (!definition) {

    return null;
  }

  return toRuntimeState(definition);
}

export function updateAgentState(
  agentId: string,
  patch: Partial<
    Pick<
      AgentRuntimeState,
      "state" | "currentTaskId" | "x" | "y"
    >
  >
): AgentRuntimeState | null {

  const agent = getAgentById(agentId);

  if (!agent) {

    return null;
  }

  const live = getLiveState(agentId);

  if (patch.state !== undefined) {

    live.state = patch.state;
  }

  if (patch.currentTaskId !== undefined) {

    live.currentTaskId = patch.currentTaskId;
  }

  if (patch.x !== undefined) {

    live.x = patch.x;
  }

  if (patch.y !== undefined) {

    live.y = patch.y;
  }

  live.lastHeartbeat = new Date();

  return getAgentById(agentId);
}
