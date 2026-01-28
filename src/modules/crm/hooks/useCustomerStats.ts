import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth } from 'date-fns';

interface CustomerStats {
  total: number;
  leads: number;
  active: number;
  newThisMonth: number;
  avgValue: number;
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: async (): Promise<CustomerStats> => {
      // Total de clientes
      const { count: total } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact', head: true });

      // Clientes com status 'lead'
      const { count: leads } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'lead');

      // Clientes ativos (status != 'inactive')
      const { count: active } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'inactive');

      // Novos clientes este mês
      const monthStart = startOfMonth(new Date()).toISOString();
      const { count: newThisMonth } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Valor médio das oportunidades
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('value')
        .gt('value', 0);

      const avgValue = opportunities && opportunities.length > 0
        ? opportunities.reduce((sum, o) => sum + (o.value || 0), 0) / opportunities.length
        : 0;

      return {
        total: total || 0,
        leads: leads || 0,
        active: active || 0,
        newThisMonth: newThisMonth || 0,
        avgValue: Math.round(avgValue),
      };
    },
    refetchInterval: 60 * 1000, // Atualizar a cada minuto
  });
}
