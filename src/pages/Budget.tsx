
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { SpendingChart } from '@/components/budget/SpendingChart';
import { RecentPurchases } from '@/components/budget/RecentPurchases';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPurchaseData, mockSpendingCategories } from '@/lib/mockData';

const Budget = () => {
  const [budget, setBudget] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const handleSaveBudget = (newBudget: number) => {
    setBudget(newBudget);
  };

  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Spending Chart */}
            <SpendingChart data={mockSpendingCategories} />
            
            {/* Recent Purchases */}
            <RecentPurchases purchases={mockPurchaseData.slice(0, 5)} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <BudgetForm currentBudget={budget} onSave={handleSaveBudget} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Budget;
