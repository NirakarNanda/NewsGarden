import mongoose, {
  Schema,
  type Document,
} from "mongoose";

export interface PageSlot {
  articleId?: string;

  imageUrl?: string;

  headline?: string;

  // Layout designation assigned by the layout agent.
  slot?: "lead" | "secondary" | "brief";
}

export interface INewspaperPage
  extends Document {

  pageId: string;

  editionId: string;

  pageNumber: number;

  slots: PageSlot[];
}

const pageSlotSchema =
  new Schema<PageSlot>(
    {
      articleId: {
        type: String,
      },

      imageUrl: {
        type: String,
      },

      headline: {
        type: String,
        trim: true,
      },

      slot: {
        type: String,
        enum: [
          "lead",
          "secondary",
          "brief",
        ],
      },
    },
    {
      _id: false,
    }
  );

const newspaperPageSchema =
  new Schema<INewspaperPage>(
    {
      pageId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      editionId: {
        type: String,
        required: true,
        index: true,
      },

      pageNumber: {
        type: Number,
        required: true,
      },

      slots: {
        type: [pageSlotSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

// Hot path: findPagesByEditionId({ editionId }) sorted by pageNumber.
newspaperPageSchema.index({
  editionId: 1,
  pageNumber: 1,
});

export const NewspaperPage =
  mongoose.model<INewspaperPage>(
    "NewspaperPage",
    newspaperPageSchema
  );
