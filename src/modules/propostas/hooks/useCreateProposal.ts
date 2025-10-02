import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createProposalWithCustomer, CustomerData } from '../services/customerService';
import { Database } from '@/integrations/supabase/types';

type ProjectType = Database['public']['Enums']['product_category'];
type ProposalStatus = Database['public']['Enums']['proposal_status'];

interface CreateProposalInput {
  title: string;
  description?: string;
  project_type?: ProjectType | null;
  total_value?: number;
  discount_value?: number;
  discount_percentage?: number;
  final_value?: number;
  status?: ProposalStatus;
  valid_until?: string;
  clientData: CustomerData;
}

/**
 * Hook para criar propostas garantindo que o customer_id seja sempre preenchido.
 * 
 * Uso:
 * ```tsx
 * const { mutate: createProposal, isPending } = useCreateProposal();
 * 
 * createProposal({
 *   title: 'Proposta Solar',
 *   project_type: 'solar',
 *   total_value: 50000,
 *   final_value: 45000,
 *   clientData: {
 *     name: 'João Silva',
 *     phone: '51981223033',
 *     email: 'joao@example.com',
 *   }
 * });
 * ```
 */
export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { clientData, ...proposalData } = input;

      // Criar proposta garantindo que customer_id seja preenchido
      const proposal = await createProposalWithCustomer(
        {
          ...proposalData,
          created_by: user.id,
        },
        clientData
      );

      return proposal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({
        title: 'Proposta criada',
        description: `Proposta criada com sucesso para o cliente.`,
      });
      return data;
    },
    onError: (error: any) => {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Erro ao criar proposta',
        description: error.message || 'Não foi possível criar a proposta.',
        variant: 'destructive',
      });
    },
  });
}
