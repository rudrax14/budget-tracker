import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const budgetSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    categoryId: { type: String }, // optional → overall monthly budget when absent
    amount: { type: Number, required: true, min: 0 },
    month: { type: String, required: true }, // "YYYY-MM"
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type BudgetDoc = InferSchemaType<typeof budgetSchema>;

export const Budget: Model<BudgetDoc> =
  (models.Budget as Model<BudgetDoc>) ?? model<BudgetDoc>("Budget", budgetSchema);
