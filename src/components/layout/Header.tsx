
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const location = useLocation();
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
        if (location.pathname.startsWith('/contact/')) {
          return 'Contact Details';
        }
        return 'GiftWise';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gift-text">{getTitle()}</h1>
        </div>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} />
        </Button>
      </div>
    </header>
  );
};
