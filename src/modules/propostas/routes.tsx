import { Routes, Route } from "react-router-dom";

export function PropostasRoutes() {
  return (
    <Routes>
      <Route path="/propostas" element={
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Portal de Propostas
          </h1>
          <p className="text-muted-foreground">
            Em desenvolvimento - Aguardando integração do módulo externo
          </p>
        </div>
      } />
    </Routes>
  );
}