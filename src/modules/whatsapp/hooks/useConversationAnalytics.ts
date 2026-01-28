import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logSystem } from '@/lib/supabase';

export function useConversationAnalytics(period: string) {
  return useQuery({
    queryKey: ['conversation-analytics', period],
    queryFn: async () => {
      try {
        // Calcular data de início baseada no período
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (error) {
          // Se é erro RLS, retornar dados vazios
          if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
            await logSystem('warning', 'useConversationAnalytics', 'RLS policy blocked access - returning empty analytics', error);
            return {
              totalConversations: 0,
              activeConversations: 0,
              completedConversations: 0,
              averageResponseTime: 0,
              conversionRate: 0,
              dailyTrends: [],
              dailyConversations: [],
              statusDistribution: [],
              categoryDistribution: [],
              avgMessagesPerConversation: 0,
              responseTimeData: []
            };
          }
          
          await logSystem('error', 'useConversationAnalytics', 'Failed to fetch conversation analytics', error);
          throw error;
        }

        const conversations = data || [];
        const conversationIds = conversations.map(c => c.id);
        
        // Processar métricas básicas
        const totalConversations = conversations.length;
        const activeConversations = conversations.filter(c => c.status === 'active' || c.status === 'in_bot' || c.status === 'waiting').length;
        const completedConversations = conversations.filter(c => c.status === 'closed').length;
        const conversionRate = totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0;

        // Buscar tempo médio de resposta da tabela quality_metrics
        let averageResponseTime = 0;
        const { data: qualityData } = await supabase
          .from('quality_metrics')
          .select('response_time_avg_minutes')
          .gte('metric_date', startDate.toISOString().split('T')[0]);

        if (qualityData && qualityData.length > 0) {
          const validTimes = qualityData.filter(q => q.response_time_avg_minutes != null);
          if (validTimes.length > 0) {
            averageResponseTime = Math.round(
              (validTimes.reduce((sum, q) => sum + (q.response_time_avg_minutes || 0), 0) / validTimes.length) * 10
            ) / 10;
          }
        }

        // Calcular média de mensagens por conversa (real)
        let avgMessagesPerConversation = 0;
        if (conversationIds.length > 0) {
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds);

          avgMessagesPerConversation = totalConversations > 0 
            ? Math.round((messageCount || 0) / totalConversations) 
            : 0;
        }

        // Calcular distribuição de tempo de resposta real
        const { data: responseData } = await supabase
          .from('quality_metrics')
          .select('response_time_avg_minutes')
          .gte('metric_date', startDate.toISOString().split('T')[0]);

        const responseBuckets: Record<string, number[]> = { 
          '0-2h': [], 
          '2-4h': [], 
          '4-8h': [], 
          '8h+': [] 
        };

        responseData?.forEach(r => {
          const mins = r.response_time_avg_minutes || 0;
          if (mins <= 120) responseBuckets['0-2h'].push(mins);
          else if (mins <= 240) responseBuckets['2-4h'].push(mins);
          else if (mins <= 480) responseBuckets['4-8h'].push(mins);
          else responseBuckets['8h+'].push(mins);
        });

        const responseTimeData = Object.entries(responseBuckets).map(([hour, values]) => ({
          hour,
          count: values.length,
          avgMinutes: values.length > 0 
            ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
            : 0
        }));

        // Distribuição por status
        const statusDistribution = [
          { name: 'Ativo', value: activeConversations, color: 'hsl(var(--primary))', status: 'active', count: activeConversations, percentage: totalConversations > 0 ? (activeConversations / totalConversations) * 100 : 0 },
          { name: 'Aguardando', value: conversations.filter(c => c.status === 'waiting').length, color: 'hsl(var(--secondary))', status: 'waiting', count: conversations.filter(c => c.status === 'waiting').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.status === 'waiting').length / totalConversations) * 100 : 0 },
          { name: 'Bot', value: conversations.filter(c => c.status === 'in_bot').length, color: 'hsl(var(--accent))', status: 'in_bot', count: conversations.filter(c => c.status === 'in_bot').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.status === 'in_bot').length / totalConversations) * 100 : 0 },
          { name: 'Finalizado', value: completedConversations, color: 'hsl(var(--muted))', status: 'closed', count: completedConversations, percentage: totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0 }
        ];

        // Distribuição por categoria
        const categoryDistribution = [
          { name: 'Solar', value: conversations.filter(c => c.product_group === 'energia_solar').length, color: 'hsl(var(--primary))', status: 'energia_solar', count: conversations.filter(c => c.product_group === 'energia_solar').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.product_group === 'energia_solar').length / totalConversations) * 100 : 0 },
          { name: 'Telhas', value: conversations.filter(c => c.product_group === 'telha_shingle').length, color: 'hsl(var(--secondary))', status: 'telha_shingle', count: conversations.filter(c => c.product_group === 'telha_shingle').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.product_group === 'telha_shingle').length / totalConversations) * 100 : 0 },
          { name: 'Steel Frame', value: conversations.filter(c => c.product_group === 'steel_frame').length, color: 'hsl(var(--accent))', status: 'steel_frame', count: conversations.filter(c => c.product_group === 'steel_frame').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.product_group === 'steel_frame').length / totalConversations) * 100 : 0 },
          { name: 'Pisos', value: conversations.filter(c => c.product_group === 'pisos').length, color: 'hsl(var(--muted))', status: 'pisos', count: conversations.filter(c => c.product_group === 'pisos').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.product_group === 'pisos').length / totalConversations) * 100 : 0 },
          { name: 'Indefinido', value: conversations.filter(c => c.product_group === 'indefinido').length, color: 'hsl(var(--muted-foreground))', status: 'indefinido', count: conversations.filter(c => c.product_group === 'indefinido').length, percentage: totalConversations > 0 ? (conversations.filter(c => c.product_group === 'indefinido').length / totalConversations) * 100 : 0 }
        ];

        // Preparar dados de tendência diária
        const dailyTrends = [];
        const dailyConversations = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayConversations = conversations.filter(c => {
            const convDate = new Date(c.created_at);
            return convDate.toDateString() === date.toDateString();
          });
          
          const dayData = {
            date: date.toISOString().split('T')[0],
            count: dayConversations.length,
            conversations: dayConversations.length,
            hot_leads: dayConversations.filter(c => c.lead_temperature === 'hot').length,
            warm_leads: dayConversations.filter(c => c.lead_temperature === 'warm').length,
            cold_leads: dayConversations.filter(c => c.lead_temperature === 'cold').length
          };
          
          dailyTrends.push(dayData);
          dailyConversations.push(dayData);
        }

        return {
          totalConversations,
          activeConversations,
          completedConversations,
          averageResponseTime,
          conversionRate,
          dailyTrends,
          dailyConversations,
          statusDistribution,
          categoryDistribution,
          avgMessagesPerConversation,
          responseTimeData
        };
      } catch (error) {
        await logSystem('error', 'useConversationAnalytics', 'Unexpected error in useConversationAnalytics', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros de RLS
      if (error?.code === 'PGRST116' || error?.message?.includes('row-level security')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export function useConversationAccessLogs(conversationId?: string) {
  return useQuery({
    queryKey: ['conversation-access-logs', conversationId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('conversation_access_log')
          .select(`
            *,
            profiles(display_name, email)
          `)
          .order('created_at', { ascending: false });

        if (conversationId) {
          query = query.eq('conversation_id', conversationId);
        }

        const { data, error } = await query.limit(100);

        if (error) {
          // Se é erro RLS (não-admin tentando acessar), retornar array vazio
          if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
            await logSystem('warning', 'useConversationAccessLogs', 'RLS policy blocked access to audit logs', error);
            return [];
          }
          
          await logSystem('error', 'useConversationAccessLogs', 'Failed to fetch conversation access logs', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        await logSystem('error', 'useConversationAccessLogs', 'Unexpected error in useConversationAccessLogs', error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros de RLS
      if (error?.code === 'PGRST116' || error?.message?.includes('row-level security')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export function useVendorConversationOverview(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['vendor-conversation-overview', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('vendor_conversation_overview')
          .select('*');

        // Apply search filter (only on visible fields for vendors)
        if (filters?.search) {
          query = query.or(
            `customer_name.ilike.%${filters.search}%,whatsapp_number.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query
          .order('last_message_at', { ascending: false })
          .limit(50);

        if (error) {
          await logSystem('error', 'useVendorConversationOverview', 'Failed to fetch vendor conversation overview', error);
          throw error;
        }

        return (data || []).map((conv: any) => ({
          ...conv,
          created_at: new Date(conv.created_at || ''),
          updated_at: new Date(conv.updated_at || ''),
          first_message_at: new Date(conv.first_message_at || ''),
          last_message_at: new Date(conv.last_message_at || ''),
        }));
      } catch (error) {
        await logSystem('error', 'useVendorConversationOverview', 'Unexpected error in useVendorConversationOverview', error);
        throw error;
      }
    },
    staleTime: 30 * 1000,
  });
}
