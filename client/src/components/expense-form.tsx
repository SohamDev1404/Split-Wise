import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type InsertExpense } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "exact">("equal");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");

  const { data: people } = useQuery({
    queryKey: ["/api/people"],
    queryFn: () => api.getPeople(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      split_type: "equal",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settlements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertExpense) => {
    if (isRecurring) {
      // TODO: Replace with actual API call to create recurring expense
      toast({
        title: "Recurring Expense (Demo)",
        description: `Would create a ${recurringFrequency} recurring expense!`,
      });
      reset();
      setIsRecurring(false);
      setRecurringFrequency("monthly");
      onSuccess?.();
      return;
    }
    createExpenseMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount (₹)
        </Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          {...register("amount")}
          className="w-full"
        />
        {errors.amount && (
          <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </Label>
        <Input
          id="description"
          placeholder="e.g., Dinner at restaurant"
          {...register("description")}
          className="w-full"
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="paid_by" className="block text-sm font-medium text-gray-700 mb-2">
          Paid By
        </Label>
        <Input
          id="paid_by"
          placeholder="Enter person's name"
          {...register("paid_by")}
          className="w-full"
          list="people-list"
        />
        <datalist id="people-list">
          {people?.map((person) => (
            <option key={`person-${person.name}`} value={person.name} />
          ))}
          <option key="default-shantanu" value="Shantanu" />
          <option key="default-sanket" value="Sanket" />
          <option key="default-om" value="Om" />
        </datalist>
        {errors.paid_by && (
          <p className="text-sm text-destructive mt-1">{errors.paid_by.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="split_type" className="block text-sm font-medium text-gray-700 mb-2">
          Split Type
        </Label>
        <Select
          onValueChange={(value: "equal" | "percentage" | "exact") => {
            setSplitType(value);
            setValue("split_type", value);
          }}
          defaultValue="equal"
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equal">Equal Split</SelectItem>
            <SelectItem value="percentage">Percentage Split</SelectItem>
            <SelectItem value="exact">Exact Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <Button
        type="submit"
        className="w-full bg-primary text-white hover:bg-blue-700 transition-colors font-medium"
        disabled={createExpenseMutation.isPending}
      >
        <Plus className="mr-2 h-4 w-4" />
        {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
      </Button>
    </form>
  );
}
