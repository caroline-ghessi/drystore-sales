import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Settings, TestTube, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VendorConfigurationGuide } from '@/components/vendor-monitoring/VendorConfigurationGuide';

interface VendorStatus {
  vendor_id: string;
  vendor_name: string;
  phone_number: string;
  whapi_channel_id: string;
  token_status: string;
  webhook_status: string;
  last_message?: {
    timestamp: string;
    content: string;
    from_me: boolean;
  };
}

interface TestSummary {
  total_vendors: number;
  with_tokens: number;
  api_connected: number;
  with_recent_messages: number;
}

export function VendorWebhookManager() {
  const [vendors, setVendors] = useState<VendorStatus[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-vendor-webhooks', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        setVendors(data.results);
        setSummary(data.summary);
        toast.success('Diagnóstico concluído com sucesso');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast.error('Erro ao executar diagnóstico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const configureWebhook = async (vendorId: string, action: 'configure' | 'test' | 'status') => {
    setActionLoading(vendorId + '_' + action);
    try {
      const { data, error } = await supabase.functions.invoke('configure-vendor-webhooks', {
        body: { vendor_id: vendorId, action }
      });

      if (error) throw error;

      if (data.success) {
        if (action === 'configure') {
          toast.success('Webhook configurado com sucesso');
        } else if (action === 'test') {
          toast.success('Mensagem de teste enviada');
        }
        // Refresh diagnostics after action
        await runDiagnostics();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(`Error ${action} webhook:`, error);
      toast.error(`Erro ao ${action === 'configure' ? 'configurar' : action === 'test' ? 'testar' : 'verificar'} webhook: ` + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'configured' || status === 'api_connected') return 'success';
    if (status === 'missing' || status.includes('error') || status.includes('failed')) return 'destructive';
    return 'secondary';
  };

  const getLastMessageAge = (timestamp: string) => {
    const now = Date.now();
    const messageTime = new Date(timestamp).getTime();
    const diffHours = Math.floor((now - messageTime) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Há poucos minutos';
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} dias`;
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <VendorConfigurationGuide />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Monitoramento de Webhooks dos Vendedores
          </CardTitle>
          <CardDescription>
            Gerencie e monitore a conectividade dos WhatsApps dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Executar Diagnóstico
            </Button>
            
            {summary && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {summary.api_connected}/{summary.total_vendors} conectados
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  {summary.with_recent_messages} com mensagens recentes
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {vendors.map((vendor) => (
              <Card key={vendor.vendor_id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{vendor.vendor_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {vendor.phone_number}
                        </Badge>
                        <Badge
                          variant={getStatusColor(vendor.token_status) as any}
                          className="text-xs"
                        >
                          Token: {vendor.token_status}
                        </Badge>
                        <Badge
                          variant={getStatusColor(vendor.webhook_status) as any}
                          className="text-xs"
                        >
                          API: {vendor.webhook_status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Channel ID: {vendor.whapi_channel_id}</p>
                        {vendor.last_message ? (
                          <p className="flex items-center gap-1">
                            {vendor.last_message.from_me ? (
                              <span className="text-blue-500">Enviada</span>
                            ) : (
                              <span className="text-green-500">Recebida</span>
                            )}
                            {getLastMessageAge(vendor.last_message.timestamp)}: 
                            <span className="italic">{vendor.last_message.content}</span>
                          </p>
                        ) : (
                          <p className="text-red-500">Nenhuma mensagem registrada</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => configureWebhook(vendor.vendor_id, 'status')}
                        disabled={actionLoading?.startsWith(vendor.vendor_id)}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === vendor.vendor_id + '_status' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        Status
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => configureWebhook(vendor.vendor_id, 'test')}
                        disabled={actionLoading?.startsWith(vendor.vendor_id) || vendor.token_status !== 'configured'}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === vendor.vendor_id + '_test' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <TestTube className="h-3 w-3" />
                        )}
                        Testar
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => configureWebhook(vendor.vendor_id, 'configure')}
                        disabled={actionLoading?.startsWith(vendor.vendor_id) || vendor.token_status !== 'configured'}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === vendor.vendor_id + '_configure' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Settings className="h-3 w-3" />
                        )}
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {vendors.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Execute o diagnóstico para verificar o status dos vendedores
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}