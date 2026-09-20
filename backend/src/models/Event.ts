import mongoose, {
  Schema,
  type Document,
} from "mongoose";

import type {
  NewsEvent,
} from "../types/event.js";

export interface IEvent
  extends Document,
    Omit<NewsEvent, "eventId"> {

  eventId: string;
}

const eventSchema =
  new Schema<IEvent>(
    {
      eventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      representativeArticleId: {
        type: String,
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
      },

      category: {
        type: String,
        required: true,
        index: true,
      },

      articleIds: {
        type: [String],
        default: [],
      },

      keywords: {
        type: [String],
        default: [],
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

export const Event =
  mongoose.model<IEvent>(
    "Event",
    eventSchema
  );