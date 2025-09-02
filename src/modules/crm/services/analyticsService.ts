import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  period: string;
  totalLeads: number;
  hotLeads: number;
  conversionRate: number;
  averageResponseTime: number;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  dailyTrends: Array<{ date: string; leads: number; conversions: number }>;
}

export class AnalyticsService {
  static async getLeadAnalytics(period: string = '7d'): Promise<AnalyticsData> {
    const { startDate, endDate } = this.getPeriodDates(period);
    
    // Buscar dados de leads
    const { data: leads, error: leadsError } = await supabase
      .from('conversations')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (leadsError) throw leadsError;

    // Buscar dados de conversões
    const { data: conversions, error: conversionsError } = await supabase
      .from('lead_distributions')
      .select('*')
      .gte('sent_at', startDate)
      .lte('sent_at', endDate);

    if (conversionsError) throw conversionsError;

    // Processar dados
    const totalLeads = leads?.length || 0;
    const hotLeads = leads?.filter(l => l.lead_temperature === 'hot').length || 0;
    const conversionRate = totalLeads > 0 ? ((conversions?.length || 0) / totalLeads) * 100 : 0;

    // Calcular fontes principais
    const sourceCount = leads?.reduce((acc, lead) => {
      const source = lead.source || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topSources = Object.entries(sourceCount)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Tendências diárias
    const dailyTrends = this.calculateDailyTrends(leads || [], conversions || [], period);

    return {
      period,
      totalLeads,
      hotLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageResponseTime: 0, // TODO: Implementar cálculo real
      topSources,
      dailyTrends
    };
  }

  private static getPeriodDates(period: string) {
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
      startDate: new Date(now.getTime() - (days * 24 * 60 * 60 * 1000)).toISOString(),
      endDate: now.toISOString()
    };
  }

  private static calculateDailyTrends(leads: any[], conversions: any[], period: string) {
    const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 7;
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = leads.filter(l => 
        l.created_at?.startsWith(dateStr)
      ).length;
      
      const dayConversions = conversions.filter(c => 
        c.sent_at?.startsWith(dateStr)
      ).length;
      
      trends.push({
        date: dateStr,
        leads: dayLeads,
        conversions: dayConversions
      });
    }
    
    return trends;
  }
}