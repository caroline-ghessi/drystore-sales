import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "@/pages/Index";
import SetPasswordPage from "@/pages/SetPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import HomePage from "@/pages/Home";
import PublicProposal from "@/pages/PublicProposal";

// Module Layouts
import CRMLayout from "@/modules/crm/components/layout/CRMLayout";
import PropostasLayout from "@/modules/propostas/components/layout/PropostasLayout";
import WhatsAppLayout from "@/modules/whatsapp/components/layout/WhatsAppLayout";
import { Layout } from "@/components/layout/Layout";

// WhatsApp Module Pages
import WhatsAppDashboard from "@/modules/whatsapp/pages/Dashboard";
import { ConversationsPage } from "@/modules/whatsapp/pages/Conversations";
import BotPage from "@/modules/whatsapp/pages/Bot";
import AtendentesPage from "@/modules/whatsapp/pages/Atendentes";
import { VendedoresPage } from "@/modules/whatsapp/pages/Vendedores";
import Analytics from "@/modules/whatsapp/pages/Analytics";
import LeadsQuentes from "@/modules/whatsapp/pages/LeadsQuentes";

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
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth" element={<Index />} /> {/* Fallback para links de auth */}
        <Route path="/proposta/:id" element={<PublicProposal />} /> {/* Página pública de proposta */}
        
        {/* Protected main home for module selection */}
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        
        {/* WhatsApp Conversations - Using Main Layout (Dark Sidebar) */}
        <Route path="/conversas" element={
          <ProtectedRoute>
            <Layout>
              <ConversationsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* WhatsApp Module Routes */}
        <Route path="/whatsapp/*" element={
          <ProtectedRoute>
            <WhatsAppLayout />
          </ProtectedRoute>
        } />
        
        {/* CRM Module Routes */}
        <Route path="/crm/*" element={
          <ProtectedRoute>
            <CRMLayout />
          </ProtectedRoute>
        } />
        
        {/* Propostas Module Routes */}
        <Route path="/propostas/*" element={
          <ProtectedRoute>
            <PropostasLayout />
          </ProtectedRoute>
        } />
        
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
