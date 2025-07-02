import { expenses, type Expense, type InsertExpense, type UpdateExpense, type Person, type Settlement, type DashboardStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Expense operations
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  updateExpense(id: string, expense: UpdateExpense): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Analytics operations
  getPeople(): Promise<Person[]>;
  getBalances(): Promise<Person[]>;
  getSettlements(): Promise<Settlement[]>;
  getDashboardStats(): Promise<DashboardStats>;
}

// Add utility functions for normalization and money rounding
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}
function displayName(name: string): string {
  // Capitalize first letter of each word
  return name.trim().replace(/\b\w/g, c => c.toUpperCase());
}
function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export class DatabaseStorage implements IStorage {
  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values({
        ...expenseData,
        updated_at: new Date(),
      })
      .returning();
    return expense;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.created_at));
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return expense || undefined;
  }

  async updateExpense(id: string, expenseData: UpdateExpense): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set({
        ...expenseData,
        updated_at: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning();
    return expense || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPeople(): Promise<Person[]> {
    const allExpenses = await this.getExpenses();
    const peopleMap = new Map<string, Person>();

    // Initialize all people (from paid_by and split_with)
    for (const expense of allExpenses) {
      // Add person who paid (normalize name)
      const normalizedPaidBy = normalizeName(expense.paid_by);
      const shownPaidBy = displayName(expense.paid_by);
      if (!peopleMap.has(normalizedPaidBy)) {
        peopleMap.set(normalizedPaidBy, {
          name: shownPaidBy,
          total_paid: 0,
          total_owed: 0,
          balance: 0,
        });
      }
      // Add people from split_with array
      if (expense.split_with && expense.split_with.length > 0) {
        for (const personName of expense.split_with) {
          const normalizedName = normalizeName(personName);
          const shownName = displayName(personName);
          if (normalizedName && !peopleMap.has(normalizedName)) {
            peopleMap.set(normalizedName, {
              name: shownName,
              total_paid: 0,
              total_owed: 0,
              balance: 0,
            });
          }
        }
      }
    }
    if (peopleMap.size === 0) return [];

    // Calculate totals for each expense
    for (const expense of allExpenses) {
      const amount = parseFloat(expense.amount);
      const normalizedPaidBy = normalizeName(expense.paid_by);
      const payer = peopleMap.get(normalizedPaidBy)!;
      payer.total_paid += amount;

      // Get all people involved in this expense (payer + split_with)
      const allInvolvedPeople = [expense.paid_by, ...(expense.split_with || [])];
      const uniquePeopleSplit = Array.from(new Set(allInvolvedPeople.map(normalizeName).filter(Boolean)));

      // Handle split types
      if (expense.split_type === 'equal' || !expense.split_type) {
        // Equal split
        const sharePerPerson = amount / uniquePeopleSplit.length;
        for (const normalizedPersonName of uniquePeopleSplit) {
          const person = peopleMap.get(normalizedPersonName);
          if (person) {
            person.total_owed += sharePerPerson;
          }
        }
      } else if (expense.split_type === 'percentage' && expense.split_details) {
        // Percentage split
        const details = expense.split_details as Record<string, number | string>;
        for (const normalizedPersonName of uniquePeopleSplit) {
          const person = peopleMap.get(normalizedPersonName);
          if (person) {
            // Find the original name in split_with or paid_by
            let origName = allInvolvedPeople.find(n => normalizeName(n) === normalizedPersonName) || '';
            let percent = 0;
            if (details && typeof details === 'object' && origName in details) {
              percent = Number(details[origName] || 0);
            }
            person.total_owed += (amount * percent) / 100;
          }
        }
      } else if (expense.split_type === 'exact' && expense.split_details) {
        // Exact split
        const details = expense.split_details as Record<string, number | string>;
        for (const normalizedPersonName of uniquePeopleSplit) {
          const person = peopleMap.get(normalizedPersonName);
          if (person) {
            // Find the original name in split_with or paid_by
            let origName = allInvolvedPeople.find(n => normalizeName(n) === normalizedPersonName) || '';
            let exact = 0;
            if (details && typeof details === 'object' && origName in details) {
              exact = Number(details[origName] || 0);
            }
            person.total_owed += exact;
          }
        }
      }
    }

    // Calculate balances and round
    for (const person of Array.from(peopleMap.values())) {
      person.total_paid = roundMoney(person.total_paid);
      person.total_owed = roundMoney(person.total_owed);
      person.balance = roundMoney(person.total_paid - person.total_owed);
    }

    return Array.from(peopleMap.values());
  }

  async getBalances(): Promise<Person[]> {
    return await this.getPeople();
  }

  async getSettlements(): Promise<Settlement[]> {
    const people = await this.getPeople();
    
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = people.filter(p => p.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = people.filter(p => p.balance < -0.01).sort((a, b) => a.balance - b.balance);
    
    const settlements: Settlement[] = [];
    
    // Create copies to avoid modifying original arrays
    const creditorsToSettle = creditors.map(c => ({ ...c }));
    const debtorsToSettle = debtors.map(d => ({ ...d }));
    
    // Minimize transactions using greedy algorithm
    while (creditorsToSettle.length > 0 && debtorsToSettle.length > 0) {
      const creditor = creditorsToSettle[0];
      const debtor = debtorsToSettle[0];
      
      const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settlementAmount * 100) / 100,
      });
      
      creditor.balance -= settlementAmount;
      debtor.balance += settlementAmount;
      
      // Remove settled parties
      if (creditor.balance < 0.01) {
        creditorsToSettle.shift();
      }
      if (Math.abs(debtor.balance) < 0.01) {
        debtorsToSettle.shift();
      }
    }
    
    return settlements;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allExpenses = await this.getExpenses();
    const settlements = await this.getSettlements();
    
    const totalAmount = allExpenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount);
    }, 0);
    
    return {
      totalExpenses: allExpenses.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      pendingSettlements: settlements.length,
    };
  }
}

export const storage = new DatabaseStorage();
