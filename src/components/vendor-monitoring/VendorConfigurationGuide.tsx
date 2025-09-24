import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';

export function VendorConfigurationGuide() {
  const webhookUrl = 'https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/vendor-whatsapp-webhook';
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada para clipboard');
  };

  const configurationSteps = [
    {
      step: 1,
      title: 'Configurar Token no Sistema',
      description: 'Cada vendedor deve ter seu token Whapi configurado nos secrets do sistema',
      status: 'completed'
    },
    {
      step: 2,
      title: 'Configurar Webhook no Whapi',
      description: 'Configurar o webhook de cada vendedor para receber mensagens',
      status: 'pending'
    },
    {
      step: 3,
      title: 'Testar Conectividade',
      description: 'Enviar mensagem de teste para validar o funcionamento',
      status: 'pending'
    },
    {
      step: 4,
      title: 'Monitoramento Ativo',
      description: 'Acompanhar mensagens em tempo real no sistema',
      status: 'pending'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Guia de Configuração
          </CardTitle>
          <CardDescription>
            Passos necessários para configurar o monitoramento dos WhatsApps dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Este sistema monitora apenas conversas individuais com clientes. 
              Mensagens de grupos são automaticamente filtradas e ignoradas.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {configurationSteps.map((step) => (
              <div key={step.step} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.step
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                      {step.status === 'completed' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">URL do Webhook</h4>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <code className="flex-1 text-sm font-mono">{webhookUrl}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(webhookUrl)}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Esta URL deve ser configurada no painel Whapi de cada vendedor
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Configuração Manual no Whapi</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Acesse o painel Whapi Cloud do vendedor</li>
              <li>Vá em Settings → Webhooks</li>
              <li>Cole a URL do webhook acima</li>
              <li>Selecione eventos: <code>messages</code> e <code>statuses</code></li>
              <li>Salve as configurações</li>
              <li>Use o botão "Testar" aqui no sistema para validar</li>
            </ol>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://whapi.cloud', '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir Whapi Cloud
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}