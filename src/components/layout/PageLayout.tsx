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
      <div className="mt-8 text-xs text-gray-500 border-t border-gray-200 pt-4 text-center max-w-screen-md mx-auto w-full">
        <strong>Disclaimer:</strong> This website is created for learning purposes only. The information provided here should not be considered professional advice. Please note that we make no guarantees regarding the accuracy, completeness, or reliability of the contents of this website. Any actions you take based on the contents of this website are at your own risk. We are not liable for any losses or damages incurred from the use of this website.
      </div>
      {/* BottomNav is fixed at the bottom of the screen */}
      <BottomNav />
    </div>
  );
};
