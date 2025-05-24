import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieLabelRenderProps } from 'recharts';

interface SpendingData {
  category: string;
  amount: number;
}

interface SpendingChartProps {
  data: SpendingData[];
}

// Accessible Modern Palette for high contrast
const COLORS = ['#2563EB', '#10B981', '#F59E42', '#F43F5E', '#A21CAF', '#FACC15', '#0EA5E9'];

export function SpendingChart({ data }: SpendingChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Custom label to show category and percent, with truncation and tooltip
  const renderLabel = (props: PieLabelRenderProps) => {
    // Only use the minimum needed for label rendering
    const { category, cx, cy, midAngle, outerRadius, percent, index } = props as any;
    if (!category) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 24;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={13}
        style={{ pointerEvents: 'auto' }}
      >
        {`${category}: ${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <div className="h-[340px] w-full flex flex-col justify-between">
      <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
            dataKey="amount"
            nameKey="category"
                cx="50%"
                cy="50%"
            outerRadius={100}
            label={renderLabel}
                labelLine={false}
              >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
            formatter={(value: number, name: string, props: any) => [`$${value.toFixed(2)}`, 'Amount']}
              />
          {/* Legend inside chart, always rendered, centered, with wrapping */}
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: '100%',
              margin: '0 auto',
              minHeight: 32,
            }}
          />
            </PieChart>
          </ResponsiveContainer>
        </div>
  );
}
