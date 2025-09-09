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
      // Mock data até a migração ser executada
      const mockApprovals: VendorApproval[] = [
        {
          id: '1',
          proposal_id: 'prop-001',
          user_id: 'user-001',
          approver_id: null,
          approval_type: 'discount',
          status: 'pending',
          requested_amount: 7500,
          approved_amount: null,
          justification: 'Cliente solicitou desconto para fechar hoje',
          notes: null,
          requested_at: '2024-01-15T10:30:00Z',
          responded_at: null,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          user_profile: {
            display_name: 'João Silva',
            email: 'joao@empresa.com'
          },
          proposal: {
            proposal_number: 'PROP-2024-001',
            title: 'Proposta Solar Residencial',
            total_value: 50000,
            final_value: 42500,
            customer: {
              name: 'Construtora ABC Ltda'
            }
          }
        },
        {
          id: '2',
          proposal_id: 'prop-002',
          user_id: 'user-002',
          approver_id: 'admin-001',
          approval_type: 'discount',
          status: 'approved',
          requested_amount: 9000,
          approved_amount: 9000,
          justification: 'Concorrência ofereceu preço menor',
          notes: 'Aprovado considerando histórico do cliente',
          requested_at: '2024-01-14T15:45:00Z',
          responded_at: '2024-01-14T16:20:00Z',
          created_at: '2024-01-14T15:45:00Z',
          updated_at: '2024-01-14T16:20:00Z',
          user_profile: {
            display_name: 'Maria Santos',
            email: 'maria@empresa.com'
          },
          approver_profile: {
            display_name: 'Admin Master',
            email: 'admin@empresa.com'
          },
          proposal: {
            proposal_number: 'PROP-2024-002',
            title: 'Proposta Drywall Comercial',
            total_value: 75000,
            final_value: 66000,
            customer: {
              name: 'Incorporadora XYZ'
            }
          }
        }
      ];

      // Filtrar por status se necessário
      if (status && status !== 'all') {
        return mockApprovals.filter(approval => approval.status === status);
      }

      return mockApprovals;
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
      // Mock por enquanto
      console.log('Create approval (mock):', approvalData);
      return { id: 'new-approval', ...approvalData };
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