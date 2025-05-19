// Import UI components for notifications and tooltips
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Import React Query for data fetching management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Import routing components from react-router-dom
import { Routes, Route } from "react-router-dom";
// Import page components
import Index from "./pages/Index";
import Budget from "./pages/Budget";
import PurchaseHistoryPage from "./pages/PurchaseHistoryPage";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import NotFound from "./pages/NotFound";

// Initialize React Query client for data fetching
const queryClient = new QueryClient();

const App = () => (
  // Provide React Query context to the entire app
  <QueryClientProvider client={queryClient}>
    {/* TooltipProvider enables tooltips throughout the app */}
    <TooltipProvider>
      {/* Toaster components for displaying notifications */}
      <Toaster />
      <Sonner />
      {/* Define routes for the application */}
      <Routes>
        {/* Home page route */}
        <Route path="/" element={<Index />} />
        {/* Budget page route */}
        <Route path="/budget" element={<Budget />} />
        {/* Purchase history page route */}
        <Route path="/history" element={<PurchaseHistoryPage />} />
        {/* Contacts list page route */}
        <Route path="/contacts" element={<ContactsPage />} />
        {/* Individual contact detail page with dynamic ID parameter */}
        <Route path="/contact/:id" element={<ContactDetailPage />} />
        {/* Fallback route for 404 Not Found errors */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
