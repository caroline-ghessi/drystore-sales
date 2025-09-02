import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, User, Bell, Database, Shield, Zap } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações CRM</h1>
        <p className="text-muted-foreground">
          Configure as preferências e parâmetros do seu sistema CRM
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Perfil da Empresa
                </CardTitle>
                <CardDescription>
                  Informações básicas da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" defaultValue="Drystore" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input id="company-phone" defaultValue="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email Principal</Label>
                  <Input id="company-email" defaultValue="contato@drystore.com.br" />
                </div>
                <Button>Salvar Alterações</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferências do Sistema</CardTitle>
                <CardDescription>
                  Configure o comportamento padrão do CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-assign">Auto-atribuição de leads</Label>
                  <Switch id="auto-assign" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="score-update">Atualização automática de score</Label>
                  <Switch id="score-update" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-source">Fonte padrão de leads</Label>
                  <Select defaultValue="whatsapp">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="social">Redes Sociais</SelectItem>
                      <SelectItem value="referral">Indicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Escolha quando e como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Leads e Oportunidades</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-lead">Novo lead recebido</Label>
                    <Switch id="new-lead" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hot-lead">Lead se torna quente</Label>
                    <Switch id="hot-lead" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="no-response">Lead sem resposta há 24h</Label>
                    <Switch id="no-response" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Vendas e Conversões</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proposal-sent">Proposta enviada</Label>
                    <Switch id="proposal-sent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deal-won">Negócio fechado</Label>
                    <Switch id="deal-won" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deal-lost">Negócio perdido</Label>
                    <Switch id="deal-lost" />
                  </div>
                </div>
              </div>

              <Button>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automações
              </CardTitle>
              <CardDescription>
                Configure regras e automações para otimizar seu workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Automações em Desenvolvimento
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Em breve você poderá configurar:<br/>
                  • Regras de atribuição automática<br/>
                  • Follow-ups automáticos baseados em comportamento<br/>
                  • Sequências de email e WhatsApp<br/>
                  • Triggers de mudança de estágio<br/>
                  • Alertas e lembretes personalizados
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Integrações
              </CardTitle>
              <CardDescription>
                Conecte o CRM com outras ferramentas e sistemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Integrações Disponíveis em Breve
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Planejamos integrar com:<br/>
                  • WhatsApp Business API (ativo)<br/>
                  • Gmail e Outlook<br/>
                  • Zapier e Make.com<br/>
                  • Google Calendar<br/>
                  • Sistemas ERP externos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança e Privacidade
              </CardTitle>
              <CardDescription>
                Configure as políticas de segurança e acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Controle de Acesso</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="two-factor">Autenticação de dois fatores</Label>
                    <Switch id="two-factor" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="session-timeout">Timeout de sessão (30min)</Label>
                    <Switch id="session-timeout" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Privacidade de Dados</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-export">Permitir exportação de dados</Label>
                    <Switch id="data-export" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="audit-log">Log de auditoria detalhado</Label>
                    <Switch id="audit-log" defaultChecked />
                  </div>
                </div>
              </div>

              <Button>Aplicar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}