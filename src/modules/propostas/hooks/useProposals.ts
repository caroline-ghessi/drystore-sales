import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Json } from '@/integrations/supabase/types';

export interface ProposalFromDB {
  id: string;
  proposal_number: string;
  title: string;
  description: string;
  project_type: string;
  total_value: number;
  discount_value: number;
  discount_percentage: number;
  final_value: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'viewed' | 'under_review';
  valid_until: string;
  acceptance_link: string;
  client_data: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
  };
}

export function useProposals() {
  const { isAdmin } = useUserPermissions();

  return useQuery({
    queryKey: ['proposals', isAdmin],
    queryFn: async (): Promise<ProposalFromDB[]> => {
      console.log('Fetching proposals with admin status:', isAdmin);
      
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          profiles:created_by (
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching proposals:', error);
        throw new Error('Erro ao buscar propostas');
      }

      console.log(`Fetched ${data?.length || 0} proposals`);
      return data || [];
    },
    enabled: true,
  });
}

export function useProposalStats() {
  const { data: proposals = [] } = useProposals();

  const stats = {
    total: proposals.length,
    approved: proposals.filter(p => p.status === 'accepted').length,
    pending: proposals.filter(p => p.status === 'draft' || p.status === 'sent').length,
    visualized: proposals.filter(p => p.status === 'sent').length,
    totalValue: proposals.reduce((sum, p) => sum + (p.final_value || 0), 0),
  };

  return stats;
}