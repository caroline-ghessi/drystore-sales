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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">WhatsApp Business</h1>
          <p className="text-slate-600 mt-2">
            Dashboard do módulo de atendimento WhatsApp
          </p>
        </div>
        <Link to="/conversas">
          <Button className="bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Abrir Conversas
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Total de conversas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Conversas sendo atendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Quentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.hotLeads}</div>
            <p className="text-xs text-muted-foreground">
              Alta probabilidade de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sistema Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot Inteligente</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">{stats.botActive}</div>
                <p className="text-xs text-muted-foreground">Agentes ativos</p>
              </div>
              <Link to="/whatsapp/bot">
                <Button variant="outline" size="sm">
                  Configurar
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">{stats.vendorsActive}</div>
                <p className="text-xs text-muted-foreground">WhatsApp ativos</p>
              </div>
              <Link to="/whatsapp/vendedores">
                <Button variant="outline" size="sm">
                  Gerenciar
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">24h</div>
                <p className="text-xs text-muted-foreground">Última atualização</p>
              </div>
              <Link to="/whatsapp/analytics">
                <Button variant="outline" size="sm">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/conversas" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Abrir Central de Conversas
                </Button>
              </Link>
              <Link to="/whatsapp/bot" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Bot className="h-4 w-4 mr-2" />
                  Configurar Bot Inteligente
                </Button>
              </Link>
              <Link to="/whatsapp/atendentes" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Atendentes
                </Button>
              </Link>
              <Link to="/whatsapp/analytics" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Relatórios Detalhados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.slice(0, 4).map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                        {conversation.customer_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.customer_name || conversation.whatsapp_number}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {conversation.lastMessage?.content.substring(0, 30)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {CONVERSATION_STATUS_LABELS[conversation.status]}
                      </Badge>
                      <span className="text-sm">
                        {TEMPERATURE_EMOJIS[conversation.lead_temperature]}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/conversas">
                  <Button variant="ghost" className="w-full text-sm">
                    Ver todas as conversas
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa ativa</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}