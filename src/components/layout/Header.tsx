// Import React and routing hooks
import React from 'react';
import { useLocation } from 'react-router-dom';
// Import icon component
import { Bell } from 'lucide-react';
// Import UI button component
import { Button } from '@/components/ui/button';

export const Header = () => {
  // Get current location to determine which page we're on
  const location = useLocation();
  
  // Dynamically set the page title based on the current route
  const getTitle = () => {
    switch(location.pathname) {
      case '/':
        return 'GiftWise';
      case '/budget':
        return 'Budget & Spending';
      case '/history':
        return 'Purchase History';
      case '/contacts':
        return 'Contacts';
      default:
        // Special case for contact detail pages that have dynamic IDs
        if (location.pathname.startsWith('/contact/')) {
          return 'Contact Details';
        }
        // Default fallback title
        return 'GiftWise';
    }
  };

  return (
    // Header with fixed positioning and styling
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Page title that changes based on current route */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gift-text">{getTitle()}</h1>
        </div>
        {/* Notification bell button */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} />
        </Button>
      </div>
    </header>
  );
};
