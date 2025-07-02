import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    split_type: "equal"
  });
  
  const [splitWithInput, setSplitWithInput] = useState("");
  
  const [editingExpense, setEditingExpense] = useState<{id: string, data: UpdateExpense} | null>(null);

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
      setNewExpense({ amount: "", description: "", paid_by: "", split_with: [], split_type: "equal" });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse split_with names from the input
    const splitWithNames = splitWithInput
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    const expenseData = {
      ...newExpense,
      split_with: splitWithNames
    };
    
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
              SplitWise API
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
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
                                  ₹{expense.amount} • Paid by {expense.paid_by}
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
                          <div className="text-xl font-bold text-red-600">
                            ₹{settlement.amount}
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
        </Tabs>
      </div>
    </div>
  );
}
