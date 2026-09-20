import mongoose, {
  Schema,
  type Document,
} from "mongoose";

export interface ISource
  extends Document {

  sourceId: string;

  name: string;

  url: string;

  category: string;

  enabled: boolean;
}

const sourceSchema =
  new Schema<ISource>(
    {
      sourceId: {
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

      url: {
        type: String,
        required: true,
        unique: true,
      },

      category: {
        type: String,
        required: true,
        index: true,
      },

      enabled: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

export const Source =
  mongoose.model<ISource>(
    "Source",
    sourceSchema
  );
