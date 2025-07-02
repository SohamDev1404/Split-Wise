import "dotenv/config";
import { db } from "./db";
import { expenses, recurring_expenses } from "@shared/schema";

async function seed() {
  const sampleExpenses = [
    {
      amount: "1200",
      description: "Dinner at Italian Restaurant",
      paid_by: "Shantanu",
      split_with: ["Sanket", "Om"],
      split_type: "equal",
      category: "Food",
    },
    {
      amount: "3000",
      description: "Uber to Airport",
      paid_by: "Sanket",
      split_with: ["Shantanu", "Om"],
      split_type: "equal",
      category: "Travel",
    },
    {
      amount: "800",
      description: "Movie Tickets",
      paid_by: "Om",
      split_with: ["Shantanu", "Sanket"],
      split_type: "equal",
      category: "Entertainment",
    },
    {
      amount: "1500",
      description: "Electricity Bill",
      paid_by: "Shantanu",
      split_with: ["Sanket", "Om"],
      split_type: "equal",
      category: "Utilities",
    },
    {
      amount: "2500",
      description: "Groceries for Party",
      paid_by: "Sanket",
      split_with: ["Shantanu", "Om"],
      split_type: "equal",
      category: "Food",
    },
    {
      amount: "600",
      description: "Coffee and Snacks",
      paid_by: "Om",
      split_with: ["Shantanu"],
      split_type: "equal",
      category: "Food",
    },
  ];

  for (const expense of sampleExpenses) {
    await db.insert(expenses).values(expense);
    console.log(`Inserted: ${expense.description}`);
  }

  // After seeding normal expenses, seed a recurring rent
  await db.insert(recurring_expenses).values({
    amount: "12000",
    description: "Monthly Apartment Rent",
    paid_by: "Shantanu",
    split_with: ["Sanket", "Om"],
    split_type: "equal",
    category: "Utilities",
    frequency: "monthly",
    next_occurrence: new Date(),
    active: true,
  });
  console.log("Inserted: Monthly Apartment Rent (recurring)");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
}); 