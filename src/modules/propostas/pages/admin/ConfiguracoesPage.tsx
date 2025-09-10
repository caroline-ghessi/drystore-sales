import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Info, CheckCircle, UserPlus, Mail } from 'lucide-react';
import { useCalculatorValidation } from '../../hooks/useCalculatorValidation';
import { useUpdateSystemConfig } from '@/hooks/useSystemConfigs';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ConfiguracoesPage() {
  const { config, isLoading } = useCalculatorValidation();
  const updateConfig = useUpdateSystemConfig();
  const { isAdmin } = useUserPermissions();
  const { toast } = useToast();
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInviteCaroline = async () => {
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email: 'caroline@drystore.com.br',
          displayName: 'Caroline',
          department: 'Administração',
          role: 'admin'
        }
      });

      if (error) {
        console.error('Erro ao enviar convite:', error);
        toast({
          title: "❌ Erro ao enviar convite",
          description: "Falha ao enviar convite de admin para Caroline. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('Convite enviado com sucesso:', data);
      toast({
        title: "✅ Convite enviado!",
        description: "Caroline deve verificar o email e clicar no link de convite para ter acesso admin.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro na função de convite:', error);
      toast({
        title: "❌ Erro inesperado",
        description: "Ocorreu um erro ao processar o convite. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar as configurações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleToggleStrictValidation = (enabled: boolean) => {
    updateConfig.mutate({
      key: 'calculator_strict_validation',
      value: {
        ...config,
        strictValidation: enabled,
        requirePrices: enabled, // Auto ativa outras validações em modo estrito
        requireSpecifications: enabled,
        blockZeroPrices: enabled
      }
    });
  };

  const handleToggleSpecificValidation = (key: keyof typeof config, value: boolean) => {
    updateConfig.mutate({
      key: 'calculator_strict_validation',
      value: {
        ...config,
        [key]: value
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-drystore-dark-gray mb-2">
          Configurações das Calculadoras
        </h2>
        <p className="text-drystore-medium-gray">
          Controle as validações e comportamento das calculadoras do sistema.
        </p>
      </div>

      {/* Status Atual */}
      <Card className={`border-l-4 ${config.strictValidation ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {config.strictValidation ? (
              <>
                <Shield className="h-5 w-5 text-red-600" />
                <span className="text-red-800">Modo Validação Rigorosa</span>
                <Badge variant="destructive">ATIVO</Badge>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Modo de Teste</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">ATIVO</Badge>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.strictValidation ? (
            <p className="text-red-700 text-sm">
              Calculadoras bloqueadas para produtos sem preço ou especificações incompletas. 
              Modo de produção ativo para evitar erros de precificação.
            </p>
          ) : (
            <p className="text-green-700 text-sm">
              Calculadoras permitem cálculos mesmo com produtos incompletos. 
              Modo ideal para testes e configuração inicial dos produtos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Configurações Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Validação Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="strict-validation" className="text-base font-medium">
                Validação Rigorosa
              </Label>
              <p className="text-sm text-muted-foreground">
                Ativa todas as validações e bloqueia cálculos com produtos incompletos
              </p>
            </div>
            <Switch
              id="strict-validation"
              checked={config.strictValidation}
              onCheckedChange={handleToggleStrictValidation}
              disabled={updateConfig.isPending}
            />
          </div>

          {/* Configurações Específicas */}
          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-prices" className="text-sm font-medium">
                  Exigir Preços Válidos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bloquear produtos com preço R$ 0,00
                </p>
              </div>
              <Switch
                id="require-prices"
                checked={config.requirePrices}
                onCheckedChange={(value) => handleToggleSpecificValidation('requirePrices', value)}
                disabled={updateConfig.isPending || config.strictValidation}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-specs" className="text-sm font-medium">
                  Exigir Especificações
                </Label>
                <p className="text-xs text-muted-foreground">
                  Validar especificações técnicas obrigatórias
                </p>
              </div>
              <Switch
                id="require-specs"
                checked={config.requireSpecifications}
                onCheckedChange={(value) => handleToggleSpecificValidation('requireSpecifications', value)}
                disabled={updateConfig.isPending || config.strictValidation}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="block-zero-prices" className="text-sm font-medium">
                  Bloquear Preços Zero
                </Label>
                <p className="text-xs text-muted-foreground">
                  Impedir cálculos com produtos sem preço
                </p>
              </div>
              <Switch
                id="block-zero-prices"
                checked={config.blockZeroPrices}
                onCheckedChange={(value) => handleToggleSpecificValidation('blockZeroPrices', value)}
                disabled={updateConfig.isPending || config.strictValidation}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Gerenciamento de Usuários Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">caroline@drystore.com.br</span>
                <Badge variant="outline" className="text-blue-700 border-blue-200">Pendente</Badge>
              </div>
              <p className="text-sm text-blue-700">
                Usuário precisa ser convidado para ter acesso administrativo
              </p>
            </div>
            <Button 
              onClick={handleInviteCaroline}
              disabled={inviteLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {inviteLoading ? "Enviando..." : "Enviar Convite Admin"}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
            <strong>Como funciona:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Clique em "Enviar Convite Admin" para enviar email de convite</li>
              <li>Caroline receberá um email com link de convite (válido por 24h)</li>
              <li>Após clicar no link, poderá definir senha e terá acesso completo</li>
              <li>O usuário aparecerá na lista de atendentes com permissão "Administrador"</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-green-600">Modo de Teste (Atual):</strong>
              <p className="text-muted-foreground">
                Permite cálculos mesmo com produtos incompletos. Ideal para configuração inicial 
                e testes do sistema. Produtos sem preço ou especificações geram avisos, mas não bloqueiam cálculos.
              </p>
            </div>
            <div>
              <strong className="text-red-600">Modo de Produção:</strong>
              <p className="text-muted-foreground">
                Validação rigorosa que impede cálculos com produtos incompletos. 
                Evita erros de precificação que podem ser fatais para o negócio. 
                Ative apenas quando todos os produtos estiverem devidamente cadastrados.
              </p>
            </div>
            <div>
              <strong className="text-blue-600">Recomendação:</strong>
              <p className="text-muted-foreground">
                Mantenha no modo de teste durante a configuração inicial dos produtos. 
                Ative o modo rigoroso apenas quando todos os preços e especificações estiverem corretos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}