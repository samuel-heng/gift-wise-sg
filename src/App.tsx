// Import UI components for notifications and tooltips
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Import React Query for data fetching management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Import routing components from react-router-dom
import { Routes, Route } from "react-router-dom";
// Import page components
import { Home } from "./pages/Home";
import Budget from "./pages/Budget";
import { History } from "./pages/History";
import { Contacts } from "./pages/Contacts";
import { PageLayout } from "./components/layout/PageLayout";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

// Initialize React Query client for data fetching
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflowY = "scroll";
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  // Provide React Query context to the entire app
  return (
  <QueryClientProvider client={queryClient}>
      {/* TooltipProvider enables tooltips throughout the app */}
    <TooltipProvider>
        {/* Toaster components for displaying notifications */}
      <Toaster />
      <Sonner />
        <PageLayout>
      <Routes>
            <Route path="/" element={<Home />} />
        <Route path="/budget" element={<Budget />} />
            <Route path="/history" element={<History />} />
            <Route path="/contacts" element={<Contacts />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
        </PageLayout>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
