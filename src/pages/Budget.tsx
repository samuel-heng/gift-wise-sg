// Import React and useState hook for managing component state
import React, { useState, useEffect, useMemo } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const Budget = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [budget, setBudget] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<string>('spending');
  const [purchases, setPurchases] = useState<(Purchase & { gifts: { name: string; occasions?: { occasion_type?: string } }, category?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'category' | 'occasion'>('category');
  
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
  const chartData = useMemo(() => {
    if (groupBy === 'category') {
      const spendingCategories = purchases.reduce((acc, purchase) => {
        const category = purchase.category || 'Other';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += purchase.price;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(spendingCategories).map(([category, amount]) => ({ category, amount }));
    } else {
      const spendingOccasions = purchases.reduce((acc, purchase) => {
        const occasionType = purchase.gifts?.occasions?.occasion_type || 'Other';
        if (!acc[occasionType]) {
          acc[occasionType] = 0;
        }
        acc[occasionType] += purchase.price;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(spendingOccasions).map(([category, amount]) => ({ category, amount }));
    }
  }, [purchases, groupBy]);

  // Get recent purchases (last 5)
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .slice(0, 5);

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mt-0 mb-4">Budget & Spending</h1>
      {/* Tabs for switching between spending and budget */}
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading budget data...</div>
      ) : error ? (
        <div className="text-red-500 p-4">Error: {error}</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="spending">Spending</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>
          {/* Spending tab content - shows spending chart, spending overview, and recent purchases */}
          <TabsContent value="spending" className="space-y-6 mt-4">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Spending by:</CardTitle>
                <div className="flex gap-2 ml-4">
                  <button
                    className={`px-4 py-1 rounded-md border text-base font-medium transition-colors ${groupBy === 'category' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-muted'}`}
                    onClick={() => setGroupBy('category')}
                    type="button"
                  >
                    Gifts
                  </button>
                  <button
                    className={`px-4 py-1 rounded-md border text-base font-medium transition-colors ${groupBy === 'occasion' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-muted'}`}
                    onClick={() => setGroupBy('occasion')}
                    type="button"
                  >
                    Occasion
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <SpendingChart data={chartData} />
              </CardContent>
            </Card>
            <RecentPurchases purchases={recentPurchases} />
          </TabsContent>
          {/* Budget tab content - shows budget tracker only */}
          <TabsContent value="budget" className="mt-4 space-y-6">
            <BudgetForm currentBudget={budget} onSave={handleSaveBudget} />
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Annual Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg">Yearly Budget</span>
                    <span className="font-semibold text-primary text-lg">${budget.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 mb-2">
                    <div
                      className="bg-primary h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{percentUsed.toFixed(0)}% used</span>
                    <span className="text-gray-600">${totalSpent.toFixed(2)} spent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  );
};

export default Budget;
