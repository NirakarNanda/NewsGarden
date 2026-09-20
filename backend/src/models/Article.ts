import mongoose, {
  Schema,
  type Document,
} from "mongoose";

import type {
  ArticleData,
} from "../types/article.js";

export interface IArticle
  extends Document,
    Omit<ArticleData, "articleId"> {

  articleId: string;
}

const articleSchema =
  new Schema<IArticle>(
    {
      articleId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      url: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      source: {
        type: String,
        required: true,
        index: true,
      },

      summary: {
        type: String,
      },

      publishedAt: {
        type: Date,
      },

      discoveredAt: {
        type: Date,
        required: true,
      },

      category: {
        type: String,
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "discovered",
          "researching",
          "writing",
          "ready",
          "published",
        ],
        default: "discovered",
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

export const Article =
  mongoose.model<IArticle>(
    "Article",
    articleSchema
  );