import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DuplicateGroup {
  customer_phone: string;
  customer_name: string;
  vendor_id: string;
  vendor_name: string;
  product_category: string | null;
  opportunities: Array<{
    id: string;
    title: string;
    value: number;
    created_at: string;
    stage: string;
  }>;
}

interface DuplicateStats {
  total_opportunities: number;
  unique_customers: number;
  duplicate_groups: number;
  total_duplicates: number;
  parallel_leads: number;
}

export function useDuplicateStats() {
  return useQuery({
    queryKey: ['crm-duplicate-stats'],
    queryFn: async (): Promise<DuplicateStats> => {
      // Get all active opportunities with customer data
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select(`
          id,
          vendor_id,
          product_category,
          duplicate_of_id,
          customer:crm_customers!inner(phone)
        `)
        .is('duplicate_of_id', null)
        .not('stage', 'in', '("closed_won","closed_lost")');

      if (error) throw error;

      // Count by groups
      const vendorPhoneGroups = new Map<string, string[]>();
      const phoneGroups = new Map<string, Set<string>>();

      for (const opp of opportunities || []) {
        const phone = (opp.customer as any)?.phone;
        if (!phone) continue;

        // For duplicate detection (same vendor + phone)
        const vendorKey = `${phone}|${opp.vendor_id}`;
        if (!vendorPhoneGroups.has(vendorKey)) {
          vendorPhoneGroups.set(vendorKey, []);
        }
        vendorPhoneGroups.get(vendorKey)!.push(opp.id);

        // For parallel leads (same phone, different vendors)
        if (!phoneGroups.has(phone)) {
          phoneGroups.set(phone, new Set());
        }
        phoneGroups.get(phone)!.add(opp.vendor_id);
      }

      let duplicateGroups = 0;
      let totalDuplicates = 0;
      let parallelLeads = 0;

      for (const [_, ids] of vendorPhoneGroups) {
        if (ids.length > 1) {
          duplicateGroups++;
          totalDuplicates += ids.length - 1; // Count extras as duplicates
        }
      }

      for (const [_, vendors] of phoneGroups) {
        if (vendors.size > 1) {
          parallelLeads++;
        }
      }

      return {
        total_opportunities: opportunities?.length || 0,
        unique_customers: phoneGroups.size,
        duplicate_groups: duplicateGroups,
        total_duplicates: totalDuplicates,
        parallel_leads: parallelLeads
      };
    }
  });
}

export function useDuplicateGroups() {
  return useQuery({
    queryKey: ['crm-duplicate-groups'],
    queryFn: async (): Promise<DuplicateGroup[]> => {
      // Get all active opportunities with customer and vendor data
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select(`
          id,
          title,
          value,
          created_at,
          stage,
          vendor_id,
          product_category,
          duplicate_of_id,
          customer:crm_customers!inner(phone, name),
          vendor:vendors!inner(name)
        `)
        .is('duplicate_of_id', null)
        .not('stage', 'in', '("closed_won","closed_lost")')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by phone + vendor_id + category
      const groups = new Map<string, DuplicateGroup>();

      for (const opp of opportunities || []) {
        const phone = (opp.customer as any)?.phone;
        const customerName = (opp.customer as any)?.name || 'Desconhecido';
        const vendorName = (opp.vendor as any)?.name || 'Desconhecido';
        
        if (!phone || !opp.vendor_id) continue;

        const key = `${phone}|${opp.vendor_id}|${opp.product_category || 'null'}`;

        if (!groups.has(key)) {
          groups.set(key, {
            customer_phone: phone,
            customer_name: customerName,
            vendor_id: opp.vendor_id,
            vendor_name: vendorName,
            product_category: opp.product_category,
            opportunities: []
          });
        }

        groups.get(key)!.opportunities.push({
          id: opp.id,
          title: opp.title,
          value: opp.value,
          created_at: opp.created_at,
          stage: opp.stage
        });
      }

      // Filter to only groups with duplicates
      return Array.from(groups.values()).filter(g => g.opportunities.length > 1);
    }
  });
}

export function useCleanupDuplicates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: 'preview' | 'execute') => {
      const { data, error } = await supabase.functions.invoke('crm-deduplication-cleanup', {
        body: { mode, limit: 100 }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, mode) => {
      if (mode === 'execute') {
        queryClient.invalidateQueries({ queryKey: ['crm-duplicate-stats'] });
        queryClient.invalidateQueries({ queryKey: ['crm-duplicate-groups'] });
        queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
        toast.success(`Limpeza concluída: ${data.duplicates_removed} duplicatas removidas`);
      }
    },
    onError: (error) => {
      toast.error(`Erro na limpeza: ${error.message}`);
    }
  });
}

export function useMarkAsDuplicate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      duplicateId, 
      keepId 
    }: { 
      duplicateId: string; 
      keepId: string;
    }) => {
      const { error } = await supabase
        .from('crm_opportunities')
        .update({
          duplicate_of_id: keepId,
          validation_status: 'duplicate_removed',
          updated_at: new Date().toISOString()
        })
        .eq('id', duplicateId);

      if (error) throw error;

      return { duplicateId, keepId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-duplicate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['crm-duplicate-groups'] });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      toast.success('Oportunidade marcada como duplicata');
    },
    onError: (error) => {
      toast.error(`Erro ao marcar duplicata: ${error.message}`);
    }
  });
}
