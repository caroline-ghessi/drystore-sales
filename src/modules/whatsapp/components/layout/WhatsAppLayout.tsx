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

import ExcludedContactsPage from "@/modules/whatsapp/pages/ExcludedContactsPage";

export default function WhatsAppLayout() {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <WhatsAppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <WhatsAppHeader />
          <main className="flex-1 overflow-y-auto min-h-0">
            <Routes>
              <Route index element={<WhatsAppDashboard />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="bot" element={<BotPage />} />
              <Route path="vendedores" element={<VendedoresPage />} />
              <Route path="vendedores/contatos-excluidos" element={<ExcludedContactsPage />} />
              <Route path="atendentes" element={<AtendentesPage />} />
              <Route path="analytics" element={<Analytics />} />
              
              <Route path="templates" element={<div className="p-6"><h1 className="text-2xl font-semibold">Templates</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>} />
              <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-semibold">Configurações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>} />
              <Route path="logs" element={<div className="p-6"><h1 className="text-2xl font-semibold">Logs</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}