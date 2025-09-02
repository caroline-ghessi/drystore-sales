import { Route } from "react-router-dom";
import { ConversationsPage } from "@/pages/Conversations";
import BotPage from "@/pages/Bot";
import { VendedoresPage } from "@/pages/Vendedores";
import AtendentesPage from "@/pages/Atendentes";
import Analytics from "@/pages/Analytics";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export function WhatsAppRoutes() {
  return (
    <>
      {/* Full-screen WhatsApp conversation route */}
      <Route 
        path="/conversas" 
        element={
          <ProtectedRoute>
            <div className="h-screen">
              <ConversationsPage />
            </div>
          </ProtectedRoute>
        } 
      />
    </>
  );
}