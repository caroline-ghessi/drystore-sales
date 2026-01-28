import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface VendorPerformanceData {
  vendorId: string;
  vendorName: string;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  qualityScore: number;
  conversionRate: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface VendorAnalytics {
  vendors: VendorPerformanceData[];
  totalVendors: number;
  avgResponseTime: number;
  avgQualityScore: number;
  topPerformers: VendorPerformanceData[];
  performanceComparison: {
    period: string;
    responseTime: number;
    conversations: number;
    quality: number;
  }[];
}

const MAX_REALISTIC_RESPONSE_TIME = 480; // 8 horas - ignora gaps noturnos

const getPeriodDates = (period: string) => {
  const now = new Date();
  let days: number;
  
  switch (period) {
    case 'today':
      days = 1;
      break;
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    default:
      days = 7;
  }
  
  return {
    startDate: subDays(now, days),
    endDate: now
  };
};

// Calcula score de qualidade baseado em métricas objetivas (não depende de IA)
const calculateQualityScore = (
  avgResponseTime: number, 
  vendorMessages: number, 
  customerMessages: number
): number => {
  // Score de tempo de resposta (0-10) - peso 60%
  let timeScore = 10;
  if (avgResponseTime > 120) timeScore = 4;
  else if (avgResponseTime > 60) timeScore = 6;
  else if (avgResponseTime > 30) timeScore = 8;
  
  // Score de engajamento - proporção de mensagens do vendedor vs cliente (peso 40%)
  // Ideal: vendedor responde proporcionalmente (ratio ~ 1.0-2.0)
  const engagementRatio = customerMessages > 0 ? vendorMessages / customerMessages : 0;
  const engagementScore = Math.min(10, engagementRatio * 5); // ratio 2 = score 10
  
  // Média ponderada
  return Math.round((timeScore * 0.6 + engagementScore * 0.4) * 10) / 10;
};

// Critérios realistas baseados em dados reais
const getPerformanceLevel = (metrics: {
  responseTime: number;
  qualityScore: number;
  conversionRate: number;
}): VendorPerformanceData['performance'] => {
  const score = (
    // Tempo de resposta: < 60min = bom, < 120min = médio
    (metrics.responseTime < 60 ? 3 : metrics.responseTime < 120 ? 2 : 1) +
    // Qualidade: > 6 = bom, > 4 = médio  
    (metrics.qualityScore > 6 ? 3 : metrics.qualityScore > 4 ? 2 : 1) +
    // Taxa conversão: > 5% = bom, > 2% = médio
    (metrics.conversionRate > 5 ? 3 : metrics.conversionRate > 2 ? 2 : 1)
  ) / 3;

  if (score >= 2.5) return 'excellent';
  if (score >= 2) return 'good';
  if (score >= 1.5) return 'average';
  return 'poor';
};

export function useVendorPerformance(period: string = '7d') {
  return useQuery({
    queryKey: ['vendor-performance', period],
    queryFn: async (): Promise<VendorAnalytics> => {
      const { startDate, endDate } = getPeriodDates(period);
      
      // Buscar vendedores
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);

      if (vendorsError) throw vendorsError;

      // Buscar conversas dos vendedores no período
      const { data: conversations, error: conversationsError } = await supabase
        .from('vendor_conversations')
        .select(`
          *,
          vendor_id,
          conversation_status,
          total_messages,
          vendor_messages,
          customer_messages,
          created_at,
          updated_at,
          metadata
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversationsError) throw conversationsError;

      // Buscar métricas de qualidade
      const { data: qualityMetrics, error: qualityError } = await supabase
        .from('quality_metrics')
        .select('*')
        .gte('metric_date', format(startDate, 'yyyy-MM-dd'))
        .lte('metric_date', format(endDate, 'yyyy-MM-dd'));

      if (qualityError) throw qualityError;

      // Processar dados por vendedor
      const vendorPerformance: VendorPerformanceData[] = vendors?.map(vendor => {
        // Filtrar contatos internos
        const vendorConversations = (conversations?.filter(c => c.vendor_id === vendor.id) || [])
          .filter(c => !(c.metadata as { is_internal_contact?: boolean })?.is_internal_contact);
        const vendorQuality = qualityMetrics?.filter(q => q.vendor_id === vendor.id) || [];

        const totalConversations = vendorConversations.length;
        const activeConversations = vendorConversations.filter(c => 
          c.conversation_status === 'active'
        ).length;
        
        // Somar mensagens das conversas
        const totalVendorMessages = vendorConversations.reduce((sum, c) => 
          sum + (c.vendor_messages || 0), 0
        );
        const totalCustomerMessages = vendorConversations.reduce((sum, c) => 
          sum + (c.customer_messages || 0), 0
        );
        const totalMessages = vendorConversations.reduce((sum, c) => 
          sum + (c.total_messages || 0), 0
        );

        // Filtrar tempos de resposta irreais (> 8h indica gap noturno)
        const validResponseTimes = vendorQuality.filter(q => 
          q.response_time_avg_minutes && q.response_time_avg_minutes <= MAX_REALISTIC_RESPONSE_TIME
        );
        
        const avgResponseTime = validResponseTimes.length > 0
          ? validResponseTimes.reduce((sum, q) => sum + (q.response_time_avg_minutes || 0), 0) / validResponseTimes.length
          : 0;

        // Usar score de IA se disponível, senão calcular baseado em métricas
        const iaScores = vendorQuality.filter(q => q.automated_quality_score && q.automated_quality_score > 0);
        const qualityScore = iaScores.length > 0
          ? iaScores.reduce((sum, q) => sum + (q.automated_quality_score || 0), 0) / iaScores.length
          : calculateQualityScore(avgResponseTime, totalVendorMessages, totalCustomerMessages);

        const conversionRate = totalConversations > 0
          ? (vendorConversations.filter(c => c.conversation_status === 'completed').length / totalConversations) * 100
          : 0;

        const performance = getPerformanceLevel({
          responseTime: avgResponseTime,
          qualityScore,
          conversionRate
        });

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          totalConversations,
          activeConversations,
          totalMessages,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          qualityScore: Math.round(qualityScore * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
          performance
        };
      }) || [];

      // Calcular métricas agregadas
      const totalVendors = vendorPerformance.length;
      const vendorsWithResponseTime = vendorPerformance.filter(v => v.avgResponseTime > 0);
      const avgResponseTime = vendorsWithResponseTime.length > 0
        ? vendorsWithResponseTime.reduce((sum, v) => sum + v.avgResponseTime, 0) / vendorsWithResponseTime.length
        : 0;
      
      const avgQualityScore = vendorPerformance.length > 0
        ? vendorPerformance.reduce((sum, v) => sum + v.qualityScore, 0) / vendorPerformance.length
        : 0;

      // Top performers (top 3)
      const topPerformers = [...vendorPerformance]
        .sort((a, b) => {
          const scoreA = (a.qualityScore * 0.4) + (Math.max(0, 100 - a.avgResponseTime) * 0.003) + (a.conversionRate * 0.3);
          const scoreB = (b.qualityScore * 0.4) + (Math.max(0, 100 - b.avgResponseTime) * 0.003) + (b.conversionRate * 0.3);
          return scoreB - scoreA;
        })
        .slice(0, 3);

      // Dados de comparação temporal
      const performanceComparison = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayQuality = qualityMetrics?.filter(q => 
          format(new Date(q.metric_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ) || [];
        
        // Filtrar tempos irreais também no histórico
        const validDayTimes = dayQuality.filter(q => 
          q.response_time_avg_minutes && q.response_time_avg_minutes <= MAX_REALISTIC_RESPONSE_TIME
        );
        const dayResponseTime = validDayTimes.length > 0
          ? validDayTimes.reduce((sum, q) => sum + (q.response_time_avg_minutes || 0), 0) / validDayTimes.length
          : 0;
        
        const dayConversations = conversations?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
          !(c.metadata as { is_internal_contact?: boolean })?.is_internal_contact
        ).length || 0;
        
        // Calcular qualidade do dia baseado em métricas reais
        const dayVendorMsgs = conversations?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ).reduce((sum, c) => sum + (c.vendor_messages || 0), 0) || 0;
        const dayCustomerMsgs = conversations?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ).reduce((sum, c) => sum + (c.customer_messages || 0), 0) || 0;
        
        const dayQualityScore = calculateQualityScore(dayResponseTime, dayVendorMsgs, dayCustomerMsgs);

        performanceComparison.push({
          period: format(date, 'dd/MM'),
          responseTime: Math.round(dayResponseTime * 10) / 10,
          conversations: dayConversations,
          quality: dayQualityScore
        });
      }

      return {
        vendors: vendorPerformance,
        totalVendors,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        avgQualityScore: Math.round(avgQualityScore * 10) / 10,
        topPerformers,
        performanceComparison
      };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
