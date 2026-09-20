import {
  eventBus,
} from "./EventBus.js";

import type {
  AgentEvent,
} from "./AgentEvents.js";

/*
 * Ask the campus UI to walk an agent
 * character from one zone to another.
 */
export function agentMovementRequested(
  agentId: string,
  fromZone: string,
  toZone: string
): AgentEvent {

  const event = {

    name: "AGENT_MOVEMENT_REQUESTED",

    payload: {

      agentId,

      fromZone,

      toZone,

      at: new Date().toISOString(),
    },
  };

  eventBus.emit(
    event.name,
    event.payload
  );

  return event;
}
