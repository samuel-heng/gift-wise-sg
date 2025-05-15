
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Home, List, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Budget', path: '/budget', icon: Calendar },
    { name: 'History', path: '/history', icon: List },
    { name: 'Contacts', path: '/contacts', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive 
                  ? "text-gift-purple" 
                  : "text-gray-500 hover:text-gift-purple-dark"
              )}
              aria-label={item.name}
            >
              <item.icon size={24} className="mb-1" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
