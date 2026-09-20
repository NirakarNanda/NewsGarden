import { randomUUID } from "crypto";

import { Task } from "../../models/Task.js";

export class TaskManager {

  // Brain uses this to create a new job.
  async createTask(
    agentId: string,
    type: string,
    input?: unknown
  ) {
    const task = await Task.create({
      taskId: randomUUID(),

      agentId,

      type,

      status: "pending",

      input,

      retryCount: 0,
    });

    console.log(
      `🧠 Task created: ${task.taskId}`
    );

    return task;
  }

  // Mark a task as running.
  async startTask(taskId: string) {
    return Task.findOneAndUpdate(
      { taskId },

      {
        status: "running",
        startedAt: new Date(),
      },

      { new: true }
    );
  }

  // Save the agent's result.
  async completeTask(
    taskId: string,
    output: unknown
  ) {
    return Task.findOneAndUpdate(
      { taskId },

      {
        status: "completed",
        output,
        completedAt: new Date(),
      },

      { new: true }
    );
  }

  // Something went wrong.
  async failTask(
    taskId: string,
    error: string
  ) {
    return Task.findOneAndUpdate(
      { taskId },

      {
        status: "failed",
        error,
        completedAt: new Date(),
      },

      { new: true }
    );
  }
}