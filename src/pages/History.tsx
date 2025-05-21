import { useEffect, useState } from 'react';
import { purchaseService, userProfileService } from '../lib/db';
import type { Purchase, UserProfile } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format } from 'date-fns';

export function History() {
  const [purchases, setPurchases] = useState<(Purchase & { gifts: { name: string } })[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPurchases() {
      try {
        const profile = await userProfileService.getDefaultProfile();
        setUserProfile(profile);
        const data = await purchaseService.getAll(profile.id);
        setPurchases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load purchase history');
      } finally {
        setLoading(false);
      }
    }

    loadPurchases();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading purchase history...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Purchase History</h1>

      <div className="space-y-4">
        {purchases.map((purchase) => (
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
      </div>
    </div>
  );
} 