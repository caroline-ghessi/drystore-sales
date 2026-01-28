import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Kanban
} from 'lucide-react';
import { CONVERSATION_STATUS_LABELS, TEMPERATURE_EMOJIS } from '@/lib/constants';
import { KanbanStats } from '../components/pipeline/KanbanStats';
import { PipelineKanban } from '../components/pipeline/PipelineKanban';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();

  const stats = {
    total: conversations?.length || 0,
    active: conversations?.filter(c => c.status === 'active').length || 0,
    hotLeads: conversations?.filter(c => c.lead_temperature === 'hot').length || 0,
    unread: conversations?.reduce((acc, c) => acc + c.unreadCount, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do seu pipeline de vendas
          </p>
        </div>
        <Button 
          onClick={() => navigate('/crm/pipeline')}
          className="bg-primary hover:bg-primary/90"
        >
          <Kanban className="w-4 h-4 mr-2" />
          Ver Pipeline Completo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Pipeline Stats */}
      <KanbanStats />

      {/* Quick Stats from Conversations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Conversas
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todas as conversas registradas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversas Ativas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento agora
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Quentes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.hotLeads}</div>
            <p className="text-xs text-muted-foreground">
              Alta probabilidade de conversão
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mensagens Não Lidas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini Pipeline Kanban */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Kanban className="w-5 h-5" />
            Pipeline de Vendas
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/crm/pipeline')}
          >
            Ver todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4">
            <PipelineKanban />
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.slice(0, 5).map((conversation) => (
                <div 
                  key={conversation.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/atendimento?conv=${conversation.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {conversation.customer_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {conversation.customer_name || conversation.whatsapp_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {conversation.lastMessage?.content.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {CONVERSATION_STATUS_LABELS[conversation.status]}
                    </Badge>
                    <span className="text-lg">
                      {TEMPERATURE_EMOJIS[conversation.lead_temperature]}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm">As conversas aparecerão aqui quando iniciadas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
