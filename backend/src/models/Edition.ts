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
    | "compiled"
    | "published"
    | "revision-requested";

  pageIds: string[];

  articleIds: string[];

  // Workflow stages completed so far, in EDITION_STAGES order
  // (see @newsgarden/shared). Updated by EditionManager.
  stagesCompleted: string[];

  // True when built while the AI provider was unreachable.
  aiFallback: boolean;
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
          "compiled",
          "published",
          "revision-requested",
          "failed",
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

      // True when the edition was built while the
      // AI provider was unreachable (rule-based
      // fallback content). Surfaced so the UI can
      // mark it visibly.
      aiFallback: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

// Hot path: listEditions sorts newest-first.
editionSchema.index({ date: -1 });

export const Edition =
  mongoose.model<IEdition>(
    "Edition",
    editionSchema
  );
