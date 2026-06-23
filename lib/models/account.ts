import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ACCOUNT_TYPES } from "@/lib/constants";

const accountSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ACCOUNT_TYPES, default: "cash" },
    color: { type: String },
    openingBalance: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AccountDoc = InferSchemaType<typeof accountSchema>;

export const Account: Model<AccountDoc> =
  (models.Account as Model<AccountDoc>) ??
  model<AccountDoc>("Account", accountSchema);
