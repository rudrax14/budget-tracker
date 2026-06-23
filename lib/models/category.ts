import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const categorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String },
    color: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ??
  model<CategoryDoc>("Category", categorySchema);
