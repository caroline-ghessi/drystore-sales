import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import LeadsQuentes from "@/pages/LeadsQuentes";
import Analytics from "@/pages/Analytics";

export function CRMRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/leads-quentes" element={<LeadsQuentes />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}