import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, updateExpenseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function for error handling
  const handleError = (res: any, error: any, defaultMessage: string = "Internal server error") => {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: defaultMessage,
    });
  };

  // Expense Management Routes
  
  // GET /api/expenses - List all expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json({
        success: true,
        data: expenses,
        message: "Expenses retrieved successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch expenses");
    }
  });

  // POST /api/expenses - Add new expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json({
        success: true,
        data: expense,
        message: "Expense added successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to create expense");
    }
  });

  // PUT /api/expenses/:id - Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if expense exists
      const existingExpense = await storage.getExpenseById(id);
      if (!existingExpense) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      const validatedData = updateExpenseSchema.parse(req.body);
      const updatedExpense = await storage.updateExpense(id, validatedData);
      
      res.json({
        success: true,
        data: updatedExpense,
        message: "Expense updated successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to update expense");
    }
  });

  // DELETE /api/expenses/:id - Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.json({
        success: true,
        message: "Expense deleted successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to delete expense");
    }
  });

  // Settlement & People Routes

  // GET /api/people - List all people (derived from expenses)
  app.get("/api/people", async (req, res) => {
    try {
      const people = await storage.getPeople();
      res.json({
        success: true,
        data: people,
        message: "People retrieved successfully"
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch people");
    }
  });

  // GET /api/balances - Show each person's balance
  app.get("/api/balances", async (req, res) => {
    try {
      const balances = await storage.getBalances();
      res.json({
        success: true,
        data: balances,
        message: "Balances retrieved successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch balances");
    }
  });

  // GET /api/settlements - Get optimized settlement summary
  app.get("/api/settlements", async (req, res) => {
    try {
      const settlements = await storage.getSettlements();
      res.json({
        success: true,
        data: settlements,
        message: "Settlements retrieved successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch settlements");
    }
  });

  // GET /api/stats - Get dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json({
        success: true,
        data: stats,
        message: "Statistics retrieved successfully",
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch statistics");
    }
  });

  // POST /api/settlements/settle - Mark a settlement as paid
  app.post("/api/settlements/settle", async (req, res) => {
    try {
      const { from, to, amount } = req.body;
      if (!from || !to || !amount) {
        return res.status(400).json({ success: false, message: "Missing from, to, or amount" });
      }
      // Create a settlement expense: from pays to
      const expense = await storage.createExpense({
        amount: amount.toString(),
        description: `Settlement: ${from} paid ${to}`,
        paid_by: from,
        split_with: [to],
        split_type: "exact",
        split_details: { [to]: amount },
        category: "Other",
      });
      res.status(201).json({ success: true, data: expense, message: "Settlement marked as paid" });
    } catch (error) {
      handleError(res, error, "Failed to mark settlement as paid");
    }
  });

  // GET /api/settlements/settled - List all settled transactions
  app.get("/api/settlements/settled", async (req, res) => {
    try {
      const allExpenses = await storage.getExpenses();
      const settled = allExpenses.filter(exp => exp.description && exp.description.startsWith("Settlement:"));
      res.json({ success: true, data: settled, message: "Settled transactions retrieved successfully" });
    } catch (error) {
      handleError(res, error, "Failed to fetch settled transactions");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
