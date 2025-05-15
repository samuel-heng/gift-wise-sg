
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SpendingOverviewProps {
  spent: number;
  budget: number;
  currency?: string;
}

export const SpendingOverview: React.FC<SpendingOverviewProps> = ({
  spent,
  budget,
  currency = '$'
}) => {
  const percentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const isOverBudget = spent > budget;
  const remaining = budget - spent;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex justify-between">
          <span>Yearly Budget</span>
          <span className={isOverBudget ? 'text-destructive' : 'text-gift-accent'}>
            {currency}{spent.toFixed(2)} / {currency}{budget.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2" />
        
        <div className="flex justify-between mt-2 text-sm">
          <span>
            {percentage}% used
          </span>
          <span className={isOverBudget ? 'text-destructive' : 'text-muted-foreground'}>
            {isOverBudget
              ? `${currency}${Math.abs(remaining).toFixed(2)} over budget`
              : `${currency}${remaining.toFixed(2)} remaining`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
