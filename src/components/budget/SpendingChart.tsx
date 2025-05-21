import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SpendingData {
  category: string;
  amount: number;
}

interface SpendingChartProps {
  data: SpendingData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function SpendingChart({ data }: SpendingChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="h-[300px]">
      <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ category, amount }) => `${category}: $${amount.toFixed(2)}`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2">
        <span className="font-semibold">Total: ${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
