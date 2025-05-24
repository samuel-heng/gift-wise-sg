// Import React and routing components
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Import icon components for navigation items
import { Calendar, Home, List, User } from 'lucide-react';
// Import utility for class name merging
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  // Get current location to highlight the active navigation item
  const location = useLocation();
  const currentPath = location.pathname;

  // Define navigation items with their names, paths, and icons
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Budget', path: '/budget', icon: Calendar },
    { name: 'History', path: '/history', icon: List },
    { name: 'Contacts', path: '/contacts', icon: User },
  ];

  return (
    // Navigation bar fixed at the bottom of the screen
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around px-2 py-2">
        {/* Map through each navigation item to create the bottom navigation bar */}
        {navItems.map((item) => {
          // Determine if this item is active based on the current path
          const isActive = currentPath === item.path;
          return (
            // Create a link for each navigation item
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                // Apply different styles for active vs inactive items
                isActive 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-secondary"
              )}
              aria-label={item.name}
            >
              {/* Display the icon for this navigation item */}
              <item.icon size={24} className="mb-1" />
              {/* Display the name of this navigation item */}
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
