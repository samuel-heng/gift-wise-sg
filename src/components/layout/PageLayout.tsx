// Import React and layout components
import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

// Define props interface for the PageLayout component
interface PageLayoutProps {
  children: React.ReactNode;
}

// PageLayout component provides consistent structure for all pages
// It includes the Header at the top, main content area, and BottomNav at the bottom
export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gift-bg">
      {/* Header is fixed at the top of the screen */}
      <Header />
      {/* Main content area with appropriate padding to avoid overlap with fixed header/nav */}
      <main className="flex-1 pt-12 pb-20 px-4 max-w-screen-md mx-auto w-full">
        {children}
      </main>
      {/* BottomNav is fixed at the bottom of the screen */}
      <BottomNav />
    </div>
  );
};
