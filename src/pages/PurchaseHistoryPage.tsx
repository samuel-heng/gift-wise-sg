// Import React for component creation
import React from 'react';
// Import page layout component for consistent structure
import { PageLayout } from '@/components/layout/PageLayout';
// Import the purchase history component
import { PurchaseHistory } from '@/components/history/PurchaseHistory';
// Import mock data for demonstration
import { mockPurchaseData } from '@/lib/mockData';

const PurchaseHistoryPage = () => {
  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        {/* Page title */}
        <h2 className="text-lg font-medium">Gift Purchase History</h2>
        {/* PurchaseHistory component displays a list of all past purchases */}
        <PurchaseHistory purchases={mockPurchaseData} />
      </div>
    </PageLayout>
  );
};

export default PurchaseHistoryPage;
