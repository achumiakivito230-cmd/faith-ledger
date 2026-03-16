import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ChurchSetupPage from "./pages/ChurchSetup";
import DashboardPage from "./pages/Dashboard";
import NewOfferingPage from "./pages/NewOffering";
import HistoryPage from "./pages/History";
import VerifyPage from "./pages/Verify";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/church-setup" element={<ChurchSetupPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/new-offering" element={<NewOfferingPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
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
}

export default App;
