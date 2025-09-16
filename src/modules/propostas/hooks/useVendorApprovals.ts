import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorApproval {
  id: string;
  proposal_id: string | null;
  user_id: string;
  approver_id: string | null;
  approval_type: string;
  status: string;
  requested_amount: number | null;
  approved_amount: number | null;
  justification: string | null;
  notes: string | null;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  user_profile?: {
    display_name: string;
    email: string;
  };
  approver_profile?: {
    display_name: string;
    email: string;
  };
  proposal?: {
    proposal_number: string;
    title: string;
    total_value: number;
    final_value: number;
    customer?: {
      name: string;
    };
  };
}

export function useVendorApprovals(status?: string) {
  return useQuery({
    queryKey: ['vendor-approvals', status],
    queryFn: async () => {
      let query = supabase
        .from('vendor_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar por status se necessário
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });
}

export function useCreateVendorApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (approvalData: {
      proposal_id?: string;
      user_id: string;
      approval_type: string;
      requested_amount: number;
      justification: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_approvals')
        .insert({
          user_id: approvalData.user_id,
          approval_type: approvalData.approval_type,
          requested_amount: approvalData.requested_amount,
          justification: approvalData.justification,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-approvals'] });
    },
  });
}

export function useApproveVendorApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      approvedAmount, 
      notes 
    }: { 
      id: string; 
      approvedAmount?: number;
      notes?: string;
    }) => {
      // Mock por enquanto
      console.log('Approve approval (mock):', { id, approvedAmount, notes });
      return { id, status: 'approved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-approvals'] });
    },
  });
}

export function useRejectVendorApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      notes 
    }: { 
      id: string; 
      notes?: string;
    }) => {
      // Mock por enquanto
      console.log('Reject approval (mock):', { id, notes });
      return { id, status: 'rejected' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-approvals'] });
    },
  });
}

// Hook para estatísticas das aprovações
export function useVendorApprovalsStats() {
  const { data: approvals = [] } = useVendorApprovals();

  const stats = {
    pendingCount: approvals.filter(a => a.status === 'pending').length,
    approvedCount: approvals.filter(a => a.status === 'approved').length,
    rejectedCount: approvals.filter(a => a.status === 'rejected').length,
    totalRequested: approvals.reduce((sum, a) => sum + (a.requested_amount || 0), 0),
    totalApproved: approvals
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + (a.approved_amount || 0), 0),
  };

  return stats;
}