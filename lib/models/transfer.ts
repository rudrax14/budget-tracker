import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/lib/constants";

const transferSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    direction: { type: String, enum: ["in", "out"], required: true }, // received | sent
    amount: { type: Number, required: true, min: 0 },
    person: { type: String, required: true }, // who you sent to / received from
    accountId: { type: String },
    note: { type: String },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    transferDate: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export type TransferDoc = InferSchemaType<typeof transferSchema>;

export const Transfer: Model<TransferDoc> =
  (models.Transfer as Model<TransferDoc>) ??
  model<TransferDoc>("Transfer", transferSchema);
