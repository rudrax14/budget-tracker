import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/lib/constants";

const plannedSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    direction: { type: String, enum: ["out", "in"], required: true },
    amount: { type: Number, required: true, min: 0 },
    label: { type: String, required: true },
    note: { type: String },
    categoryId: { type: String },
    counterparty: { type: String }, // person/payee for "give to" / "receive from"
    dueDate: { type: Date, required: true, index: true },
    recurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ["weekly", "monthly", "yearly"] },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
  },
  { timestamps: true },
);

export type PlannedPaymentDoc = InferSchemaType<typeof plannedSchema>;

export const PlannedPayment: Model<PlannedPaymentDoc> =
  (models.PlannedPayment as Model<PlannedPaymentDoc>) ??
  model<PlannedPaymentDoc>("PlannedPayment", plannedSchema);
