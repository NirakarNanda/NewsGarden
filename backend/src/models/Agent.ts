import mongoose, { Schema, type Document } from "mongoose";

export type AgentStatus =
  | "idle"
  | "working"
  | "walking"
  | "waiting"
  | "completed"
  | "error";

export type AgentLocation =
  | "newsroom"
  | "research-lab"
  | "editorial-room"
  | "visual-studio"
  | "design-studio"
  | "quality-room"
  | "cafe"
  | "manga-library"
  | "badminton-court";

export interface IAgent extends Document {
  agentId: string;
  name: string;
  role: string;
  department: string;

  status: AgentStatus;

  location: AgentLocation;

  currentTaskId?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>(
  {
    agentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "idle",
        "working",
        "walking",
        "waiting",
        "completed",
        "error",
      ],
      default: "idle",
    },

    location: {
      type: String,
      enum: [
        "newsroom",
        "research-lab",
        "editorial-room",
        "visual-studio",
        "design-studio",
        "quality-room",
        "cafe",
        "manga-library",
        "badminton-court",
      ],
      default: "newsroom",
    },

    currentTaskId: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Agent = mongoose.model<IAgent>(
  "Agent",
  agentSchema
);