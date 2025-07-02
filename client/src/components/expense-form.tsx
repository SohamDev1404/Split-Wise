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
        <Select onValueChange={(value) => setValue("paid_by", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select person or enter new name" />
          </SelectTrigger>
          <SelectContent>
            {people?.map((person) => (
              <SelectItem key={person.name} value={person.name}>
                {person.name}
              </SelectItem>
            ))}
            <SelectItem value="Shantanu">Shantanu</SelectItem>
            <SelectItem value="Sanket">Sanket</SelectItem>
            <SelectItem value="Om">Om</SelectItem>
          </SelectContent>
        </Select>
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
