import "dotenv/config";
import { db } from "./db";
import { recurring_expenses, expenses } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function addWeeks(date: Date, weeks: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

async function processRecurring() {
  const now = new Date();
  const dueRecurring = await db.select().from(recurring_expenses).where(and(eq(recurring_expenses.active, true), lte(recurring_expenses.next_occurrence, now)));

  for (const rec of dueRecurring) {
    // Insert a new expense
    await db.insert(expenses).values({
      amount: rec.amount,
      description: rec.description + " (recurring)",
      paid_by: rec.paid_by,
      split_with: rec.split_with,
      split_type: rec.split_type,
      category: rec.category,
    });
    console.log(`Inserted recurring expense: ${rec.description}`);

    // Calculate next occurrence
    let next;
    if (rec.frequency === "monthly") {
      next = addMonths(new Date(rec.next_occurrence), 1);
    } else if (rec.frequency === "weekly") {
      next = addWeeks(new Date(rec.next_occurrence), 1);
    } else {
      // Default: monthly
      next = addMonths(new Date(rec.next_occurrence), 1);
    }
    // Update next_occurrence
    await db.update(recurring_expenses).set({ next_occurrence: next }).where(eq(recurring_expenses.id, rec.id));
    console.log(`Updated next_occurrence for: ${rec.description}`);
  }
  console.log("Recurring processing complete!");
  process.exit(0);
}

processRecurring().catch((err) => {
  console.error("Recurring processing failed:", err);
  process.exit(1);
}); 