import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/lib/constants";

const presetSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    emoji: { type: String },
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: String, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type PresetDoc = InferSchemaType<typeof presetSchema>;

export const Preset: Model<PresetDoc> =
  (models.Preset as Model<PresetDoc>) ?? model<PresetDoc>("Preset", presetSchema);
