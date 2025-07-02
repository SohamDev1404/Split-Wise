import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/stats-cards";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { BalanceSummary } from "@/components/balance-summary";
import { SettlementRecommendations } from "@/components/settlement-recommendations";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Dashboard() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  const settlementRef = useRef<HTMLDivElement>(null);
  const expenseRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary flex items-center">
                  <Receipt className="mr-2 h-8 w-8" />
                  SplitWise
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                  </DialogHeader>
                  <ExpenseForm onSuccess={() => setShowAddExpense(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
          <StatsCards />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Expense Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Plus className="text-primary mr-2 h-5 w-5" />
                Add New Expense
              </h3>
              <ExpenseForm />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => scrollToSection(settlementRef)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-primary mr-3">🧮</span>
                  <span className="font-medium">Calculate Settlements</span>
                </button>
                <button 
                  onClick={() => scrollToSection(balanceRef)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-primary mr-3">👥</span>
                  <span className="font-medium">View All People</span>
                </button>
                <button 
                  onClick={() => scrollToSection(expenseRef)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-primary mr-3">📊</span>
                  <span className="font-medium">Expense Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Expense List and Settlements */}
          <div className="lg:col-span-2 space-y-8">
            <div ref={expenseRef}>
              <ExpenseList />
            </div>
            <div ref={balanceRef}>
              <BalanceSummary />
            </div>
            <div ref={settlementRef}>
              <SettlementRecommendations />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
