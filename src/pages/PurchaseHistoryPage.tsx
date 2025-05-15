
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PurchaseHistory } from '@/components/history/PurchaseHistory';
import { mockPurchaseData } from '@/lib/mockData';

const PurchaseHistoryPage = () => {
  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        <h2 className="text-lg font-medium">Gift Purchase History</h2>
        <PurchaseHistory purchases={mockPurchaseData} />
      </div>
    </PageLayout>
  );
};

export default PurchaseHistoryPage;
