import React, { Suspense } from 'react';
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
import ClientPortal from "@/pages/client/ClientPortal";
const PremiumProposal = React.lazy(() => import("@/pages/PremiumProposal"));
import { useStorageCleanup } from "@/hooks/useStorageCleanup";

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
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ClientProtectedRoute } from "@/components/auth/ClientProtectedRoute";

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
  // 🚨 CORREÇÃO: Desabilitar persistência temporariamente para isolar erros de JSON
  // persistQuery: false,
});

function AppContent() {
  // Hook para limpeza automática de storage corrompido
  useStorageCleanup();
  
  return (
    <div className="relative">
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth" element={<Index />} /> {/* Fallback para links de auth */}
        <Route path="/proposta/:id" element={<PublicProposal />} /> {/* Página pública de proposta */}
        <Route path="/proposta-premium/:id" element={
          <Suspense fallback={<div>Carregando...</div>}>
            <PremiumProposal />
          </Suspense>
        } /> {/* Página premium HTML para shingle */}
        
        {/* Client Portal */}
        <Route path="/cliente" element={
          <ClientProtectedRoute>
            <ClientPortal />
          </ClientProtectedRoute>
        } />
        
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
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClientAuthProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </ClientAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
