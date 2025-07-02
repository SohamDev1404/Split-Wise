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
    return result.rowCount > 0;
  }

  async getPeople(): Promise<Person[]> {
    const allExpenses = await this.getExpenses();
    const peopleMap = new Map<string, Person>();

    // Initialize all people
    for (const expense of allExpenses) {
      if (!peopleMap.has(expense.paid_by)) {
        peopleMap.set(expense.paid_by, {
          name: expense.paid_by,
          total_paid: 0,
          total_owed: 0,
          balance: 0,
        });
      }
    }

    // Calculate totals
    const allPeople = Array.from(peopleMap.keys());
    const totalPeople = allPeople.length;

    if (totalPeople === 0) return [];

    for (const expense of allExpenses) {
      const amount = parseFloat(expense.amount);
      const person = peopleMap.get(expense.paid_by)!;
      
      // Add to what they paid
      person.total_paid += amount;
      
      // Add to what everyone owes (including themselves)
      const sharePerPerson = amount / totalPeople;
      for (const personName of allPeople) {
        const p = peopleMap.get(personName)!;
        p.total_owed += sharePerPerson;
      }
    }

    // Calculate balances
    for (const person of peopleMap.values()) {
      person.balance = person.total_paid - person.total_owed;
      // Round to 2 decimal places
      person.total_paid = Math.round(person.total_paid * 100) / 100;
      person.total_owed = Math.round(person.total_owed * 100) / 100;
      person.balance = Math.round(person.balance * 100) / 100;
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
