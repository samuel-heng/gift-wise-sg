// Import React and useState hook for managing component state
import React, { useState, useEffect } from 'react';
// Import page layout component for consistent structure
import { PageLayout } from '@/components/layout/PageLayout';
// Import components specific to the budget page
import { BudgetForm } from '@/components/budget/BudgetForm';
import { SpendingChart } from '@/components/budget/SpendingChart';
import { RecentPurchases } from '@/components/budget/RecentPurchases';
// Import UI tab components for navigation between views
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userProfileService, purchaseService } from '../lib/db';
import type { Purchase, UserProfile } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format } from 'date-fns';

const Budget = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [budget, setBudget] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [purchases, setPurchases] = useState<(Purchase & { gifts: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handler for when user saves a new budget amount
  const handleSaveBudget = async (newBudget: number) => {
    if (!userProfile) return;
    try {
      const updated = await userProfileService.updateBudget(userProfile.id, newBudget);
      setUserProfile(updated);
      setBudget(updated.yearly_budget);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await userProfileService.getDefaultProfile();
        setUserProfile(profile);
        setBudget(profile.yearly_budget);
        const data = await purchaseService.getAll(profile.id);
        setPurchases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading budget data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  // Calculate total spent
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.price, 0);
  const percentUsed = Math.min((totalSpent / budget) * 100, 100);
  const remaining = Math.max(budget - totalSpent, 0);

  // Group purchases by month
  const purchasesByMonth = purchases.reduce((acc, purchase) => {
    const month = format(new Date(purchase.purchase_date), 'MMMM yyyy');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(purchase);
    return acc;
  }, {} as Record<string, typeof purchases>);

  // Prepare data for spending chart
  const spendingCategories = purchases.reduce((acc, purchase) => {
    const category = purchase.gifts.name.split(' ')[0]; // Simple categorization based on first word
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += purchase.price;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(spendingCategories).map(([category, amount]) => ({
    category,
    amount
  }));

  // Get recent purchases (last 5)
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .slice(0, 5);

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
            <SpendingChart data={chartData} />
            
            {/* Recent Purchases - shows the most recent transactions */}
            <RecentPurchases purchases={recentPurchases} />
          </TabsContent>
          
          {/* Settings tab content - allows user to update their budget */}
          <TabsContent value="settings" className="mt-4">
            <BudgetForm currentBudget={budget} onSave={handleSaveBudget} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Budget Overview</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {Object.entries(purchasesByMonth).map(([month, monthPurchases]) => {
            const monthTotal = monthPurchases.reduce((sum, p) => sum + p.price, 0);
            
            return (
              <div key={month}>
                <h2 className="text-xl font-semibold mb-4">{month}</h2>
                <div className="space-y-4">
                  {monthPurchases.map((purchase) => (
                    <Card key={purchase.id}>
                      <CardHeader>
                        <CardTitle>{purchase.gifts.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          <div className="text-sm">
                            <span className="font-semibold">Price:</span> ${purchase.price}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Date:</span>{' '}
                            {format(new Date(purchase.purchase_date), 'MMMM d, yyyy')}
                          </div>
                          {purchase.notes && (
                            <div className="text-sm">
                              <span className="font-semibold">Notes:</span> {purchase.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="text-right font-semibold">
                    Month Total: ${monthTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default Budget;
