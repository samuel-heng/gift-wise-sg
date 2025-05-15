
import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gift-bg">
      <Header />
      <main className="flex-1 pt-16 pb-20 px-4 max-w-screen-md mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
