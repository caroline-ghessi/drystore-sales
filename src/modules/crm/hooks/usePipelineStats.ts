import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PipelineStats {
  totalPipelineValue: number;
  conversionRate: number;
  avgCycleTime: number;
  activeLeads: number;
  totalOpportunities: number;
  closedWonCount: number;
  closedLostCount: number;
  newOpportunitiesToday: number;
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      // Fetch all opportunities for stats calculation
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('id, value, stage, created_at, actual_close_date')
        .not('validation_status', 'eq', 'rejected');

      if (error) throw error;

      const opps = opportunities || [];
      
      // Calculate stats
      const totalPipelineValue = opps
        .filter(o => !['closed_won', 'closed_lost'].includes(o.stage || ''))
        .reduce((sum, o) => sum + (o.value || 0), 0);

      const closedWon = opps.filter(o => o.stage === 'closed_won');
      const closedLost = opps.filter(o => o.stage === 'closed_lost');
      const totalClosed = closedWon.length + closedLost.length;
      
      const conversionRate = totalClosed > 0 
        ? (closedWon.length / totalClosed) * 100 
        : 0;

      // Calculate average cycle time (days from created to closed)
      let avgCycleTime = 0;
      if (closedWon.length > 0) {
        const cycleTimes = closedWon
          .filter(o => o.actual_close_date)
          .map(o => {
            const created = new Date(o.created_at || Date.now());
            const closed = new Date(o.actual_close_date!);
            return Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          });
        
        if (cycleTimes.length > 0) {
          avgCycleTime = Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length);
        }
      }

      const activeLeads = opps.filter(
        o => !['closed_won', 'closed_lost'].includes(o.stage || '')
      ).length;

      // Count opportunities created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newOpportunitiesToday = opps.filter(o => {
        const created = new Date(o.created_at || 0);
        return created >= today;
      }).length;

      const stats: PipelineStats = {
        totalPipelineValue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgCycleTime,
        activeLeads,
        totalOpportunities: opps.length,
        closedWonCount: closedWon.length,
        closedLostCount: closedLost.length,
        newOpportunitiesToday,
      };

      return stats;
    },
  });
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
