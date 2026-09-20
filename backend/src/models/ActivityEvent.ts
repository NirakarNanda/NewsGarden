import mongoose, {
  Schema,
  type Document,
} from "mongoose";

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
      },
    },
    {
      timestamps: true,
    }
  );

export const ActivityEvent =
  mongoose.model<IActivityEvent>(
    "ActivityEvent",
    activityEventSchema
  );
