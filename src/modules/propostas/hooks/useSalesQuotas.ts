import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalesQuota {
  id: string;
  user_id: string;
  vendor_id: string | null;
  period_year: number;
  period_month: number;
  quota_amount: number;
  achieved_amount: number | null;
  percentage_achieved: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  profile?: {
    display_name: string;
    email: string;
  };
  vendor?: {
    name: string;
    phone_number: string;
  };
}

export function useSalesQuotas(year?: number, month?: number) {
  return useQuery({
    queryKey: ['sales-quotas', year, month],
    queryFn: async () => {
      // Mock data até a migração ser executada
      const mockQuotas: SalesQuota[] = [
        {
          id: '1',
          user_id: 'user1',
          vendor_id: 'vendor1',
          period_year: 2024,
          period_month: 1,
          quota_amount: 50000,
          achieved_amount: 39000,
          percentage_achieved: 78,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            display_name: 'João Silva',
            email: 'joao@empresa.com'
          },
          vendor: {
            name: 'Vendor João',
            phone_number: '+5511999999999'
          }
        },
        {
          id: '2',
          user_id: 'user2',
          vendor_id: 'vendor2',
          period_year: 2024,
          period_month: 1,
          quota_amount: 45000,
          achieved_amount: 52000,
          percentage_achieved: 115,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            display_name: 'Maria Santos',
            email: 'maria@empresa.com'
          },
          vendor: {
            name: 'Vendor Maria',
            phone_number: '+5511888888888'
          }
        },
        {
          id: '3',
          user_id: 'user3',
          vendor_id: 'vendor3',
          period_year: 2024,
          period_month: 1,
          quota_amount: 40000,
          achieved_amount: 22000,
          percentage_achieved: 55,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            display_name: 'Pedro Costa',
            email: 'pedro@empresa.com'
          },
          vendor: {
            name: 'Vendor Pedro',
            phone_number: '+5511777777777'
          }
        }
      ];

      return mockQuotas;
    },
  });
}

export function useCreateSalesQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotaData: {
      user_id: string;
      vendor_id?: string;
      period_year: number;
      period_month: number;
      quota_amount: number;
    }) => {
      // Mock por enquanto
      console.log('Create quota (mock):', quotaData);
      return { id: 'new-quota', ...quotaData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
    },
  });
}

export function useUpdateSalesQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<SalesQuota, 'quota_amount' | 'achieved_amount' | 'status'>>
    }) => {
      // Mock por enquanto
      console.log('Update quota (mock):', id, updates);
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
    },
  });
}

export function useDeleteSalesQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Mock por enquanto
      console.log('Delete quota (mock):', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
    },
  });
}

// Hook para estatísticas das metas
export function useSalesQuotasStats(year?: number, month?: number) {
  const { data: quotas = [] } = useSalesQuotas(year, month);

  const stats = {
    totalQuota: quotas.reduce((sum, quota) => sum + quota.quota_amount, 0),
    totalAchieved: quotas.reduce((sum, quota) => sum + (quota.achieved_amount || 0), 0),
    averagePercentage: quotas.length > 0 
      ? Math.round(quotas.reduce((sum, quota) => sum + (quota.percentage_achieved || 0), 0) / quotas.length)
      : 0,
    totalVendors: quotas.length,
    onTrackCount: quotas.filter(q => (q.percentage_achieved || 0) >= 70 && (q.percentage_achieved || 0) < 100).length,
    exceededCount: quotas.filter(q => (q.percentage_achieved || 0) >= 100).length,
    behindCount: quotas.filter(q => (q.percentage_achieved || 0) < 70).length,
  };

  return stats;
}