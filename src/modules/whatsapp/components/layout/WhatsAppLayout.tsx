import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { WhatsAppSidebar } from './WhatsAppSidebar';
import { WhatsAppHeader } from './WhatsAppHeader';

// WhatsApp Module Pages
import Analytics from "@/modules/whatsapp/pages/Analytics";
import BotPage from "@/modules/whatsapp/pages/Bot";
import AtendentesPage from "@/modules/whatsapp/pages/Atendentes";
import { VendedoresPage } from "@/modules/whatsapp/pages/Vendedores";
import { ConversationsPage } from "@/modules/whatsapp/pages/Conversations";
import WhatsAppDashboard from "@/modules/whatsapp/pages/Dashboard";

export default function WhatsAppLayout() {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <WhatsAppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <WhatsAppHeader />
          <main className="flex-1 overflow-hidden min-h-0">
            <Routes>
              <Route index element={<WhatsAppDashboard />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="bot" element={<BotPage />} />
              <Route path="vendedores" element={<VendedoresPage />} />
              <Route path="atendentes" element={<AtendentesPage />} />
              <Route path="analytics" element={<Analytics />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}