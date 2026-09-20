import mongoose, {
  Schema,
  type Document,
} from "mongoose";

import type {
  ResearchReportData,
} from "../types/research.js";

export interface IResearchReport
  extends Document,
  Omit<ResearchReportData, "researchId"> {
  researchId: string;
}

const researchSourceSchema =
  new Schema(
    {
      title: {
        type: String,
        required: true,
      },

      url: {
        type: String,
        required: true,
      },

      source: {
        type: String,
        required: true,
      },

      publishedAt: {
        type: Date,
      },

      summary: {
        type: String,
      },
    },
    {
      _id: false,
    }
  );

const researchReportSchema =
  new Schema<IResearchReport>(
    {
      researchId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      eventId: {
        type: String,
        required: true,
        index: true,
      },

      headline: {
        type: String,
        required: true,
      },

      sources: {
        type: [researchSourceSchema],
        default: [],
      },

      keyFacts: {
        type: [String],
        default: [],
      },

      context: {
        type: [String],
        default: [],
      },

      conflictingInformation: {
        type: [String],
        default: [],
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "researching",
          "completed",
          "failed",
        ],
        default: "pending",
        index: true,
      },

      createdAt: {
        type: Date,
        required: true,
      },

      updatedAt: {
        type: Date,
        required: true,
      },
    }
  );

export const ResearchReport =
  mongoose.model<IResearchReport>(
    "ResearchReport",
    researchReportSchema
  );