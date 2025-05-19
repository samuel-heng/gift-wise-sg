import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { UpcomingOccasions } from '@/components/home/UpcomingOccasions';
import { GiftSuggestions } from '@/components/home/GiftSuggestions';
import { SpendingOverview } from '@/components/home/SpendingOverview';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockOccasions, mockGiftSuggestions } from '@/lib/mockData';

const Index = () => {
  const navigate = useNavigate();
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | null>(
    mockOccasions.length > 0 ? mockOccasions[0].id : null
  );

  const selectedOccasion = mockOccasions.find(o => o.id === selectedOccasionId);
  
  const occasionSuggestions = selectedOccasion 
    ? mockGiftSuggestions.filter(g => g.occasionId === selectedOccasionId)
    : [];

  const handleSelectOccasion = (occasionId: string) => {
    setSelectedOccasionId(occasionId);
  };

  const handleSelectGift = (giftId: string) => {
    console.log(`Selected gift: ${giftId}`);
  };
  
  return (
    <PageLayout>
      <div className="space-y-6 py-4">
        <SpendingOverview spent={240} budget={500} />
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Upcoming Occasions</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/contacts/add')}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        <UpcomingOccasions 
          occasions={mockOccasions}
          onSelectOccasion={handleSelectOccasion}
        />
        
        {selectedOccasion && (
          <div className="mt-8">
            <GiftSuggestions 
              occasionId={selectedOccasion.id}
              contactName={selectedOccasion.contactName}
              occasionName={selectedOccasion.occasionType}
              suggestions={occasionSuggestions}
              onSelectGift={handleSelectGift}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Index;
