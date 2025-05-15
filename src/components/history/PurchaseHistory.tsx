
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Purchase {
  id: string;
  contactName: string;
  contactId: string;
  occasionName: string;
  date: string;
  item: string;
  amount: number;
}

interface PurchaseHistoryProps {
  purchases: Purchase[];
  filterContactId?: string;
  currency?: string;
}

export const PurchaseHistory: React.FC<PurchaseHistoryProps> = ({
  purchases,
  filterContactId,
  currency = '$'
}) => {
  // Filter purchases if contactId is provided
  const filteredPurchases = filterContactId 
    ? purchases.filter(p => p.contactId === filterContactId)
    : purchases;

  // Group purchases by year
  const purchasesByYear = filteredPurchases.reduce((acc, purchase) => {
    const year = new Date(purchase.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(purchase);
    return acc;
  }, {} as Record<number, Purchase[]>);

  // Sort years in descending order
  const sortedYears = Object.keys(purchasesByYear)
    .map(Number)
    .sort((a, b) => b - a);

  if (filteredPurchases.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No purchase history found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {sortedYears.map(year => (
        <div key={year} className="space-y-4">
          <h3 className="text-lg font-medium">{year}</h3>
          
          <div className="space-y-4">
            {purchasesByYear[year].map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{purchase.item}</p>
                      {!filterContactId && (
                        <p className="text-sm text-muted-foreground">For: {purchase.contactName}</p>
                      )}
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-muted-foreground">{purchase.occasionName}</p>
                        <span className="mx-1 text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(purchase.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm font-medium">
                      {currency}{purchase.amount.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
