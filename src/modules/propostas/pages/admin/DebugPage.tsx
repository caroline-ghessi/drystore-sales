import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  HardDrive, 
  Activity, 
  FileText, 
  Trash2, 
  Download,
  RefreshCw,
  Shield,
  Info
} from 'lucide-react';
import { SafeStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface SystemInfo {
  appVersion: string;
  environment: string;
  buildTime: string;
  userAgent: string;
  viewport: string;
  localStorage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export default function DebugPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserPermissions();

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = () => {
    const getStorageSize = () => {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    };

    const used = getStorageSize();
    const total = 5 * 1024 * 1024; // 5MB typical limit
    
    setSystemInfo({
      appVersion: '1.0.0',
      environment: import.meta.env.DEV ? 'Desenvolvimento' : 'Produção',
      buildTime: new Date().toLocaleDateString('pt-BR'),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      localStorage: {
        used,
        total,
        percentage: Math.round((used / total) * 100)
      }
    });
  };

  const handleDiagnose = async () => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      toast({
        title: "❌ Erro no Diagnóstico",
        description: "Falha ao executar diagnóstico do storage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanCorrupted = () => {
    const cleaned = SafeStorage.cleanCorruptedData();
    
    toast({
      title: cleaned ? "🧹 Limpeza Concluída" : "ℹ️ Nada para Limpar",
      description: cleaned 
        ? "Itens corrompidos foram removidos." 
        : "Nenhum item corrompido encontrado.",
    });
    
    // Atualizar diagnóstico
    handleDiagnose();
  };

  const handleEmergencyCleanup = () => {
    const success = SafeStorage.emergencyCleanup();
    
    if (success) {
      toast({
        title: "🆘 Reset Completo Executado",
        description: "Storage limpo completamente. Recarregando página...",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast({
        title: "❌ Erro no Reset",
        description: "Não foi possível executar reset completo.",
        variant: "destructive",
      });
    }
  };

  const handleExportDebugData = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      diagnosticResult,
      storageKeys: Object.keys(localStorage),
      storageSize: systemInfo?.localStorage
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "📁 Dados Exportados",
      description: "Arquivo de debug baixado com sucesso.",
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar as ferramentas de debug.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-drystore-dark-gray mb-2 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          Debug e Resolução de Problemas
        </h2>
        <p className="text-drystore-medium-gray">
          Ferramentas administrativas para diagnóstico e correção de problemas do sistema.
        </p>
      </div>

      {/* Storage Local */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Diagnóstico do Storage Local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleDiagnose}
              disabled={isLoading}
              className="flex-1"
            >
              <Activity className="h-4 w-4 mr-2" />
              {isLoading ? 'Diagnosticando...' : 'Executar Diagnóstico'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCleanCorrupted}
              disabled={diagnosticResult.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Corrompidos
            </Button>
          </div>

          {diagnosticResult.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">
                  {diagnosticResult.length} itens corrompidos encontrados:
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                {diagnosticResult.map((key, idx) => (
                  <div key={idx} className="text-muted-foreground font-mono">
                    • {key}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemInfo && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Versão:</span>
                  <Badge variant="outline">{systemInfo.appVersion}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Ambiente:</span>
                  <Badge variant={systemInfo.environment === 'Desenvolvimento' ? 'secondary' : 'default'}>
                    {systemInfo.environment}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Viewport:</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {systemInfo.viewport}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Storage Usado:</span>
                  <span className="text-sm font-mono">
                    {Math.round(systemInfo.localStorage.used / 1024)} KB ({systemInfo.localStorage.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      systemInfo.localStorage.percentage > 80 
                        ? 'bg-red-500' 
                        : systemInfo.localStorage.percentage > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(systemInfo.localStorage.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ferramentas Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ferramentas Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleExportDebugData}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados de Debug
            </Button>
            
            <Button
              variant="outline"
              onClick={loadSystemInfo}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Informações
            </Button>
          </div>

          <Separator />

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Zona de Perigo
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Esta ação irá remover TODOS os dados do storage local e recarregar a página. 
              Use apenas em casos extremos.
            </p>
            <Button
              variant="destructive"
              onClick={handleEmergencyCleanup}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              🆘 Reset Completo do Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guia de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar Estas Ferramentas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-blue-600">Diagnóstico do Storage:</strong>
              <p className="text-muted-foreground">
                Verifica a integridade dos dados armazenados localmente. Identifica itens corrompidos 
                que podem causar erros no sistema.
              </p>
            </div>
            <div>
              <strong className="text-green-600">Limpeza Seletiva:</strong>
              <p className="text-muted-foreground">
                Remove apenas os itens identificados como corrompidos, preservando dados válidos.
              </p>
            </div>
            <div>
              <strong className="text-orange-600">Export de Debug:</strong>
              <p className="text-muted-foreground">
                Gera um arquivo JSON com informações técnicas úteis para suporte e análise detalhada.
              </p>
            </div>
            <div>
              <strong className="text-red-600">Reset Completo:</strong>
              <p className="text-muted-foreground">
                ⚠️ Remove TODOS os dados locais. Use apenas quando outras soluções falharem.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}