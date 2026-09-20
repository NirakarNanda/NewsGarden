import {
  Task,
} from "../models/Task.js";

import type {
  TaskStatus,
} from "../types/task.js";

export interface CreateTaskInput {
  taskId: string;

  agentId: string;

  type: string;

  input?: unknown;
}

export interface TaskFilter {
  status?: TaskStatus;

  agentId?: string;

  type?: string;

  limit?: number;
}

export interface UpdateTaskStatusPatch {
  output?: unknown;

  error?: string;

  startedAt?: Date;

  completedAt?: Date;
}

export async function findTaskById(
  taskId: string
) {

  return Task.findOne({ taskId }).lean();
}

export async function listTasks(
  filter: TaskFilter
) {

  const query: Record<string, unknown> = {};

  if (filter.status) {

    query.status = filter.status;
  }

  if (filter.agentId) {

    query.agentId = filter.agentId;
  }

  if (filter.type) {

    query.type = filter.type;
  }

  return Task.find(query)
    .sort({ createdAt: -1 })
    .limit(filter.limit ?? 50)
    .lean();
}

export async function createTask(
  input: CreateTaskInput
) {

  return Task.create({
    taskId: input.taskId,

    agentId: input.agentId,

    type: input.type,

    input: input.input,

    status: "pending",

    retryCount: 0,
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  patch: UpdateTaskStatusPatch = {}
) {

  return Task.findOneAndUpdate(
    { taskId },
    {
      status,

      ...patch,
    },
    { new: true }
  ).lean();
}

export async function incrementTaskRetryCount(
  taskId: string
) {

  return Task.findOneAndUpdate(
    { taskId },
    { $inc: { retryCount: 1 } },
    { new: true }
  ).lean();
}
