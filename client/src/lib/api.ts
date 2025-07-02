import { apiRequest } from "./queryClient";
import type { InsertExpense, UpdateExpense, Expense, Person, Settlement, DashboardStats } from "@shared/schema";

export const api = {
  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    const response = await apiRequest("GET", "/api/expenses");
    const data = await response.json();
    return data.data;
  },

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const response = await apiRequest("POST", "/api/expenses", expense);
    const data = await response.json();
    return data.data;
  },

  async updateExpense(id: string, expense: UpdateExpense): Promise<Expense> {
    const response = await apiRequest("PUT", `/api/expenses/${id}`, expense);
    const data = await response.json();
    return data.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/expenses/${id}`);
  },

  // Analytics operations
  async getPeople(): Promise<Person[]> {
    const response = await apiRequest("GET", "/api/people");
    const data = await response.json();
    return data.data;
  },

  async getBalances(): Promise<Person[]> {
    const response = await apiRequest("GET", "/api/balances");
    const data = await response.json();
    return data.data;
  },

  async getSettlements(): Promise<Settlement[]> {
    const response = await apiRequest("GET", "/api/settlements");
    const data = await response.json();
    return data.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiRequest("GET", "/api/stats");
    const data = await response.json();
    return data.data;
  },

  async settleSettlement(settlement: { from: string; to: string; amount: number }): Promise<any> {
    const response = await apiRequest("POST", "/api/settlements/settle", settlement);
    const data = await response.json();
    return data;
  },
};
