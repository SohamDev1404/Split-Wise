import { pgTable, text, serial, decimal, timestamp, uuid, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  paid_by: text("paid_by").notNull(),
  split_with: text("split_with").array().default([]).notNull(), // Array of people to split with
  split_type: text("split_type").notNull().default("equal"),
  split_details: json("split_details"), // For percentage/exact splits
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses, {
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  description: z.string().min(1, "Description is required"),
  paid_by: z.string().min(1, "Paid by is required"),
  split_with: z.array(z.string()).default([]),
  split_type: z.enum(["equal", "percentage", "exact"]).default("equal"),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateExpenseSchema = insertExpenseSchema.partial();

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Type definitions for API responses
export type Person = {
  name: string;
  total_paid: number;
  total_owed: number;
  balance: number;
};

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

export type DashboardStats = {
  totalExpenses: number;
  totalAmount: number;
  pendingSettlements: number;
};
