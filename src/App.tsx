import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DateFilterProvider } from "@/hooks/useDateFilter";
import ChurchSetupPage from "./pages/ChurchSetup";
import DashboardPage from "./pages/Dashboard";
import NewOfferingPage from "./pages/NewOffering";
import HistoryPage from "./pages/History";
import VerifyPage from "./pages/Verify";
import AnalyticsPage from "./pages/Analytics";
import NewExpensePage from "./pages/NewExpense";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


function AppRoutes() {
  const { user, loading } = useAuth();

  // If logged in and on login page, redirect to dashboard
  if (!loading && user) {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/church-setup" element={<ProtectedRoute><ChurchSetupPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/new-offering" element={<ProtectedRoute><NewOfferingPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/verify" element={<ProtectedRoute><VerifyPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/new-expense" element={<ProtectedRoute><NewExpensePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // If not logged in, show login/signup pages
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
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
            <DateFilterProvider>
              <AppRoutes />
            </DateFilterProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
