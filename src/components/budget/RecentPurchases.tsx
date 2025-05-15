
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Purchase {
  id: string;
  contactName: string;
  occasionName: string;
  date: string;
  item: string;
  amount: number;
}

interface RecentPurchasesProps {
  purchases: Purchase[];
  currency?: string;
}

export const RecentPurchases: React.FC<RecentPurchasesProps> = ({ 
  purchases,
  currency = '$'
}) => {
  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">No recent purchases</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">Recent Purchases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="flex items-start justify-between pb-3 border-b last:border-0 last:pb-0">
              <div>
                <p className="font-medium">{purchase.item}</p>
                <p className="text-sm text-muted-foreground">For: {purchase.contactName}</p>
                <p className="text-xs text-muted-foreground">{purchase.occasionName} • {purchase.date}</p>
              </div>
              <Badge variant="outline" className="text-sm font-medium">
                {currency}{purchase.amount.toFixed(2)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
