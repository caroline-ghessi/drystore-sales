import { Routes, Route } from "react-router-dom";
import { ConversationsPage } from "@/pages/Conversations";
import BotPage from "@/pages/Bot";
import { VendedoresPage } from "@/pages/Vendedores";
import AtendentesPage from "@/pages/Atendentes";

export function WhatsAppRoutes() {
  return (
    <Routes>
      <Route path="/conversas" element={
        <div className="h-screen">
          <ConversationsPage />
        </div>
      } />
      <Route path="/bot" element={<BotPage />} />
      <Route path="/vendedores" element={<VendedoresPage />} />
      <Route path="/atendentes" element={<AtendentesPage />} />
    </Routes>
  );
}