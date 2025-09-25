import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export function StorageDiagnostic() {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string[]>([]);
  const { toast } = useToast();

  const handleDiagnose = () => {
    const issues = SafeStorage.diagnoseStorage();
    setDiagnosticResult(issues);
    
    if (issues.length === 0) {
      toast({
        title: "✅ Storage Íntegro",
        description: "Nenhum problema encontrado no armazenamento local.",
      });
    } else {
      toast({
        title: "🚨 Problemas Encontrados",
        description: `${issues.length} itens corrompidos detectados.`,
        variant: "destructive",
      });
    }
  };

  const handleEmergencyCleanup = () => {
    const success = SafeStorage.emergencyCleanup();
    
    if (success) {
      toast({
        title: "🆘 Limpeza de Emergência Concluída",
        description: "Storage limpo completamente. Recarregando página...",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast({
        title: "❌ Erro na Limpeza",
        description: "Não foi possível limpar o storage completamente.",
        variant: "destructive",
      });
    }
  };

  // Não renderizar mais o botão flutuante
  // As funcionalidades foram movidas para a página administrativa
  return null;
}