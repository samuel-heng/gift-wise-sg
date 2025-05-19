// Import React and useState hook for managing component state
import React, { useState } from 'react';
// Import page layout component for consistent structure
import { PageLayout } from '@/components/layout/PageLayout';
// Import components specific to the budget page
import { BudgetForm } from '@/components/budget/BudgetForm';
import { SpendingChart } from '@/components/budget/SpendingChart';
import { RecentPurchases } from '@/components/budget/RecentPurchases';
// Import UI tab components for navigation between views
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Import mock data for demonstration
import { mockPurchaseData, mockSpendingCategories } from '@/lib/mockData';

const Budget = () => {
  // State to track the user's budget amount
  const [budget, setBudget] = useState<number>(500);
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Handler for when user saves a new budget amount
  const handleSaveBudget = (newBudget: number) => {
    setBudget(newBudget);
  };

  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        {/* Tabs for switching between overview and settings */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Overview tab content - shows spending chart and recent purchases */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Spending Chart - visualizes spending by category */}
            <SpendingChart data={mockSpendingCategories} />
            
            {/* Recent Purchases - shows the most recent transactions */}
            <RecentPurchases purchases={mockPurchaseData.slice(0, 5)} />
          </TabsContent>
          
          {/* Settings tab content - allows user to update their budget */}
          <TabsContent value="settings" className="mt-4">
            <BudgetForm currentBudget={budget} onSave={handleSaveBudget} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Budget;
