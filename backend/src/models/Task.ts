import mongoose, { Schema, type Document } from "mongoose";

import type { TaskStatus } from "../types/task.js";

export interface ITask extends Document {
  taskId: string;

  agentId: string;

  type: string;

  status: TaskStatus;

  input?: unknown;

  output?: unknown;

  error?: string;

  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  retryCount: number;
}

const taskSchema = new Schema<ITask>(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    agentId: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "completed",
        "failed",
      ],
      default: "pending",
    },

    input: {
      type: Schema.Types.Mixed,
    },

    output: {
      type: Schema.Types.Mixed,
    },

    error: {
      type: String,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model<ITask>(
  "Task",
  taskSchema
);