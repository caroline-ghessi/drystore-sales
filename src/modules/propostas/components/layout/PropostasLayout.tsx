import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DryStoreSidebar } from './DryStoreSidebar';
import { DryStoreHeader } from './DryStoreHeader';

// DryStore Pages
import DryStoreDashboard from "@/modules/propostas/pages/DryStoreDashboard";
import Propostas from "@/modules/propostas/pages/Propostas";
import ClientsPage from "@/modules/propostas/pages/ClientsPage";
import ProposalsListPage from "@/modules/propostas/pages/ProposalsListPage";
import RankingPage from "@/modules/propostas/pages/RankingPage";
import ProductsPage from "@/modules/propostas/pages/ProductsPage";

export default function PropostasLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-drystore-light-gray">
        <DryStoreSidebar />
        <div className="flex-1 flex flex-col">
          <DryStoreHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route index element={<DryStoreDashboard />} />
              <Route path="/lista" element={<ProposalsListPage />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/nova" element={<Propostas />} />
              <Route path="/templates" element={<div className="p-6 bg-drystore-light-gray min-h-full"><div className="text-center py-20 text-drystore-medium-gray">Templates - Em desenvolvimento</div></div>} />
              <Route path="/configuracoes" element={<div className="p-6 bg-drystore-light-gray min-h-full"><div className="text-center py-20 text-drystore-medium-gray">Configurações - Em desenvolvimento</div></div>} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/notificacoes" element={<div className="p-6 bg-drystore-light-gray min-h-full"><div className="text-center py-20 text-drystore-medium-gray">Notificações - Em desenvolvimento</div></div>} />
              <Route path="/administracao" element={<div className="p-6 bg-drystore-light-gray min-h-full"><div className="text-center py-20 text-drystore-medium-gray">Administração - Em desenvolvimento</div></div>} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}