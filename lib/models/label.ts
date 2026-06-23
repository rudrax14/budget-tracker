import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const labelSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type LabelDoc = InferSchemaType<typeof labelSchema>;

export const Label: Model<LabelDoc> =
  (models.Label as Model<LabelDoc>) ?? model<LabelDoc>("Label", labelSchema);
