import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CRMSidebar } from './CRMSidebar';
import { CRMHeader } from './CRMHeader';

// CRM Module Pages
import Dashboard from "@/modules/crm/pages/Dashboard";
import LeadsQuentes from "@/modules/crm/pages/LeadsQuentes";
import Pipeline from "@/modules/crm/pages/Pipeline";
import Customers from "@/modules/crm/pages/Customers";
import Reports from "@/modules/crm/pages/Reports";
import Tasks from "@/modules/crm/pages/Tasks";
import Agenda from "@/modules/crm/pages/Agenda";
import Settings from "@/modules/crm/pages/Settings";
import Opportunities from "@/modules/crm/pages/Opportunities";
import NegotiationDetail from "@/modules/crm/pages/NegotiationDetail";

export default function CRMLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CRMSidebar />
        <div className="flex-1 flex flex-col">
          <CRMHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads-quentes" element={<LeadsQuentes />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/opportunities/:id" element={<NegotiationDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}