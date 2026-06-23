import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/lib/constants";

const expenseSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: String, required: true },
    accountId: { type: String },
    labelIds: { type: [String], default: [] },
    label: { type: String, required: true },
    note: { type: String },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    expenseDate: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export type ExpenseDoc = InferSchemaType<typeof expenseSchema>;

export const Expense: Model<ExpenseDoc> =
  (models.Expense as Model<ExpenseDoc>) ??
  model<ExpenseDoc>("Expense", expenseSchema);
