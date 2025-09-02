import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PropostasSidebar } from './PropostasSidebar';
import { PropostasHeader } from './PropostasHeader';

// Propostas Module Pages
import Propostas from "@/modules/propostas/pages/Propostas";

export default function PropostasLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PropostasSidebar />
        <div className="flex-1 flex flex-col">
          <PropostasHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route index element={<Propostas />} />
              <Route path="/lista" element={<Propostas />} />
              <Route path="/nova" element={<div className="p-6">Nova Proposta - Em desenvolvimento</div>} />
              <Route path="/templates" element={<div className="p-6">Templates - Em desenvolvimento</div>} />
              <Route path="/configuracoes" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}