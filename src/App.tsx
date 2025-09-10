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

// Module Layouts
import CRMLayout from "@/modules/crm/components/layout/CRMLayout";
import PropostasLayout from "@/modules/propostas/components/layout/PropostasLayout";
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
        
        {/* Protected main home for module selection */}
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        
        {/* WhatsApp Conversations - Special Layout (Full Screen) */}
        <Route path="/conversas" element={
          <ProtectedRoute>
            <ConversationsPage />
          </ProtectedRoute>
        } />
        
        {/* WhatsApp Module Routes - General Layout */}
        <Route path="/whatsapp" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<WhatsAppDashboard />} />
        </Route>
        
        <Route path="/whatsapp/bot" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<BotPage />} />
        </Route>
        
        <Route path="/whatsapp/vendedores" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<VendedoresPage />} />
        </Route>
        
        <Route path="/whatsapp/atendentes" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AtendentesPage />} />
        </Route>
        
        <Route path="/whatsapp/analytics" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Analytics />} />
        </Route>
        
        <Route path="/whatsapp/leads-quentes" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<LeadsQuentes />} />
        </Route>
        
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
