import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface MessageAnalytics {
  date: string;
  sender_type: string;
  total_messages: number;
  avg_message_length: number;
  conversation_id: string;
}

export function useMessageAnalytics(conversationId?: string, dateRange?: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['message-analytics', conversationId, dateRange],
    queryFn: async (): Promise<MessageAnalytics[]> => {
      let query = supabase
        .from('message_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        // A view herda as políticas RLS da tabela messages automaticamente
        // Se o usuário não tem acesso, retorna array vazio
        if (error.code === 'PGRST301' || error.code === '42501') {
          console.warn('Acesso restrito aos analytics de mensagens');
          return [];
        }
        throw error;
      }

      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useConversationMessageStats(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-message-stats', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_analytics')
        .select('*')
        .eq('conversation_id', conversationId);

      if (error) {
        if (error.code === 'PGRST301' || error.code === '42501') {
          return null; // Sem acesso aos stats
        }
        throw error;
      }

      // Agregar dados para estatísticas da conversa
      const stats = data?.reduce((acc, curr) => {
        acc.totalMessages += curr.total_messages;
        acc.avgMessageLength = (acc.avgMessageLength + curr.avg_message_length) / 2;
        if (!acc.messagesByType[curr.sender_type]) {
          acc.messagesByType[curr.sender_type] = 0;
        }
        acc.messagesByType[curr.sender_type] += curr.total_messages;
        return acc;
      }, {
        totalMessages: 0,
        avgMessageLength: 0,
        messagesByType: {} as Record<string, number>
      });

      return stats;
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
  });
}