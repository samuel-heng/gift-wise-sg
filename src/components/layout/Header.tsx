// Import React and routing hooks
import React from 'react';
import { useLocation } from 'react-router-dom';
// Import icon component
import { Bell } from 'lucide-react';
// Import UI button component
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    // Header with fixed positioning and styling
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Always show the app name */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-primary">GiftWise</h1>
        </div>
        {/* Notification bell button */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} />
        </Button>
      </div>
    </header>
  );
};
