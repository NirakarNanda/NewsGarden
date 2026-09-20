import {
  eventBus,
  type EventPayload,
} from "./EventBus.js";

export interface AgentEvent {
  name: string;

  payload: EventPayload;
}

function now(): string {

  return new Date().toISOString();
}

export function agentStarted(
  agentId: string,
  taskId: string
): AgentEvent {

  const event = {

    name: "AGENT_STARTED",

    payload: {

      agentId,

      taskId,

      at: now(),
    },
  };

  eventBus.emit(
    event.name,
    event.payload
  );

  return event;
}

export function agentTaskCompleted(
  agentId: string,
  taskId: string,
  output?: unknown
): AgentEvent {

  const event = {

    name: "AGENT_TASK_COMPLETED",

    payload: {

      agentId,

      taskId,

      output: output ?? null,

      at: now(),
    },
  };

  eventBus.emit(
    event.name,
    event.payload
  );

  return event;
}

export function agentTaskFailed(
  agentId: string,
  taskId: string,
  error: string
): AgentEvent {

  const event = {

    name: "AGENT_TASK_FAILED",

    payload: {

      agentId,

      taskId,

      error,

      at: now(),
    },
  };

  eventBus.emit(
    event.name,
    event.payload
  );

  return event;
}

export function agentIdle(
  agentId: string
): AgentEvent {

  const event = {

    name: "AGENT_IDLE",

    payload: {

      agentId,

      at: now(),
    },
  };

  eventBus.emit(
    event.name,
    event.payload
  );

  return event;
}
