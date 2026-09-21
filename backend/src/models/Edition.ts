import mongoose, {
  Schema,
  type Document,
} from "mongoose";

export interface IEdition
  extends Document {

  editionId: string;

  title: string;

  date: Date;

  status:
    | "draft"
    | "in-progress"
    | "in-review"
    | "approved"
    | "published"
    | "revision-requested";

  pageIds: string[];

  articleIds: string[];

  // Workflow stages completed so far, in EDITION_STAGES order
  // (see @newsgarden/shared). Updated by EditionManager.
  stagesCompleted: string[];
}

const editionSchema =
  new Schema<IEdition>(
    {
      editionId: {
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

      date: {
        type: Date,
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "draft",
          "in-progress",
          "in-review",
          "approved",
          "published",
          "revision-requested",
        ],
        default: "draft",
        index: true,
      },

      pageIds: {
        type: [String],
        default: [],
      },

      articleIds: {
        type: [String],
        default: [],
      },

      stagesCompleted: {
        type: [String],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

export const Edition =
  mongoose.model<IEdition>(
    "Edition",
    editionSchema
  );
