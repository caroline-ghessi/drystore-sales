import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

export interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  value: number;
  stage: OpportunityStage;
  probability: number | null;
  temperature: string | null;
  validation_status: string | null;
  product_category: Database['public']['Enums']['product_category'] | null;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  next_step: string | null;
  objections: string[] | null;
  customer?: {
    name: string;
    phone: string;
    city: string | null;
  } | null;
  vendor?: {
    name: string;
  } | null;
}

export interface OpportunitiesByStage {
  prospecting: Opportunity[];
  qualification: Opportunity[];
  proposal: Opportunity[];
  negotiation: Opportunity[];
  closed_won: Opportunity[];
  closed_lost: Opportunity[];
}

const STAGE_ORDER: OpportunityStage[] = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
];

export const STAGE_CONFIG = {
  prospecting: {
    label: 'Prospecção',
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  qualification: {
    label: 'Qualificação',
    color: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    border: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
  proposal: {
    label: 'Proposta',
    color: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    border: 'border-orange-200',
    textColor: 'text-orange-700',
  },
  negotiation: {
    label: 'Negociação',
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  closed_won: {
    label: 'Fechado (Ganho)',
    color: 'bg-green-600',
    bgLight: 'bg-green-50',
    border: 'border-green-200',
    textColor: 'text-green-700',
  },
  closed_lost: {
    label: 'Fechado (Perdido)',
    color: 'bg-red-500',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    textColor: 'text-red-700',
  },
} as const;

function groupByStage(opportunities: Opportunity[]): OpportunitiesByStage {
  const grouped: OpportunitiesByStage = {
    prospecting: [],
    qualification: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  };

  opportunities.forEach((opp) => {
    const stage = opp.stage || 'prospecting';
    if (grouped[stage]) {
      grouped[stage].push(opp);
    }
  });

  return grouped;
}

export function useOpportunities() {
  return useQuery({
    queryKey: ['crm-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select(`
          id,
          title,
          description,
          value,
          stage,
          probability,
          temperature,
          validation_status,
          product_category,
          expected_close_date,
          created_at,
          updated_at,
          next_step,
          objections,
          customer:crm_customers(name, phone, city),
          vendor:vendors(name)
        `)
        .not('validation_status', 'eq', 'rejected')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Process the response to handle the nested objects
      const opportunities: Opportunity[] = (data || []).map((item: any) => ({
        ...item,
        customer: item.customer?.[0] || item.customer || null,
        vendor: item.vendor?.[0] || item.vendor || null,
      }));

      return {
        all: opportunities,
        byStage: groupByStage(opportunities),
        stageOrder: STAGE_ORDER,
      };
    },
  });
}

export function useUpdateOpportunityStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      opportunityId,
      newStage,
    }: {
      opportunityId: string;
      newStage: OpportunityStage;
    }) => {
      const { error } = await supabase
        .from('crm_opportunities')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', opportunityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
  });
}

export function useOpportunitiesCount() {
  return useQuery({
    queryKey: ['crm-opportunities-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('crm_opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('validation_status', 'ai_generated');

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: string) => {
      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
  });
}
