import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface BotMetrics {
  totalConversations: number;
  activeConversations: number;
  totalBotMessages: number;
  avgBotResponseTime: number;
  handoffRate: number;
  classificationAccuracy: number;
  conversationsByCategory: {
    category: string;
    count: number;
    percentage: number;
  }[];
  conversationsByStatus: {
    status: string;
    count: number;
  }[];
  dailyMetrics: {
    date: string;
    conversations: number;
    botMessages: number;
    handoffs: number;
  }[];
  agentTypeDistribution: {
    agentType: string;
    count: number;
  }[];
}

const getPeriodDays = (period: string): number => {
  switch (period) {
    case 'today': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 7;
  }
};

export function useBotAnalytics(period: string = '7d') {
  return useQuery({
    queryKey: ['bot-analytics', period],
    queryFn: async (): Promise<BotMetrics> => {
      const days = getPeriodDays(period);
      const startDate = subDays(new Date(), days);
      
      // Buscar conversas do período
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, status, product_group, created_at, last_message_at')
        .gte('created_at', startDate.toISOString());

      if (convError) throw convError;

      // Buscar mensagens do bot no período
      const { data: botMessages, error: msgError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_type, agent_type, created_at')
        .eq('sender_type', 'bot')
        .gte('created_at', startDate.toISOString());

      if (msgError) throw msgError;

      // Calcular métricas base
      const totalConversations = conversations?.length || 0;
      const activeConversations = conversations?.filter(c => 
        c.status === 'in_bot' || c.status === 'waiting'
      ).length || 0;
      
      const totalBotMessages = botMessages?.length || 0;
      
      // Taxa de handoff (conversas que passaram para agente humano)
      const handoffConversations = conversations?.filter(c => 
        c.status === 'with_agent' || c.status === 'closed'
      ).length || 0;
      
      const handoffRate = totalConversations > 0 
        ? Math.round((handoffConversations / totalConversations) * 100 * 10) / 10
        : 0;

      // Distribuição por categoria de produto
      const categoryCount: Record<string, number> = {};
      conversations?.forEach(conv => {
        const cat = conv.product_group || 'indefinido';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const conversationsByCategory = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category: formatCategory(category),
          count,
          percentage: totalConversations > 0 
            ? Math.round((count / totalConversations) * 100 * 10) / 10 
            : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Distribuição por status
      const statusCount: Record<string, number> = {};
      conversations?.forEach(conv => {
        const status = conv.status || 'unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      const conversationsByStatus = Object.entries(statusCount)
        .map(([status, count]) => ({
          status: formatStatus(status),
          count
        }))
        .sort((a, b) => b.count - a.count);

      // Métricas diárias
      const dailyData: Record<string, { conversations: Set<string>; botMessages: number; handoffs: number }> = {};
      
      for (let i = 0; i < Math.min(days, 14); i++) {
        const date = format(subDays(new Date(), i), 'dd/MM');
        dailyData[date] = { conversations: new Set(), botMessages: 0, handoffs: 0 };
      }

      conversations?.forEach(conv => {
        const date = format(new Date(conv.created_at), 'dd/MM');
        if (dailyData[date]) {
          dailyData[date].conversations.add(conv.id);
          if (conv.status === 'with_agent' || conv.status === 'closed') {
            dailyData[date].handoffs++;
          }
        }
      });

      botMessages?.forEach(msg => {
        const date = format(new Date(msg.created_at), 'dd/MM');
        if (dailyData[date]) {
          dailyData[date].botMessages++;
        }
      });

      const dailyMetrics = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          conversations: data.conversations.size,
          botMessages: data.botMessages,
          handoffs: data.handoffs
        }))
        .reverse();

      // Distribuição por tipo de agente
      const agentTypeCount: Record<string, number> = {};
      botMessages?.forEach(msg => {
        const agentType = msg.agent_type || 'general';
        agentTypeCount[agentType] = (agentTypeCount[agentType] || 0) + 1;
      });

      const agentTypeDistribution = Object.entries(agentTypeCount)
        .map(([agentType, count]) => ({
          agentType: formatAgentType(agentType),
          count
        }))
        .sort((a, b) => b.count - a.count);

      // Calcular classificação accuracy (conversas com product_group definido vs indefinido)
      const classifiedConversations = conversations?.filter(c => 
        c.product_group && c.product_group !== 'indefinido'
      ).length || 0;
      
      const classificationAccuracy = totalConversations > 0
        ? Math.round((classifiedConversations / totalConversations) * 100 * 10) / 10
        : 0;

      return {
        totalConversations,
        activeConversations,
        totalBotMessages,
        avgBotResponseTime: 1, // Bot responde instantaneamente
        handoffRate,
        classificationAccuracy,
        conversationsByCategory,
        conversationsByStatus,
        dailyMetrics,
        agentTypeDistribution
      };
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    'energia_solar': 'Energia Solar',
    'telhas': 'Telhas',
    'pisos': 'Pisos',
    'materiais_construcao': 'Materiais',
    'indefinido': 'Indefinido',
    'outro': 'Outro'
  };
  return labels[category] || category;
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    'in_bot': 'Com Bot',
    'waiting': 'Aguardando',
    'with_agent': 'Com Agente',
    'closed': 'Encerrada',
    'pending': 'Pendente'
  };
  return labels[status] || status;
}

function formatAgentType(agentType: string): string {
  const labels: Record<string, string> = {
    'specialist': 'Especialista',
    'general': 'Geral',
    'classifier': 'Classificador',
    'extractor': 'Extrator'
  };
  return labels[agentType] || agentType;
}
