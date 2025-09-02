import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AuthPage from "@/pages/Auth";
import SetPasswordPage from "@/pages/SetPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import { WhatsAppRoutes } from "@/modules/whatsapp/routes";
import { CRMRoutes } from "@/modules/crm/routes";
import { PropostasRoutes } from "@/modules/propostas/routes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* WhatsApp Module Routes (includes full-screen conversations) */}
        <WhatsAppRoutes />
        
        {/* Protected layout-wrapped routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* CRM Module Routes */}
          <CRMRoutes />
          
          {/* System Routes */}
          <Route path="/templates" element={<div className="p-6">Templates - Em desenvolvimento</div>} />
          <Route path="/configuracoes" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
          <Route path="/logs" element={<div className="p-6">Logs - Em desenvolvimento</div>} />
          
          {/* Propostas Module Routes */}
          <PropostasRoutes />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
