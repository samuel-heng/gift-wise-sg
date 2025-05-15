
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const formSchema = z.object({
  yearlyBudget: z.string()
    .min(1, { message: "Budget is required" })
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Budget must be a positive number",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface BudgetFormProps {
  currentBudget: number;
  onSave: (budget: number) => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ 
  currentBudget,
  onSave
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      yearlyBudget: currentBudget.toString(),
    },
  });

  const onSubmit = (data: FormValues) => {
    const budget = parseFloat(data.yearlyBudget);
    onSave(budget);
    toast.success('Budget updated successfully!');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="yearlyBudget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yearly Gift Budget</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Set your yearly budget for all gift purchases.
              </FormDescription>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          Save Budget
        </Button>
      </form>
    </Form>
  );
};
