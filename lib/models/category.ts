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

// One category name per user. Also makes seeding the defaults race-safe: if two
// concurrent first-loads both try to insert the defaults, the second insert
// fails with a duplicate-key error instead of creating duplicates.
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ??
  model<CategoryDoc>("Category", categorySchema);
