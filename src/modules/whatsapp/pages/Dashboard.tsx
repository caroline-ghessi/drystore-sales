import { useConversations } from '@/hooks/useConversations';
import { useAgentConfigs } from '@/hooks/useAgentConfigs';
import { useVendors } from '@/hooks/useVendors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  Bot,
  Phone,
  BarChart3,
  Settings,
  Activity,
  ArrowRight
} from 'lucide-react';
import { CONVERSATION_STATUS_LABELS, TEMPERATURE_EMOJIS } from '@/lib/constants';
import { Link } from 'react-router-dom';

export default function WhatsAppDashboard() {
  const { data: conversations, isLoading } = useConversations();
  const { data: agentConfigs } = useAgentConfigs();
  const { data: vendors } = useVendors();

  const stats = {
    total: conversations?.length || 0,
    active: conversations?.filter(c => c.status === 'active').length || 0,
    hotLeads: conversations?.filter(c => c.lead_temperature === 'hot').length || 0,
    unread: conversations?.reduce((acc, c) => acc + (c.unreadCount || 0), 0) || 0,
    botActive: agentConfigs?.filter(a => a.is_active).length || 0,
    vendorsActive: vendors?.filter(v => v.is_active).length || 0,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard WhatsApp</h1>
          <p className="text-muted-foreground text-base">
            Monitoramento em tempo real do atendimento via WhatsApp Business
          </p>
        </div>
        <Link to="/conversas">
          <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Abrir Conversas
          </Button>
        </Link>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Conversas Hoje</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
            <p className="text-sm text-muted-foreground">
              Total de conversas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Em Atendimento</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.active}</div>
            <p className="text-sm text-muted-foreground">
              Conversas sendo atendidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Leads Quentes</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-drystore-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-drystore-orange mb-1">{stats.hotLeads}</div>
            <p className="text-sm text-muted-foreground">
              Alta probabilidade de conversão
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Não Lidas</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.unread}</div>
            <p className="text-sm text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sistema Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Bot Inteligente</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.botActive}</div>
                <p className="text-sm text-muted-foreground">Agentes ativos</p>
              </div>
              <Link to="/whatsapp/bot">
                <Button variant="outline" size="sm" className="shadow-none">
                  Configurar
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Vendedores</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Phone className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.vendorsActive}</div>
                <p className="text-sm text-muted-foreground">WhatsApp ativos</p>
              </div>
              <Link to="/whatsapp/vendedores">
                <Button variant="outline" size="sm" className="shadow-none">
                  Gerenciar
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Analytics</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">24h</div>
                <p className="text-sm text-muted-foreground">Última atualização</p>
              </div>
              <Link to="/whatsapp/analytics">
                <Button variant="outline" size="sm" className="shadow-none">
                  Ver Relatórios
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="p-2 bg-drystore-orange/10 rounded-lg">
                <Activity className="h-5 w-5 text-drystore-orange" />
              </div>
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/conversas" className="block">
                <Button variant="outline" className="w-full justify-start h-12 shadow-none border-border hover:bg-muted">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Abrir Central de Conversas
                </Button>
              </Link>
              <Link to="/whatsapp/bot" className="block">
                <Button variant="outline" className="w-full justify-start h-12 shadow-none border-border hover:bg-muted">
                  <Bot className="h-5 w-5 mr-3" />
                  Configurar Bot Inteligente
                </Button>
              </Link>
              <Link to="/whatsapp/atendentes" className="block">
                <Button variant="outline" className="w-full justify-start h-12 shadow-none border-border hover:bg-muted">
                  <Users className="h-5 w-5 mr-3" />
                  Gerenciar Atendentes
                </Button>
              </Link>
              <Link to="/whatsapp/analytics" className="block">
                <Button variant="outline" className="w-full justify-start h-12 shadow-none border-border hover:bg-muted">
                  <BarChart3 className="h-5 w-5 mr-3" />
                  Ver Relatórios Detalhados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Conversas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.slice(0, 4).map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {conversation.customer_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {conversation.customer_name || conversation.whatsapp_number}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage?.content.substring(0, 30)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-border">
                        {CONVERSATION_STATUS_LABELS[conversation.status]}
                      </Badge>
                      <span className="text-lg">
                        {TEMPERATURE_EMOJIS[conversation.lead_temperature]}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/conversas">
                  <Button variant="ghost" className="w-full text-sm mt-4 hover:bg-muted">
                    Ver todas as conversas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma conversa ativa</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}