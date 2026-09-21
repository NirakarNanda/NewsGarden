import mongoose, {
  Schema,
  type Document,
} from "mongoose";

import { env } from "../config/env.js";

export interface IActivityEvent
  extends Document {

  eventId: string;

  // Event name, e.g. "AGENT_TASK_COMPLETED".
  name: string;

  agentId?: string;

  payload: Record<string, unknown>;

  emittedAt: Date;
}

const activityEventSchema =
  new Schema<IActivityEvent>(
    {
      eventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      name: {
        type: String,
        required: true,
        index: true,
      },

      agentId: {
        type: String,
        index: true,
      },

      payload: {
        type: Schema.Types.Mixed,
        default: {},
      },

      emittedAt: {
        type: Date,
        required: true,
        index: true,

        // Old activity events expire automatically.
        // 0 disables expiry (see ACTIVITY_EVENT_TTL_DAYS).
        ...(env.activityEventTtlSeconds > 0
          ? { expires: env.activityEventTtlSeconds }
          : {}),
      },
    },
    {
      timestamps: true,
    }
  );

// Replay and the SSE endpoint page newest-first.
activityEventSchema.index({ emittedAt: -1 });

export const ActivityEvent =
  mongoose.model<IActivityEvent>(
    "ActivityEvent",
    activityEventSchema
  );
