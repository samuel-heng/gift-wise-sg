import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Purchase } from '../../lib/supabase';

interface RecentPurchasesProps {
  purchases: (Purchase & { gifts: { name: string } })[];
}

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent purchases</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Purchases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{purchase.gifts.name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(purchase.purchase_date), 'MMM d, yyyy')}
                </div>
              </div>
              <span className="bg-white border border-gray-300 rounded-full px-4 py-1 font-semibold text-base text-gray-900">${purchase.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
