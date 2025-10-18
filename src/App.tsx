import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { initAnalytics } from "./lib/analytics";
import { usePageTracking } from "./hooks/useAnalytics";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Insights from "./pages/Insights";
import Automation from "./pages/Automation";
import Team from "./pages/Team";
import MessageView from "./pages/MessageView";
import Onboarding from "./pages/Onboarding";
import Beta from "./pages/Beta";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize analytics on app load
initAnalytics();

function AppRoutes() {
  usePageTracking();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/automation" element={<Automation />} />
      <Route path="/team" element={<Team />} />
      <Route path="/messages" element={<MessageView />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/beta" element={<Beta />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
