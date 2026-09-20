import mongoose, {
  Schema,
  type Document,
} from "mongoose";

export interface IApproval
  extends Document {

  approvalId: string;

  editionId: string;

  status:
    | "pending"
    | "approved"
    | "revision-requested";

  note?: string;

  decidedBy?: string;

  decidedAt?: Date;
}

const approvalSchema =
  new Schema<IApproval>(
    {
      approvalId: {
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

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "revision-requested",
        ],
        default: "pending",
        index: true,
      },

      note: {
        type: String,
        trim: true,
      },

      decidedBy: {
        type: String,
        trim: true,
      },

      decidedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

export const Approval =
  mongoose.model<IApproval>(
    "Approval",
    approvalSchema
  );
