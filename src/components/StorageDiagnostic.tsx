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

  // Só mostrar em desenvolvimento ou quando há erros
  const shouldShow = import.meta.env.DEV || isVisible;

  return (
    <>
      {/* Botão flutuante para ativar diagnóstico */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="bg-background border-border"
        >
          🔧 Debug Storage
        </Button>
      </div>

      {/* Painel de diagnóstico */}
      {shouldShow && isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-80">
          <Card className="bg-background border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Diagnóstico do Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="secondary" 
                  size="sm"
                  onClick={handleDiagnose}
                  className="flex-1"
                >
                  🔍 Diagnosticar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEmergencyCleanup}
                  className="flex-1"
                >
                  🆘 Limpar Tudo
                </Button>
              </div>
              
              {diagnosticResult.length > 0 && (
                <div className="text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                  <div className="font-medium text-destructive mb-1">
                    Itens Corrompidos:
                  </div>
                  {diagnosticResult.map((key, idx) => (
                    <div key={idx} className="text-muted-foreground">
                      • {key}
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}