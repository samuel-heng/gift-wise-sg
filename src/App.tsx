// Import UI components for notifications and tooltips
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Import React Query for data fetching management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Import routing components from react-router-dom
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
// Import page components
import { Home } from "./pages/Home";
import Budget from "./pages/Budget";
import { History } from "./pages/History";
import { Contacts } from "./pages/Contacts";
import { PageLayout } from "./components/layout/PageLayout";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import AuthPage from "./pages/Auth";
import { supabase } from "@/lib/supabase";
import ResetPasswordPage from "./pages/ResetPassword";

// Initialize React Query client for data fetching
const queryClient = new QueryClient();

// RequireAuth wrapper to protect routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
}

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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <Routes>
                    <Route path="/" element={<Home />} />
        <Route path="/budget" element={<Budget />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/contacts" element={<Contacts />} />
        <Route path="*" element={<NotFound />} />
                  </Routes>
                </RequireAuth>
              }
            />
      </Routes>
        </PageLayout>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
