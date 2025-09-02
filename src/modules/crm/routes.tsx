import { Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import LeadsQuentes from "@/pages/LeadsQuentes";
import BotPage from "@/pages/Bot";
import { VendedoresPage } from "@/pages/Vendedores";
import AtendentesPage from "@/pages/Atendentes";
import Analytics from "@/pages/Analytics";

export function CRMRoutes() {
  return (
    <>
      <Route index element={<Dashboard />} />
      <Route path="/leads-quentes" element={<LeadsQuentes />} />
      
      {/* WhatsApp Module Routes (layout-wrapped) */}
      <Route path="/bot" element={<BotPage />} />
      <Route path="/vendedores" element={<VendedoresPage />} />
      <Route path="/atendentes" element={<AtendentesPage />} />
      <Route path="/analytics" element={<Analytics />} />
    </>
  );
}