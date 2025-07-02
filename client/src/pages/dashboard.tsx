import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Plus, Edit, Trash2 } from "lucide-react";
import type { InsertExpense, UpdateExpense } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [newExpense, setNewExpense] = useState<InsertExpense>({
    amount: "",
    description: "",
    paid_by: "",
    split_with: [],
    split_type: "equal",
    category: "Other"
  });
  
  const [splitWithInput, setSplitWithInput] = useState("");
  
  const [editingExpense, setEditingExpense] = useState<{id: string, data: UpdateExpense} | null>(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");

  const [splitType, setSplitType] = useState<"equal" | "percentage" | "exact">("equal");
  const [splitDetails, setSplitDetails] = useState<Record<string, number | string>>({});

  // Queries
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: () => api.getExpenses(),
  });

  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ["/api/people"],
    queryFn: () => api.getPeople(),
  });

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ["/api/balances"],
    queryFn: () => api.getBalances(),
  });

  const { data: settlements, isLoading: settlementsLoading } = useQuery({
    queryKey: ["/api/settlements"],
    queryFn: () => api.getSettlements(),
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      toast({ title: "Success", description: "Expense added successfully" });
      setNewExpense({ amount: "", description: "", paid_by: "", split_with: [], split_type: "equal", category: "Other" });
      setSplitWithInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settlements"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpense }) => api.updateExpense(id, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Expense updated successfully" });
      setEditingExpense(null);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settlements"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      toast({ title: "Success", description: "Expense deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settlements"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete expense", variant: "destructive" });
    },
  });

  const settleSettlementMutation = useMutation({
    mutationFn: api.settleSettlement,
    onSuccess: () => {
      toast({ title: "Success", description: "Settlement marked as paid" });
      queryClient.invalidateQueries({ queryKey: ["/api/settlements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to mark as paid", variant: "destructive" });
    },
  });

  // Compute participants for split
  const paidBy = newExpense.paid_by.trim();
  const splitWithNames = splitWithInput
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  const participants = Array.from(new Set([paidBy, ...splitWithNames].filter(Boolean)));

  // Reset splitDetails when participants or splitType changes
  useEffect(() => {
    setSplitDetails((prev) => {
      const updated: Record<string, number | string> = {};
      for (const name of participants) {
        updated[name] = prev[name] ?? 0;
      }
      return updated;
    });
  }, [participants.join(','), splitType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse split_with names from the input
    const splitWithNames = splitWithInput
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    const expenseData: any = {
      ...newExpense,
      split_with: splitWithNames,
      split_type: splitType,
    };
    if (splitType === "percentage" || splitType === "exact") {
      // Convert all values to numbers for backend
      const splitDetailsNumbers: Record<string, number> = {};
      for (const key in splitDetails) {
        splitDetailsNumbers[key] = Number(splitDetails[key]) || 0;
      }
      expenseData.split_details = splitDetailsNumbers;
      // Validation
      if (splitType === "percentage") {
        const total = Object.values(splitDetailsNumbers).reduce((a, b) => a + Number(b), 0);
        if (Math.abs(total - 100) > 0.01) {
          toast({
            title: "Error",
            description: "Percentages must sum to 100%.",
            variant: "destructive",
          });
          return;
        }
      } else if (splitType === "exact") {
        const total = Object.values(splitDetailsNumbers).reduce((a, b) => a + Number(b), 0);
        if (Math.abs(total - Number(newExpense.amount)) > 0.01) {
          toast({
            title: "Error",
            description: "Exact amounts must sum to the total amount.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    createExpenseMutation.mutate(expenseData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateExpenseMutation.mutate(editingExpense);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <h1 className="text-2xl font-bold text-primary flex items-center">
              <Receipt className="mr-2 h-8 w-8" />
              SplitWise
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Expense Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Expense
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="e.g., Dinner at restaurant"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paid_by">Paid By</Label>
                      <Input
                        id="paid_by"
                        value={newExpense.paid_by}
                        onChange={(e) => setNewExpense({...newExpense, paid_by: e.target.value})}
                        placeholder="Enter person's name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="split_with">With you and:</Label>
                      <Input
                        id="split_with"
                        value={splitWithInput}
                        onChange={(e) => setSplitWithInput(e.target.value)}
                        placeholder="Enter names or email addresses"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Separate multiple names with commas (e.g., "John, Sarah, Mike")
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value as any})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food">🍔 Food</SelectItem>
                          <SelectItem value="Travel">✈️ Travel</SelectItem>
                          <SelectItem value="Utilities">⚡ Utilities</SelectItem>
                          <SelectItem value="Entertainment">🎮 Entertainment</SelectItem>
                          <SelectItem value="Other">📦 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Split Type Selection */}
                    <div>
                      <Label htmlFor="split_type">Split Type</Label>
                      <Select value={splitType} onValueChange={(value) => setSplitType(value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select split type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Equal Split</SelectItem>
                          <SelectItem value="percentage">Percentage Split</SelectItem>
                          <SelectItem value="exact">Exact Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Dynamic split details input */}
                    {(splitType === "percentage" || splitType === "exact") && participants.length > 0 && (
                      <div className="border rounded p-3 bg-gray-50">
                        <Label className="mb-2 block">
                          {splitType === "percentage"
                            ? "Enter percentage for each participant (total 100%)"
                            : "Enter exact amount for each participant (total = amount)"}
                        </Label>
                        {participants.map((name) => (
                          <div key={name} className="flex items-center space-x-2 mt-2">
                            <span className="w-32">{name}</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={splitDetails[name] === 0 ? "0" : splitDetails[name] === undefined ? "" : splitDetails[name]}
                              onFocus={e => {
                                if (splitDetails[name] === 0) {
                                  setSplitDetails(sd => ({ ...sd, [name]: "" }));
                                }
                              }}
                              onBlur={e => {
                                if (e.target.value === "" || e.target.value === undefined) {
                                  setSplitDetails(sd => ({ ...sd, [name]: 0 }));
                                }
                              }}
                              onChange={e => {
                                setSplitDetails(sd => ({
                                  ...sd,
                                  [name]: e.target.value
                                }));
                              }}
                              className="w-32"
                              placeholder={splitType === "percentage" ? "Percent" : "Amount"}
                            />
                            <span>{splitType === "percentage" ? "%" : "₹"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                      />
                      <Label htmlFor="recurring" className="text-gray-800 text-base font-normal">Make this a recurring expense</Label>
                      {isRecurring && (
                        <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                          <SelectTrigger className="w-32 ml-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Expenses List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {expensesLoading ? (
                    <div>Loading expenses...</div>
                  ) : expenses && expenses.length > 0 ? (
                    <div className="space-y-3">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="p-3 border rounded-lg">
                          {editingExpense?.id === expense.id ? (
                            <form onSubmit={handleUpdate} className="space-y-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={editingExpense.data.amount || expense.amount}
                                onChange={(e) => setEditingExpense({
                                  ...editingExpense,
                                  data: {...editingExpense.data, amount: e.target.value}
                                })}
                              />
                              <Input
                                value={editingExpense.data.description || expense.description}
                                onChange={(e) => setEditingExpense({
                                  ...editingExpense,
                                  data: {...editingExpense.data, description: e.target.value}
                                })}
                              />
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={updateExpenseMutation.isPending}>
                                  Save
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditingExpense(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{expense.description}</div>
                                <div className="text-sm text-gray-600">
                                  ₹{expense.amount} • Paid by {expense.paid_by} • {expense.category || 'Other'}
                                  {expense.split_with && expense.split_with.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Split with: {expense.split_with.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingExpense({id: expense.id, data: {}})}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(expense.id)}
                                  disabled={deleteExpenseMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No expenses yet. Add your first expense!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people">
            <Card>
              <CardHeader>
                <CardTitle>All People</CardTitle>
              </CardHeader>
              <CardContent>
                {peopleLoading ? (
                  <div>Loading people...</div>
                ) : people && people.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {people.map((person) => (
                      <div key={person.name} className="p-4 border rounded-lg text-center">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-gray-600">Total Paid: ₹{person.total_paid}</div>
                        <div className="text-sm text-gray-600">Total Owed: ₹{person.total_owed}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No people yet. Add expenses to see people automatically.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances">
            <Card>
              <CardHeader>
                <CardTitle>Current Balances</CardTitle>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div>Loading balances...</div>
                ) : balances && balances.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {balances.map((person) => (
                      <div key={person.name} className="p-4 border rounded-lg text-center">
                        <div className="font-medium">{person.name}</div>
                        <div className={`text-lg font-bold ${
                          person.balance > 0 ? 'text-green-600' :
                          person.balance < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {person.balance > 0 ? '+' : ''}₹{person.balance}
                        </div>
                        <div className="text-sm text-gray-600">
                          {person.balance > 0 ? 'Gets back' :
                           person.balance < 0 ? 'Owes' : 'Settled'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No balances to show. Add expenses to see balances.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements">
            <Card>
              <CardHeader>
                <CardTitle>Settlement Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {settlementsLoading ? (
                  <div>Loading settlements...</div>
                ) : settlements && settlements.length > 0 ? (
                  <div className="space-y-4">
                    {settlements.map((settlement, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {settlement.from} → {settlement.to}
                            </div>
                            <div className="text-sm text-gray-600">Settlement transaction</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-xl font-bold text-red-600">
                              ₹{settlement.amount}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => settleSettlementMutation.mutate(settlement)}
                              disabled={settleSettlementMutation.isPending}
                            >
                              Paid
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center text-sm text-gray-600 pt-4 border-t">
                      {settlements.length} transaction{settlements.length !== 1 ? 's' : ''} needed to settle all balances
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No settlements needed. All balances are settled!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses && expenses.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(
                        expenses.reduce((acc, expense) => {
                          const category = expense.category || 'Other';
                          const amount = parseFloat(expense.amount);
                          acc[category] = (acc[category] || 0) + amount;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, total]) => {
                        const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
                        const percentage = ((total / totalAmount) * 100).toFixed(1);
                        return (
                          <div key={category} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{category}</div>
                              <div className="text-sm text-gray-600">{percentage}% of total spending</div>
                            </div>
                            <div className="text-lg font-bold">₹{total.toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No expenses yet. Add some expenses to see analytics!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses && expenses.length > 0 ? (
                    <div className="space-y-3">
                      {[...expenses]
                        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                        .slice(0, 5)
                        .map((expense) => (
                          <div key={expense.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{expense.description}</div>
                              <div className="text-sm text-gray-600">
                                {expense.category || 'Other'} • Paid by {expense.paid_by}
                              </div>
                            </div>
                            <div className="text-lg font-bold">₹{expense.amount}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No expenses yet. Add some expenses to see top expenses!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Spending Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses && expenses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(
                        expenses.reduce((acc, expense) => {
                          const date = new Date(expense.created_at);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                          if (!acc[monthKey]) {
                            acc[monthKey] = { name: monthName, total: 0, count: 0 };
                          }
                          acc[monthKey].total += parseFloat(expense.amount);
                          acc[monthKey].count += 1;
                          return acc;
                        }, {} as Record<string, { name: string; total: number; count: number }>)
                      )
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([key, data]) => (
                        <div key={key} className="p-4 border rounded-lg text-center">
                          <div className="font-medium">{data.name}</div>
                          <div className="text-2xl font-bold text-blue-600">₹{data.total.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">{data.count} expense{data.count !== 1 ? 's' : ''}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No expenses yet. Add some expenses to see monthly summaries!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
